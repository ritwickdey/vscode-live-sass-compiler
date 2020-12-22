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

export class AppModel {
    private isWatching: boolean;
    private _logger: ErrorLogger;

    constructor(workplaceState: vscode.Memento) {
        this.isWatching = Helper.getConfigSettings<boolean>("watchOnLaunch");

        this._logger = new ErrorLogger(workplaceState);

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

    static get basePath(): string {
        return vscode.workspace.rootPath || path.basename(vscode.window.activeTextEditor.document.fileName);
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

            const sassPath = vscode.window.activeTextEditor.document.uri.fsPath;

            if (!this.isSassFile(vscode.window.activeTextEditor.document.uri.fsPath)) {
                if (this.isSassFile(vscode.window.activeTextEditor.document.uri.fsPath, true))
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

            const formats = Helper.getConfigSettings<IFormat[]>("formats");

            StatusBarUi.working("Processing single file...");
            OutputWindow.Show("Processing the current file", [`Path: ${sassPath}`], showOutputWindow);

            const promises: Promise<boolean>[] = [];
            formats.forEach((format) => {
                // Each format
                const options = this.getCssStyle(format.format);
                const cssMapUri = this.generateCssAndMapUri(sassPath, format);
                promises.push(this.GenerateCssAndMap(sassPath, cssMapUri.css, cssMapUri.map, options));
            });

            await Promise.all(promises);

            StatusBarUi.compilationSuccess(this.isWatching);
        } catch (err) {
            const sassPath = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document.uri.fsPath
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

            if (!this.isSassFile(currentFile, true)) return;

            if (await this.isSassFileExcluded(vscode.window.activeTextEditor.document.uri.fsPath)) return;

            OutputWindow.Show("Change detected...", [path.basename(currentFile)], showOutputWindow);

            if (this.isSassFile(currentFile)) {
                const formats = Helper.getConfigSettings<IFormat[]>("formats"),
                    sassPath = currentFile,
                    promises: Promise<boolean>[] = [];

                formats.forEach((format) => {
                    // Each format
                    const options = this.getCssStyle(format.format),
                        cssMapPath = this.generateCssAndMapUri(sassPath, format);

                    promises.push(this.GenerateCssAndMap(sassPath, cssMapPath.css, cssMapPath.map, options));
                });

                await Promise.all(promises);
            } else {
                // Partial Or not
                await this.GenerateAllCssAndMap(showOutputWindow);
            }
        } catch (err) {
            await this._logger.LogIssueWithAlert(
                `Unhandled error while compiling the saved changes. Error message: ${err.message}`,
                {
                    triggeringFile: vscode.window.activeTextEditor.document.uri.fsPath,
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
    private async GenerateCssAndMap(SassPath: string, targetCssUri: string, mapFileUri: string, options) {
        const generateMap = Helper.getConfigSettings<boolean>("generateMap"),
            autoprefixerTarget = Helper.getConfigSettings<Array<string>>("autoprefix"),
            showOutputWindow = Helper.getConfigSettings<boolean>("showOutputWindow"),
            compileResult = SassHelper.instance.compileOne(SassPath, mapFileUri, options),
            promises: Promise<IFileResolver>[] = [];

        if (compileResult.errorString !== null) {
            OutputWindow.Show("Compilation Error", [compileResult.errorString], showOutputWindow);
            StatusBarUi.compilationError(this.isWatching);

            if (!showOutputWindow) vscode.window.setStatusBarMessage(compileResult.errorString.split("\n")[0], 4500);

            return false;
        }

        let css: string = compileResult.result.css.toString(),
            map: string | null = compileResult.result.map?.toString();

        if (autoprefixerTarget) {
            const autoprefixerResult = await this.autoprefix(css, SassPath, targetCssUri, autoprefixerTarget);
            css = autoprefixerResult.css;
            map = autoprefixerResult.map;
        } else if (generateMap) css += `/*# sourceMappingURL=${path.basename(targetCssUri)}.map */`;

        promises.push(FileHelper.writeToOneFile(targetCssUri, css));

        if (generateMap) promises.push(FileHelper.writeToOneFile(mapFileUri, map));

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
            promises: Promise<boolean>[] = [],
            sassPaths: string[] = await this.getSassFiles();

        OutputWindow.Show("Compiling Sass/Scss Files: ", sassPaths, popUpOutputWindow);

        sassPaths.forEach((sassPath) => {
            formats.forEach((format) => {
                // Each format
                const options = this.getCssStyle(format.format),
                    cssMapUri = this.generateCssAndMapUri(sassPath, format);

                promises.push(this.GenerateCssAndMap(sassPath, cssMapUri.css, cssMapUri.map, options));
            });
        });

        return Promise.all(promises);
    }

    /**
     * Generate a full save path for the final css & map files
     * @param filePath The path to the current SASS file
     * @param savePath The path we're going to save to
     * @param _extensionName The file extension we're going to use
     */
    private generateCssAndMapUri(filePath: string, format: IFormat) {
        const extensionName = format.extensionName || ".css",
            workspaceRoot = vscode.workspace.rootPath;

        let generatedUri = null;

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
            ),
            options: ProcessOptions = generateMap
                ? {
                      from: filePath,
                      to: savePath,
                      map: { inline: false },
                  }
                : {};

        const result = await prefixer.process(css, options);

        result.warnings().forEach((warn) => {
            const body: string[] = [];

            if (warn.node.source?.input.file !== null) {
                body.push(warn.node.source.input.file + `:${warn.line}:${warn.column}`);
            }

            body.push(warn.text);

            OutputWindow.Show(`Autoprefix ${warn.type || "error"}`, body, showOutputWindow);
        });

        return { css: result.css, map: generateMap ? result.map.toString() : null };
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

    //#region Public

    isSassFile(pathUrl: string, partialSass = false): boolean {
        const filename = path.basename(pathUrl);
        return (partialSass || !filename.startsWith("_")) && (filename.endsWith("sass") || filename.endsWith("scss"));
    }

    //#endregion Public

    //#region Private

    private async isSassFileExcluded(sassPath: string) {
        const files = await this.getSassFiles("**/*.s[a|c]ss", true);
        return files.find((e) => e === sassPath) ? false : true;
    }

    private getSassFiles(queryPattern = "**/[^_]*.s[a|c]ss", isQueryPatternFixed = false): Promise<string[]> {
        const excludedList = Helper.getConfigSettings<string[]>("excludeList"),
            includeItems = Helper.getConfigSettings<string[] | null>("includeItems"),
            options = {
                ignore: excludedList,
                mark: true,
                cwd: AppModel.basePath,
            };

        if (!isQueryPatternFixed && includeItems && includeItems.length) {
            if (includeItems.length === 1) {
                queryPattern = includeItems[0];
            } else {
                queryPattern = `{${includeItems.join(",")}}`;
            }
        }

        return new Promise((resolve) => {
            glob(queryPattern, options, (err, files: string[]) => {
                if (err) {
                    OutputWindow.Show(
                        "Error whilst searching for files",
                        [err.code + " " + err.errno.toString(), err.message, err.stack],
                        true
                    );
                    resolve([]);
                    return;
                }
                const filePaths = files
                    .filter((file) => this.isSassFile(file))
                    .map((file) => path.join(AppModel.basePath, file));
                return resolve(filePaths || []);
            });
        });
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
                    ["There isn't an active editor window to process", "Click an open file so it can be checked"],
                    true,
                    true
                );

                return;
            }

            const sassPath = vscode.window.activeTextEditor.document.uri.fsPath;

            OutputWindow.Show(sassPath, [], true);

            if (!this.isSassFile(sassPath, true)) {
                OutputWindow.Show(
                    "Not a Sass file",
                    ["The file currently open in the editor window isn't a sass file"],
                    true
                );
            } else if (await this.isSassFileExcluded(sassPath)) {
                OutputWindow.Show(
                    "Excluded based on your settings, please check your settings",
                    ["The file currently open in the editor window isn't a sass file"],
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
                ? vscode.window.activeTextEditor.document.uri.fsPath
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
                    "----------------------",
                    "Current File",
                    "----------------------",
                    vscode.window.activeTextEditor.document.uri.fsPath
                );
            }

            outputInfo.push(
                "----------------------",
                "Current Include/Exclude Settings",
                "----------------------",
                `[ ${exclusionList.join(", ")} ]`,
                `[ ${Helper.getConfigSettings<string[] | null>("includeItems")?.join(", ") ?? "NULL"} ]`
            );

            outputInfo.push("----------------------", "Workspace Folders", "----------------------");
            await Promise.all(
                vscode.workspace.workspaceFolders.map(async (file) => {
                    outputInfo.push(`[${file.index}] ${file.name}\n${file.uri.fsPath}`);
                })
            );

            outputInfo.push("----------------------", "Included SASS Files", "----------------------");
            await Promise.all(
                (await this.getSassFiles()).map(async (file) => {
                    outputInfo.push(file);
                })
            );

            outputInfo.push("----------------------", "Excluded SASS Files", "----------------------");
            await Promise.all(
                (await this.getSassFiles(`{${exclusionList.join(",")}}`)).map(async (file) => {
                    outputInfo.push(file);
                })
            );

            OutputWindow.Show("Extension Info", outputInfo, true);
        } catch (err) {
            const sassPath = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document.uri.fsPath
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
