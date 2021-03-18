"use strict";

import * as path from "path";
import * as vscode from "vscode";

import { FileHelper, IFileResolver } from "./FileHelper";
import { Helper, IFormat } from "./helper";
import { fdir, OnlyCountsOutput, PathsOutput } from "fdir";
import { SassHelper } from "./SassCompileHelper";
import { StatusBarUi } from "./StatusbarUi";
import { ErrorLogger, OutputWindow } from "./VscodeExtensions";

import autoprefixer from "autoprefixer";
import BrowserslistError from "browserslist/error";
import fs from "fs";
import picomatch from "picomatch";
import postcss from "postcss";

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

    async StartWatching(): Promise<void> {
        const compileOnWatch = Helper.getConfigSettings<boolean>("compileOnWatch");

        if (!this.isWatching) {
            this.isWatching = !this.isWatching;

            if (compileOnWatch) {
                await this.compileAllFiles();
            }
        }

        this.revertUIToWatchingStatusNow();
    }

    StopWatching(): void {
        if (this.isWatching) {
            this.isWatching = !this.isWatching;
        }

        this.revertUIToWatchingStatusNow();
    }

    openOutputWindow(): void {
        OutputWindow.Show(null, null, true);
    }

    async createIssue(): Promise<void> {
        await this._logger.InitiateIssueCreator();
    }

    /**
     * Waiting to see if Autoprefixer will add my changes
    async browserslistChecks(): Promise<void> {
        try {
            const autoprefixerTarget = Helper.getConfigSettings<Array<string> | boolean>(
                    "autoprefix"
                ),
                filePath = vscode.window.activeTextEditor.document.fileName;

            if (
                autoprefixerTarget === true &&
                (
                    filePath.endsWith(`${path.sep}package.json`) ||
                    filePath.endsWith(`${path.sep}.browserslistrc`)
                )
            )
                autoprefixer.clearBrowserslistCaches();

        } catch (err) {
            await this._logger.LogIssueWithAlert(
                `Unhandled error while clearing browserlist cache. Error message: ${err.message}`,
                {
                    triggeringFile: vscode.window.activeTextEditor.document.fileName,
                    error: ErrorLogger.PrepErrorForLogging(err),
                }
            );
        }
    }
     */

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
            const result = await Promise.all(
                formats.map(async (format) => {
                    // Each format
                    const options = this.getCssStyle(format.format),
                        cssMapUri = await this.generateCssAndMapUri(sassPath, format);
                    return await this.GenerateCssAndMap(
                        sassPath,
                        cssMapUri.css,
                        cssMapUri.map,
                        options
                    );
                })
            );

            if (result.indexOf(false) < 0) StatusBarUi.compilationSuccess(this.isWatching);
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

            OutputWindow.Show(
                "Change detected - " + new Date().toLocaleString(),
                [path.basename(currentFile)],
                showOutputWindow
            );

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

    private getCssStyle(format: "compressed" | "expanded" = "expanded") {
        return SassHelper.targetCssFormat(format);
    }

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
            autoprefixerTarget = Helper.getConfigSettings<Array<string> | boolean>("autoprefix"),
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

        if (autoprefixerTarget != false) {
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
                } else {
                    throw err;
                }
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
        browsers: Array<string> | true
    ): Promise<{ css: string; map: string }> {
        const showOutputWindow = Helper.getConfigSettings<boolean>("showOutputWindow"),
            generateMap = Helper.getConfigSettings<boolean>("generateMap"),
            prefixer = postcss(
                autoprefixer({
                    overrideBrowserslist: browsers === true ? null : browsers,
                })
            );

        // TODO: REMOVE - when autoprefixer can stop caching the browsers
        const oldBrowserlistCache = process.env.BROWSERSLIST_DISABLE_CACHE;
        process.env.BROWSERSLIST_DISABLE_CACHE = "1";

        try {
            const result = await prefixer.process(css, {
                from: filePath,
                to: savePath,
                map: {
                    inline: false,
                    prev: map,
                },
            });

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
        } finally {
            process.env.BROWSERSLIST_DISABLE_CACHE = oldBrowserlistCache;
        }
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
        let fileList = ["**/*.s[a|c]ss"];

        if (includeItems && includeItems.length) {
            fileList = includeItems.concat("**/_*.s[a|c]ss");
        }

        const fileResult = await Promise.all(
            vscode.workspace.workspaceFolders.map(async (folder) => {
                const forceBaseDirectory = Helper.getConfigSettings<string | null>(
                    "forceBaseDirectory",
                    folder
                );
                let basePath = folder.uri.fsPath;

                if (
                    forceBaseDirectory &&
                    forceBaseDirectory.length > 1
                ) {
                    basePath = path.resolve(
                        basePath,
                        [ "\\", "/" ].indexOf(forceBaseDirectory.substr(0, 1))
                            ? forceBaseDirectory.substr(1)
                            : forceBaseDirectory
                    );

                    try
                    {
                        if (!(await fs.promises.stat(basePath)).isDirectory()) {
                            OutputWindow.Show(
                                "Error with your `forceBaseDirectory` setting",
                                [
                                    `Path is not a folder: ${basePath}`,
                                    `Setting: "${forceBaseDirectory}"`,
                                    `Workspace folder: ${folder.name}`,
                                ],
                                true
                            );

                            return null;
                        }
                    }
                    catch
                    {
                        OutputWindow.Show(
                            "Error with your `forceBaseDirectory` setting",
                            [
                                `Can not find path: ${basePath}`,
                                `Setting: "${forceBaseDirectory}"`,
                                `Workspace folder: ${folder.name}`,
                            ],
                            true
                        );

                        return null;
                    }
                }

                // @ts-ignore ts2322 => string doesn't match string[] (False negative as string[] is allowed)
                const isMatch = picomatch(fileList, { ignore: excludeItems, dot: true });

                return (
                    ((await new fdir()
                        .crawlWithOptions(basePath, {
                            includeBasePath: true,
                            resolvePaths: true,
                            onlyCounts: true,
                            filters: [
                                (path) => path.endsWith(".scss") || path.endsWith(".sass"),
                                (path) => isMatch(path),
                                (path) => path === sassPath,
                            ],
                        })
                        .withPromise()) as OnlyCountsOutput).files > 0
                );
            })
        );

        // There was an error so stop processing
        if (fileResult.includes(null)) {
            return true;
        }

        // If doesn't include true then it's not been found
        return !fileResult.includes(true);
    }

    private async getSassFiles(
        queryPattern: string | string[] = "**/[^_]*.s[a|c]ss",
        isQueryPatternFixed = false,
        isDebugging = false
    ): Promise<string[]> {
        const excludedList = isDebugging
                ? ["**/node_modules/**", ".vscode/**"]
                : Helper.getConfigSettings<string[]>("excludeList"),
            includeItems = Helper.getConfigSettings<string[] | null>("includeItems");

        if (!isQueryPatternFixed && includeItems && includeItems.length) {
            queryPattern = includeItems;
        }

        const fileList: string[] = [];

        (
            await Promise.all(
                vscode.workspace.workspaceFolders.map(async (folder) => {
                    const forceBaseDirectory = Helper.getConfigSettings<string | null>(
                        "forceBaseDirectory",
                        folder
                    );
                    let basePath = folder.uri.fsPath;

                    if (forceBaseDirectory) {
                        basePath = path.resolve(basePath, forceBaseDirectory);

                        if (!fs.existsSync(basePath)) {
                            OutputWindow.Show(
                                "Error with your `forceBaseDirectory` setting",
                                [
                                    `Can not find path: ${basePath}`,
                                    `Setting: "${forceBaseDirectory}"`,
                                    `Workspace folder: ${folder.name}`,
                                ],
                                true
                            );

                            return [];
                        }
                    }

                    // @ts-ignore ts2322 => string doesn't match string[] (False negative as string[] is allowed)
                    const isMatch = picomatch(queryPattern, { ignore: excludedList });

                    return (await new fdir()
                        .crawlWithOptions(basePath, {
                            includeBasePath: true,
                            resolvePaths: true,
                            filters: [
                                (path) => path.endsWith(".scss") || path.endsWith(".sass"),
                                (path) => isMatch(path),
                            ],
                        })
                        .withPromise()) as PathsOutput;
                })
            )
        ).forEach((files) => {
            files.forEach((file) => {
                fileList.push(file);
            });
        });

        return fileList;
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
            vscode.workspace.workspaceFolders.map((folder) => {
                outputInfo.push(`[${folder.index}] ${folder.name}\n${folder.uri.fsPath}`);
            });

            outputInfo.push("--------------------", "Included SASS Files", "--------------------");
            (await this.getSassFiles()).map((file) => {
                outputInfo.push(file);
            });

            outputInfo.push(
                "--------------------",
                "Included Partial SASS Files",
                "--------------------"
            );
            (await this.getSassFiles("**/_*.s[a|c]ss", true)).map((file) => {
                outputInfo.push(file);
            });

            outputInfo.push("--------------------", "Excluded SASS Files", "--------------------");
            if (exclusionList.length > 0) {
                (await this.getSassFiles(exclusionList, true, true)).map((file) => {
                    outputInfo.push(file);
                });
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
