"use strict";

import * as autoprefixer from "autoprefixer";
import * as glob from "glob";
import * as path from "path";
import * as vscode from "vscode";

import { FileHelper, IFileResolver } from "./FileHelper";
import { Helper, IFormat } from "./helper";
import { ErrorLogger, OutputWindow, WindowPopout } from "./VscodeExtensions";
import { SassHelper } from "./SassCompileHelper";
import { StatusBarUi } from "./StatusbarUi";
import { ProcessOptions } from "postcss";

import postcss from "postcss";

import BrowserslistError = require("browserslist/error");

export class AppModel {
    private isWatching: boolean;
    private _logger: ErrorLogger;

    constructor(workplaceState: vscode.Memento) {
        this.isWatching = Helper.getConfigSettings<boolean>("watchOnLaunch");

        this._logger = new ErrorLogger(workplaceState);

        if (this.isWatching)
            OutputWindow.Show(
                "Watching...",
                null,
                Helper.getConfigSettings<boolean>("showOutputWindow")
            );

        StatusBarUi.init(this.isWatching);
    }

    StartWatching(): void {
        const compileOnWatch = Helper.getConfigSettings<boolean>("compileOnWatch");

        if (this.isWatching) {
            WindowPopout.Inform("Already watching...");
        } else {
            this.isWatching = !this.isWatching;

            if (compileOnWatch) {
                this.compileAllFiles();
            } else {
                this.revertUIToWatchingStatusNow();
            }
        }
    }

    StopWatching(): void {
        if (this.isWatching) {
            this.isWatching = !this.isWatching;
            this.revertUIToWatchingStatusNow();
        } else {
            WindowPopout.Inform("Not watching...");
        }
    }

    openOutputWindow(): void {
        OutputWindow.Show(null, null, true);
    }

    createIssue(): void {
        this._logger.InitiateIssueCreator();
    }

    private getCssStyle(format: "compressed" | "expanded" = "expanded") {
        return SassHelper.targetCssFormat(format);
    }

    //#region Compilation functions

    //#region Public

    /**
     * Compile all files.
     */
    async compileAllFiles(): Promise<void> {
        try {
            StatusBarUi.working();

            const showOutputWindow = Helper.getConfigSettings<boolean>("showOutputWindow");

            await this.GenerateAllCssAndMap(showOutputWindow);
        } catch (err) {
            await this._logger.LogIssueWithAlert(
                `Unhandled error while compiling all files. Error message: ${err.message}`,
                {
                    files: await this.getSassFiles(),
                    error: ErrorLogger.PrepErrorForLogging(err),
                }
            );
        }

        this.revertUIToWatchingStatusNow();
    }

    /**
     * Compiles the currently active file
     */
    async compileCurrentFile(): Promise<void> {
        const showOutputWindow = Helper.getConfigSettings<boolean>("showOutputWindow");

        try {
            if (!vscode.window.activeTextEditor) {
                StatusBarUi.customMessage(
                    "No file open",
                    "No file is open, ensure a file is open in the editor window",
                    "warning"
                );
                OutputWindow.Show(
                    "No active file",
                    ["There isn't an active editor window to process"],
                    showOutputWindow
                );

                this.revertUIToWatchingStatus();

                return;
            }

            const sassPath = vscode.window.activeTextEditor.document.fileName;

            if (!this.isSassFile(vscode.window.activeTextEditor.document.fileName)) {
                if (this.isSassFile(vscode.window.activeTextEditor.document.fileName, true))
                    StatusBarUi.customMessage(
                        "Can't process partial Sass",
                        "The file currently open in the editor window is a partial sass file, these aren't processed singly",
                        "warning"
                    );
                else
                    StatusBarUi.customMessage(
                        "Not a Sass file",
                        "The file currently open in the editor window isn't a sass file",
                        "warning"
                    );

                this.revertUIToWatchingStatus();

                return;
            }

            StatusBarUi.working("Processing single file...");
            OutputWindow.Show(
                "Processing the current file",
                [`Path: ${sassPath}`],
                showOutputWindow
            );

            const formats = Helper.getConfigSettings<IFormat[]>("formats");
            await Promise.all(
                formats.map(async (format) => {
                    // Each format
                    const options = this.getCssStyle(format.format),
                        cssMapUri = await this.generateCssAndMapUri(sassPath, format);
                    await this.GenerateCssAndMap(sassPath, cssMapUri.css, cssMapUri.map, options);
                })
            );

            StatusBarUi.compilationSuccess(this.isWatching);
        } catch (err) {
            const sassPath = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document.fileName
                : "/* NO ACTIVE FILE, PROCESSING SHOULD NOT HAVE OCCURRED */";

            await this._logger.LogIssueWithAlert(
                `Unhandled error while compiling the active file. Error message: ${err.message}`,
                {
                    file: sassPath,
                    error: ErrorLogger.PrepErrorForLogging(err),
                }
            );
        }
    }

    /**
     * Compiles the file that has just been saved
     */
    async compileOnSave(): Promise<void> {
        if (!this.isWatching) return;

        const showOutputWindow = Helper.getConfigSettings<boolean>("showOutputWindow");

        try {
            const currentFile = vscode.window.activeTextEditor.document.fileName;

            if (!this.isSassFile(currentFile, true) || (await this.isSassFileExcluded(currentFile)))
                return;

            OutputWindow.Show("Change detected...", [path.basename(currentFile)], showOutputWindow);

            if (this.isSassFile(currentFile)) {
                const formats = Helper.getConfigSettings<IFormat[]>("formats"),
                    sassPath = currentFile;

                await Promise.all(
                    formats.map(async (format) => {
                        // Each format
                        const options = this.getCssStyle(format.format),
                            cssMapPath = await this.generateCssAndMapUri(sassPath, format);

                        await this.GenerateCssAndMap(
                            sassPath,
                            cssMapPath.css,
                            cssMapPath.map,
                            options
                        );
                    })
                );
            } else {
                // Partial Or not
                await this.GenerateAllCssAndMap(showOutputWindow);
            }
        } catch (err) {
            await this._logger.LogIssueWithAlert(
                `Unhandled error while compiling the saved changes. Error message: ${err.message}`,
                {
                    triggeringFile: vscode.window.activeTextEditor.document.fileName,
                    allFiles: await this.getSassFiles(),
                    error: ErrorLogger.PrepErrorForLogging(err),
                }
            );
        }

        this.revertUIToWatchingStatus();
    }

    //#endregion Public

    //#region Private

    /**
     * To Generate one One Css & Map file from Sass/Scss
     * @param SassPath Sass/Scss file URI (string)
     * @param targetCssUri Target CSS file URI (string)
     * @param mapFileUri Target MAP file URI (string)
     * @param options - Object - It includes target CSS style and some more.
     */
    private async GenerateCssAndMap(
        SassPath: string,
        targetCssUri: string,
        mapFileUri: string,
        options
    ) {
        const generateMap = Helper.getConfigSettings<boolean>("generateMap"),
            autoprefixerTarget = Helper.getConfigSettings<Array<string>>("autoprefix"),
            showOutputWindow = Helper.getConfigSettings<boolean>("showOutputWindow"),
            compileResult = SassHelper.instance.compileOne(SassPath, mapFileUri, options),
            promises: Promise<IFileResolver>[] = [];

        if (compileResult.errorString !== null) {
            OutputWindow.Show("Compilation Error", [compileResult.errorString], showOutputWindow);
            StatusBarUi.compilationError(this.isWatching);

            if (!showOutputWindow)
                vscode.window.setStatusBarMessage(compileResult.errorString.split("\n")[0], 4500);

            return false;
        }

        let css: string = compileResult.result.css.toString(),
            map: string | null = compileResult.result.map?.toString();

        if (autoprefixerTarget) {
            try {
                const autoprefixerResult = await this.autoprefix(
                    css,
                    map,
                    SassPath,
                    targetCssUri,
                    autoprefixerTarget
                );
                css = autoprefixerResult.css;
                map = autoprefixerResult.map;
            } catch (err) {
                if (err instanceof BrowserslistError) {
                    OutputWindow.Show(
                        "Autoprefix error. Your changes have not been saved",
                        [`Message: ${err.message}`],
                        true,
                        true
                    );
                    return false;
                } else throw err;
            }
        } else if (generateMap) {
            const pMap: { file: string } = JSON.parse(map);
            pMap.file = `${path.basename(targetCssUri)}.map`;
            map = JSON.stringify(pMap);
        }

        if (generateMap) {
            css += `/*# sourceMappingURL=${path.basename(targetCssUri)}.map */`;
            promises.push(FileHelper.writeToOneFile(mapFileUri, map));
        }

        promises.push(FileHelper.writeToOneFile(targetCssUri, css));

        const fileResolvers = await Promise.all(promises);

        OutputWindow.Show("Generated :", null, showOutputWindow, false);
        StatusBarUi.compilationSuccess(this.isWatching);

        fileResolvers.forEach((fileResolver) => {
            if (fileResolver.Exception) {
                OutputWindow.Show(
                    "Error:",
                    [
                        fileResolver.Exception.errno.toString(),
                        fileResolver.Exception.path,
                        fileResolver.Exception.message,
                    ],
                    true
                );
                console.error("error :", fileResolver);
            } else {
                OutputWindow.Show(null, [fileResolver.FileUri], false, false);
            }
        });

        OutputWindow.Show(null, null, false, true);

        return true;
    }

    /**
     * To compile all Sass/scss files
     * @param popUpOutputWindow To control output window.
     */
    private async GenerateAllCssAndMap(popUpOutputWindow: boolean) {
        const formats = Helper.getConfigSettings<IFormat[]>("formats"),
            sassPaths = await this.getSassFiles();

        OutputWindow.Show("Compiling Sass/Scss Files: ", sassPaths, popUpOutputWindow);

        await Promise.all(
            sassPaths.map(async (sassPath) => {
                await Promise.all(
                    formats.map(async (format) => {
                        // Each format
                        const options = this.getCssStyle(format.format),
                            cssMapUri = await this.generateCssAndMapUri(sassPath, format);

                        await this.GenerateCssAndMap(
                            sassPath,
                            cssMapUri.css,
                            cssMapUri.map,
                            options
                        );
                    })
                );
            })
        );
    }

    /**
     * Generate a full save path for the final css & map files
     * @param filePath The path to the current SASS file
     * @param savePath The path we're going to save to
     * @param _extensionName The file extension we're going to use
     */
    private async generateCssAndMapUri(filePath: string, format: IFormat) {
        const extensionName = format.extensionName || ".css";

        let generatedUri = null;

        let workspaceRoot: string;
        if (vscode.workspace.workspaceFolders) {
            const foundInFolders = (
                await Promise.all(
                    vscode.workspace.workspaceFolders.map(async (folder) => {
                        if (filePath.startsWith(folder.uri.fsPath)) return folder.uri.fsPath;

                        return null;
                    })
                )
            ).filter((x) => x !== null);

            if (foundInFolders.length == 0) {
                workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
                OutputWindow.Show(
                    "Warning: File is not in the workspace",
                    [
                        "The file will be saved relative to the first folder in your workspace",
                        `Path: ${workspaceRoot}`,
                    ],
                    true
                );
            } else {
                workspaceRoot = foundInFolders[0];
            }
        } else {
            workspaceRoot = path.basename(vscode.window.activeTextEditor.document.fileName);
            OutputWindow.Show(
                "Warning: There is no active workspace",
                [
                    "The file will be saved relative to file being processed",
                    `Path: ${workspaceRoot}`,
                ],
                true
            );
        }

        // If SavePath is NULL, CSS uri will be same location of SASS.
        if (format.savePath) {
            if (format.savePath.startsWith("~"))
                generatedUri = path.join(path.dirname(filePath), format.savePath.substring(1));
            else generatedUri = path.join(workspaceRoot, format.savePath);

            FileHelper.MakeDirIfNotAvailable(generatedUri);

            filePath = path.join(generatedUri, path.basename(filePath));
        } else if (
            format.savePathSegmentKeys &&
            format.savePathSegmentKeys.length &&
            format.savePathReplaceSegmentsWith
        ) {
            generatedUri = path.join(
                workspaceRoot,
                path
                    .dirname(filePath)
                    .substring(workspaceRoot.length + 1)
                    .split(path.sep)
                    .map((folder) => {
                        return format.savePathSegmentKeys.indexOf(folder) >= 0
                            ? format.savePathReplaceSegmentsWith
                            : folder;
                    })
                    .join(path.sep)
            );

            FileHelper.MakeDirIfNotAvailable(generatedUri);

            filePath = path.join(generatedUri, path.basename(filePath));
        }

        const cssUri = filePath.substring(0, filePath.lastIndexOf(".")) + extensionName;

        return {
            css: cssUri,
            map: cssUri + ".map",
        };
    }

    /**
     * Autoprefixes CSS properties
     *
     * @param css String representation of CSS to transform
     * @param target What browsers to be targeted, as supported by [Browserslist](https://github.com/ai/browserslist)
     */
    private async autoprefix(
        css: string,
        map: string,
        filePath: string,
        savePath: string,
        browsers: Array<string>
    ): Promise<{ css: string; map: string }> {
        const showOutputWindow = Helper.getConfigSettings<boolean>("showOutputWindow"),
            generateMap = Helper.getConfigSettings<boolean>("generateMap"),
            prefixer = postcss(
                // @ts-ignore
                autoprefixer({
                    overrideBrowserslist: browsers,
                    grid: "autoplace",
                })
            );

        const result = 
            await prefixer.process(
                css, 
                {
                    from: filePath,
                    to: savePath,
                    map: {
                        inline: false,
                        prev: map,
                    },
                }
            );

        result.warnings().forEach((warn) => {
            const body: string[] = [];

            if (warn.node.source?.input.file) {
                body.push(warn.node.source.input.file + `:${warn.line}:${warn.column}`);
            }

            body.push(warn.text);

            OutputWindow.Show(`Autoprefix ${warn.type || "error"}`, body, showOutputWindow);
        });

        return {
            css: result.css,
            map: generateMap ? result.map.toString() : null,
        };
    }

    //#endregion Private

    //#endregion Compilation functions

    //#region UI manipulation functions

    private revertUIToWatchingStatus() {
        setTimeout(() => {
            this.revertUIToWatchingStatusNow();
        }, 3000);
    }

    private revertUIToWatchingStatusNow() {
        const showOutputWindow = Helper.getConfigSettings<boolean>("showOutputWindow");

        if (this.isWatching) {
            StatusBarUi.watching();
            OutputWindow.Show("Watching...", null, showOutputWindow);
        } else {
            StatusBarUi.notWatching();
            OutputWindow.Show("Not Watching...", null, showOutputWindow);
        }
    }

    //#endregion UI manipulation functions

    //#region Fetch & check SASS functions

    //#region Private

    private isSassFile(pathUrl: string, partialSass = false): boolean {
        const filename = path.basename(pathUrl);
        return (
            (partialSass || !filename.startsWith("_")) &&
            (filename.endsWith("sass") || filename.endsWith("scss"))
        );
    }

    private async isSassFileExcluded(sassPath: string): Promise<boolean> {
        const excludeItems = Helper.getConfigSettings<string[]>("excludeList"),
            includeItems = Helper.getConfigSettings<string[] | null>("includeItems");
        let fileList: string[];

        if (includeItems && includeItems.length) {
            fileList = includeItems.concat("**/_*.s[a|c]ss");
        } else fileList = excludeItems;

        const fileCount = (
            await Promise.all(
                vscode.workspace.workspaceFolders.map(async (folder) => {
                    return await new Promise((resolve: (value: number) => void) => {
                        glob(
                            `{${fileList.join(",")}}`,
                            {
                                ignore: includeItems && includeItems.length ? excludeItems : null,
                                mark: true,
                                cwd: folder.uri.fsPath,
                            },
                            (err, files: string[]) => {
                                if (err) {
                                    OutputWindow.Show(
                                        "Error whilst searching for files",
                                        [
                                            `Workspace folder: ${folder.name}`,
                                            err.message,
                                            err.stack,
                                        ],
                                        true
                                    );
                                    resolve(0);
                                    return;
                                }
                                resolve(
                                    files.filter(
                                        (x) => path.join(folder.uri.fsPath, x) === sassPath
                                    ).length
                                );
                            }
                        );
                    });
                })
            )
        ).reduce((a, b) => a + b, 0);

        if (includeItems && includeItems.length) return fileCount === 0;

        return fileCount > 0;
    }

    private async getSassFiles(
        queryPattern = "**/[^_]*.s[a|c]ss",
        isQueryPatternFixed = false,
        isDebugging = false
    ): Promise<string[]> {
        const excludedList = isDebugging
                ? ["**/node_modules/**", ".vscode/**"]
                : Helper.getConfigSettings<string[]>("excludeList"),
            includeItems = Helper.getConfigSettings<string[] | null>("includeItems");

        if (!isQueryPatternFixed && includeItems && includeItems.length) {
            if (includeItems.length === 1) {
                queryPattern = includeItems[0];
            } else {
                queryPattern = `{${includeItems.join(",")}}`;
            }
        }

        const files: string[] = [];

        await Promise.all(
            vscode.workspace.workspaceFolders.map(async (folder) => {
                (
                    await new Promise((resolve: (value: string[]) => void) => {
                        glob(
                            queryPattern,
                            {
                                ignore: excludedList,
                                mark: true,
                                cwd: folder.uri.fsPath,
                            },
                            (err, files: string[]) => {
                                if (err) {
                                    OutputWindow.Show(
                                        "Error whilst searching for files",
                                        [
                                            `Workspace folder: ${folder.name}`,
                                            err.message,
                                            err.stack,
                                        ],
                                        true
                                    );
                                    resolve([]);
                                    return;
                                }
                                const filePaths = files
                                    .filter((file) =>
                                        this.isSassFile(file, isDebugging || isQueryPatternFixed)
                                    )
                                    .map((file) => path.join(folder.uri.fsPath, file));
                                return resolve(filePaths || []);
                            }
                        );
                    })
                ).forEach((file) => files.push(file));
            })
        );

        return files;
    }

    //#endregion Private

    //#endregion Fetch & check SASS functions

    //#region Debugging

    async debugInclusion(): Promise<void> {
        OutputWindow.Show("Checking current file", [], true, false);

        try {
            if (!vscode.window.activeTextEditor) {
                OutputWindow.Show(
                    "No active file",
                    [
                        "There isn't an active editor window to process",
                        "Click an open file so it can be checked",
                    ],
                    true,
                    true
                );

                return;
            }

            const sassPath = vscode.window.activeTextEditor.document.fileName;

            OutputWindow.Show(sassPath, [], true);

            if (!this.isSassFile(sassPath, true)) {
                OutputWindow.Show(
                    "Not a Sass file",
                    ["The file currently open in the editor window isn't a sass file"],
                    true
                );
            } else if (await this.isSassFileExcluded(sassPath)) {
                OutputWindow.Show(
                    "File excluded",
                    [
                        "The file is excluded based on your settings, please check your configuration",
                    ],
                    true
                );
            } else {
                OutputWindow.Show(
                    "File should get processed",
                    ["If the file isn't being processed, run `liveSass.command.debugFileList`"],
                    true
                );
            }
        } catch (err) {
            const sassPath = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document.fileName
                : "/* NO ACTIVE FILE, MESSAGE SHOULD HAVE BEEN THROWN */";

            await this._logger.LogIssueWithAlert(
                `Unhandled error while checking the active file. Error message: ${err.message}`,
                {
                    file: sassPath,
                    error: ErrorLogger.PrepErrorForLogging(err),
                }
            );
        }
    }

    async debugFileList(): Promise<void> {
        try {
            const outputInfo: string[] = [],
                exclusionList = Helper.getConfigSettings<string[]>("excludeList");

            if (vscode.window.activeTextEditor) {
                outputInfo.push(
                    "--------------------",
                    "Current File",
                    "--------------------",
                    vscode.window.activeTextEditor.document.fileName
                );
            }

            outputInfo.push(
                "--------------------",
                "Current Include/Exclude Settings",
                "--------------------",
                `Include: [ ${
                    Helper.getConfigSettings<string[] | null>("includeItems")?.join(", ") ?? "NULL"
                } ]`,
                `Exclude: [ ${exclusionList.join(", ")} ]`
            );

            outputInfo.push("--------------------", "Workspace Folders", "--------------------");
            await Promise.all(
                vscode.workspace.workspaceFolders.map(async (folder) => {
                    outputInfo.push(`[${folder.index}] ${folder.name}\n${folder.uri.fsPath}`);
                })
            );

            outputInfo.push("--------------------", "Included SASS Files", "--------------------");
            await Promise.all(
                (await this.getSassFiles()).map(async (file) => {
                    outputInfo.push(file);
                })
            );

            outputInfo.push(
                "--------------------",
                "Included Partial SASS Files",
                "--------------------"
            );
            await Promise.all(
                (await this.getSassFiles("**/_*.s[a|c]ss", true)).map(async (file) => {
                    outputInfo.push(file);
                })
            );

            outputInfo.push("--------------------", "Excluded SASS Files", "--------------------");
            if (exclusionList.length > 0) {
                await Promise.all(
                    (await this.getSassFiles(`{${exclusionList.join(",")}}`, true, true)).map(
                        async (file) => {
                            outputInfo.push(file);
                        }
                    )
                );
            } else {
                outputInfo.push("NONE");
            }

            OutputWindow.Show("Extension Info", outputInfo, true);
        } catch (err) {
            const sassPath = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document.fileName
                : "/* NO ACTIVE FILE, DETAILS BELOW */";

            await this._logger.LogIssueWithAlert(
                `Unhandled error while checking the active file. Error message: ${err.message}`,
                {
                    file: sassPath,
                    error: ErrorLogger.PrepErrorForLogging(err),
                }
            );
        }
    }

    //#endregion Debugging

    dispose(): void {
        StatusBarUi.dispose();
        OutputWindow.dispose();
    }
}
