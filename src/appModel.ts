"use strict";

import * as path from "path";
import * as vscode from "vscode";

import { FileHelper, IFileResolver } from "./FileHelper";
import { Helper, IFormat } from "./helper";
import { fdir, OnlyCountsOutput, PathsOutput } from "fdir";
import { SassHelper } from "./SassCompileHelper";
import { StatusBarUi } from "./StatusbarUi";
import { ErrorLogger, OutputLevel, OutputWindow } from "./VscodeExtensions";

import autoprefixer from "autoprefixer";
import BrowserslistError from "browserslist/error";
import fs from "fs";
import picomatch from "picomatch";
import postcss from "postcss";
import { Options } from "sass";

export class AppModel {
    private isWatching: boolean;
    private _logger: ErrorLogger;

    constructor(workplaceState: vscode.Memento) {
        OutputWindow.Show(OutputLevel.Trace, "Constructing app model");

        this.isWatching = Helper.getConfigSettings<boolean>("watchOnLaunch");

        this._logger = new ErrorLogger(workplaceState);

        if (this.isWatching) {
            OutputWindow.Show(OutputLevel.Information, "Watching...");
        }

        StatusBarUi.init(this.isWatching);

        OutputWindow.Show(OutputLevel.Trace, "App model constructed");
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
        OutputWindow.Show(OutputLevel.Critical, null, null, false);
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
                `Unhandled error while clearing browserslist cache. Error message: ${err.message}`,
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
        OutputWindow.Show(OutputLevel.Trace, "Starting to compile all files");

        try {
            StatusBarUi.working();

            await this.GenerateAllCssAndMap();
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
        OutputWindow.Show(OutputLevel.Trace, "Starting to compile current file");

        try {
            if (!vscode.window.activeTextEditor) {
                StatusBarUi.customMessage(
                    "No file open",
                    "No file is open, ensure a file is open in the editor window",
                    "warning"
                );

                OutputWindow.Show(OutputLevel.Debug, "No active file", [
                    "There isn't an active editor window to process",
                ]);

                this.revertUIToWatchingStatus();

                return;
            }

            const sassPath = vscode.window.activeTextEditor.document.fileName;

            if (!this.isSassFile(sassPath)) {
                if (this.isSassFile(sassPath, true)) {
                    OutputWindow.Show(OutputLevel.Debug, "Can't process partial Sass", [
                        "The file currently open in the editor window is a partial sass file, these aren't processed singly",
                    ]);

                    StatusBarUi.customMessage(
                        "Can't process partial Sass",
                        "The file currently open in the editor window is a partial sass file, these aren't processed singly",
                        "warning"
                    );
                } else {
                    OutputWindow.Show(OutputLevel.Debug, "Not a Sass file", [
                        "The file currently open in the editor window isn't a sass file",
                    ]);

                    StatusBarUi.customMessage(
                        "Not a Sass file",
                        "The file currently open in the editor window isn't a sass file",
                        "warning"
                    );
                }

                this.revertUIToWatchingStatus();

                return;
            }

            StatusBarUi.working("Processing single file...");
            OutputWindow.Show(OutputLevel.Debug, "Processing the current file", [
                `Path: ${sassPath}`,
            ]);

            const formats = Helper.getConfigSettings<IFormat[]>("formats");
            const result = await Promise.all(
                formats.map(async (format, index) => {
                    OutputWindow.Show(
                        OutputLevel.Trace,
                        `Starting format ${index + 1} of ${formats.length}`,
                        [`Settings: ${JSON.stringify(format)}`]
                    );

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

            if (result.indexOf(false) < 0) {
                StatusBarUi.compilationSuccess(this.isWatching);
            }
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
        try {
            const currentFile = vscode.window.activeTextEditor.document.fileName;

            if (!this.isSassFile(currentFile, true)) {
                return;
            }

            OutputWindow.Show(OutputLevel.Trace, "SASS file saved", [
                "A SASS file has been saved, starting checks",
            ]);

            if (!this.isWatching) {
                OutputWindow.Show(OutputLevel.Trace, "Not watching", [
                    "The file has not been compiled as Live SASS is not watching",
                ]);

                return;
            }

            if (await this.isSassFileExcluded(currentFile)) {
                OutputWindow.Show(OutputLevel.Trace, "File excluded", [
                    "The file has not been compiled as it's excluded by user settings",
                    `Path: ${currentFile}`,
                ]);

                return;
            }

            OutputWindow.Show(
                OutputLevel.Debug,
                "Change detected - " + new Date().toLocaleString(),
                [path.basename(currentFile)]
            );

            if (this.isSassFile(currentFile)) {
                OutputWindow.Show(OutputLevel.Trace, "File is not a partial", [
                    "The file is not a partial so we will compile only this one",
                    `Path: ${currentFile}`,
                ]);

                const formats = Helper.getConfigSettings<IFormat[]>("formats");

                await Promise.all(
                    formats.map(async (format, index) => {
                        OutputWindow.Show(
                            OutputLevel.Trace,
                            `Starting format ${index + 1} of ${formats.length}`,
                            [`Settings: ${JSON.stringify(format)}`]
                        );

                        // Each format
                        const options = this.getCssStyle(format.format),
                            cssMapPath = await this.generateCssAndMapUri(currentFile, format);

                        await this.GenerateCssAndMap(
                            currentFile,
                            cssMapPath.css,
                            cssMapPath.map,
                            options
                        );
                    })
                );
            } else {
                // Partial
                await this.GenerateAllCssAndMap();
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
     * @param sassPath Sass/Scss file URI (string)
     * @param targetCssUri Target CSS file URI (string)
     * @param mapFileUri Target MAP file URI (string)
     * @param options - Object - It includes target CSS style and some more.
     */
    private async GenerateCssAndMap(
        sassPath: string,
        targetCssUri: string,
        mapFileUri: string,
        options: Options
    ) {
        OutputWindow.Show(OutputLevel.Trace, "Starting compilation", [
            "Starting compilation of file",
            `Path: ${sassPath}`,
        ]);

        const generateMap = Helper.getConfigSettings<boolean>("generateMap"),
            autoprefixerTarget = Helper.getConfigSettings<Array<string> | boolean>("autoprefix"),
            compileResult = SassHelper.instance.compileOne(sassPath, mapFileUri, options),
            promises: Promise<IFileResolver>[] = [];

        if (compileResult.errorString !== null) {
            OutputWindow.Show(OutputLevel.Error, "Compilation Error", [compileResult.errorString]);

            StatusBarUi.compilationError(this.isWatching);

            return false;
        }

        let css: string = compileResult.result.css.toString(),
            map: string | null = compileResult.result.map?.toString();

        if (autoprefixerTarget != false) {
            OutputWindow.Show(OutputLevel.Trace, "Autoprefixer isn't false, applying to file", [
                `Path: ${sassPath}`,
            ]);

            try {
                const autoprefixerResult = await this.autoprefix(
                    css,
                    map,
                    sassPath,
                    targetCssUri,
                    autoprefixerTarget
                );
                css = autoprefixerResult.css;
                map = autoprefixerResult.map;
            } catch (err) {
                if (err instanceof BrowserslistError) {
                    OutputWindow.Show(
                        OutputLevel.Error,
                        "Autoprefix error. Your changes have not been saved",
                        [`Message: ${err.message}`, `Path: ${sassPath}`]
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

        OutputWindow.Show(OutputLevel.Information, "Generated :", null, false);

        StatusBarUi.compilationSuccess(this.isWatching);

        fileResolvers.forEach((fileResolver) => {
            if (fileResolver.Exception) {
                OutputWindow.Show(OutputLevel.Error, "Error:", [
                    fileResolver.Exception.errno.toString(),
                    fileResolver.Exception.path,
                    fileResolver.Exception.message,
                ]);
                console.error("error :", fileResolver);
            } else {
                OutputWindow.Show(OutputLevel.Information, null, [fileResolver.FileUri], false);
            }
        });

        OutputWindow.Show(OutputLevel.Information, null, null, true);

        return true;
    }

    /**
     * To compile all Sass/scss files
     */
    private async GenerateAllCssAndMap() {
        const formats = Helper.getConfigSettings<IFormat[]>("formats"),
            sassPaths = await this.getSassFiles();

        OutputWindow.Show(OutputLevel.Debug, "Compiling Sass/Scss Files: ", sassPaths);

        await Promise.all(
            sassPaths.map(async (sassPath, pathIndex) => {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    `Starting file ${pathIndex + 1} of ${sassPaths.length}`,
                    [`Path: ${sassPath}`]
                );

                await Promise.all(
                    formats.map(async (format, formatIndex) => {
                        OutputWindow.Show(
                            OutputLevel.Trace,
                            `Starting format ${formatIndex + 1} of ${formats.length}`,
                            [`Settings: ${JSON.stringify(format)}`]
                        );

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
        OutputWindow.Show(OutputLevel.Trace, "Calculating file paths", [
            "Calculating the save paths for the css and map output files",
            `Originating path: ${filePath}`,
        ]);

        const extensionName = format.extensionName || ".css",
            workspaceFolders = vscode.workspace.workspaceFolders;

        let generatedUri = null;

        OutputWindow.Show(OutputLevel.Trace, "Searching for workspace", [
            "Need to find a workspace folder that holds the file",
        ]);

        let workspaceRoot: string;
        if (workspaceFolders) {
            OutputWindow.Show(OutputLevel.Trace, "Workspace has folder", [
                "Searching for the workspace folder where this file is located",
                `Path: ${filePath}`,
            ]);

            const foundInFolders = (
                await Promise.all(
                    workspaceFolders.map(async (folder, index) => {
                        OutputWindow.Show(
                            OutputLevel.Trace,
                            `Checking folder ${index + 1} of ${workspaceFolders.length}`,
                            [`Folder: ${folder}`],
                            false
                        );

                        if (filePath.startsWith(folder.uri.fsPath)) {
                            OutputWindow.Show(OutputLevel.Trace, "MATCH");

                            return folder.uri.fsPath;
                        } else {
                            OutputWindow.Show(OutputLevel.Trace, "NO MATCH");

                            return null;
                        }
                    })
                )
            ).filter((x) => x !== null);

            if (foundInFolders.length == 0) {
                workspaceRoot = workspaceFolders[0].uri.fsPath;
                OutputWindow.Show(OutputLevel.Warning, "Warning: File is not in workspace", [
                    "The file will be saved relative to the first folder in your workspace",
                    `Path: ${workspaceRoot}`,
                ]);
            } else {
                workspaceRoot = foundInFolders[0];

                OutputWindow.Show(OutputLevel.Trace, `Using: ${workspaceRoot}`);
            }
        } else {
            workspaceRoot = path.basename(vscode.window.activeTextEditor.document.fileName);

            OutputWindow.Show(OutputLevel.Warning, "Warning: There is no active workspace", [
                "The file will be saved relative to file being processed",
                `Path: ${workspaceRoot}`,
            ]);
        }

        // NOTE: If all SavePath settings are `NULL`, CSS Uri will be same location as SASS
        if (format.savePath) {
            OutputWindow.Show(OutputLevel.Trace, "Using `savePath` setting", [
                "This format has a `savePath`, using this (takes precedence if others are present)",
                `savePath: ${format.savePath}`,
            ]);

            if (format.savePath.startsWith("~")) {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    "Path is relative to current file",
                    [
                        "Path starts with a tilde, so the path is relative to the current path",
                        `Original path: ${filePath}`,
                    ],
                    false
                );

                generatedUri = path.join(path.dirname(filePath), format.savePath.substring(1));
            } else {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    "Path is relative to workspace folder",
                    [
                        "No tilde so the path is relative to the workspace folder being used",
                        `Original path: ${filePath}`,
                    ],
                    false
                );

                generatedUri = path.join(workspaceRoot, format.savePath);
            }

            OutputWindow.Show(OutputLevel.Trace, `New path: ${generatedUri}`);

            FileHelper.MakeDirIfNotAvailable(generatedUri);

            filePath = path.join(generatedUri, path.basename(filePath));
        } else if (
            format.savePathSegmentKeys &&
            format.savePathSegmentKeys.length &&
            format.savePathReplaceSegmentsWith
        ) {
            OutputWindow.Show(
                OutputLevel.Trace,
                "Using segment replacement",
                [
                    `Keys: [${format.savePathSegmentKeys.join(", ")}] - Replacement: ${
                        format.savePathReplaceSegmentsWith
                    }`,
                    `Original path: ${filePath}`,
                ],
                false
            );

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

            OutputWindow.Show(OutputLevel.Trace, `New path: ${generatedUri}`);

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
     * Autoprefix CSS properties
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
        OutputWindow.Show(OutputLevel.Trace, "Preparing autoprefixer");

        const generateMap = Helper.getConfigSettings<boolean>("generateMap"),
            prefixer = postcss(
                autoprefixer({
                    overrideBrowserslist: browsers === true ? null : browsers,
                })
            );

        // TODO: REMOVE - when autoprefixer can stop caching the browsers
        const oldBrowserlistCache = process.env.BROWSERSLIST_DISABLE_CACHE;
        process.env.BROWSERSLIST_DISABLE_CACHE = "1";

        OutputWindow.Show(OutputLevel.Trace, "Changing BROWSERSLIST_DISABLE_CACHE setting", [
            `Was: ${oldBrowserlistCache ?? "UNDEFINED"}`,
            "Now: 1",
        ]);

        try {
            OutputWindow.Show(OutputLevel.Trace, "Starting autoprefixer");

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

                OutputWindow.Show(
                    warn.type === "warning" ? OutputLevel.Warning : OutputLevel.Error,
                    `Autoprefix ${warn.type || "error"}`,
                    body
                );
            });

            OutputWindow.Show(OutputLevel.Trace, "Completed autoprefixer");

            return {
                css: result.css,
                map: generateMap ? result.map.toString() : null,
            };
        } finally {
            process.env.BROWSERSLIST_DISABLE_CACHE = oldBrowserlistCache;

            OutputWindow.Show(
                OutputLevel.Trace,
                `Restored BROWSERSLIST_DISABLE_CACHE to: ${oldBrowserlistCache ?? "UNDEFINED"}`
            );
        }
    }

    //#endregion Private

    //#endregion Compilation functions

    //#region UI manipulation functions

    private revertUIToWatchingStatus() {
        OutputWindow.Show(
            OutputLevel.Trace,
            "Registered timeout to revert UI to correct watching status"
        );

        setTimeout(() => {
            this.revertUIToWatchingStatusNow();
        }, 3000);
    }

    private revertUIToWatchingStatusNow() {
        OutputWindow.Show(OutputLevel.Trace, "Switching UI state");

        if (this.isWatching) {
            StatusBarUi.watching();

            OutputWindow.Show(OutputLevel.Information, "Watching...");
        } else {
            StatusBarUi.notWatching();

            OutputWindow.Show(OutputLevel.Information, "Not Watching...");
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
        OutputWindow.Show(OutputLevel.Trace, "Checking SASS path isn't excluded", [
            `Path: ${sassPath}`,
        ]);

        const excludeItems = Helper.getConfigSettings<string[]>("excludeList"),
            includeItems = Helper.getConfigSettings<string[] | null>("includeItems");
        let fileList = ["**/*.s[a|c]ss"];

        if (includeItems && includeItems.length) {
            fileList = includeItems.concat("**/_*.s[a|c]ss");
        }

        OutputWindow.Show(OutputLevel.Trace, "Checking all workspace folders in project");

        const fileResult = await Promise.all(
            vscode.workspace.workspaceFolders.map(async (folder, index) => {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    `Checking folder ${index + 1} of ${vscode.workspace.workspaceFolders.length}`,
                    [`Folder: ${folder}`]
                );

                const forceBaseDirectory = Helper.getConfigSettings<string | null>(
                    "forceBaseDirectory",
                    folder
                );

                let basePath = folder.uri.fsPath;

                if (forceBaseDirectory && forceBaseDirectory.length > 1) {
                    OutputWindow.Show(
                        OutputLevel.Trace,
                        "`forceBaseDirectory` setting found, checking validity"
                    );

                    basePath = path.resolve(
                        basePath,
                        ["\\", "/"].indexOf(forceBaseDirectory.substr(0, 1)) >= 0
                            ? forceBaseDirectory.substr(1)
                            : forceBaseDirectory
                    );

                    try {
                        if (!(await fs.promises.stat(basePath)).isDirectory()) {
                            OutputWindow.Show(
                                OutputLevel.Critical,
                                "Error with your `forceBaseDirectory` setting",
                                [
                                    `Path is not a folder: ${basePath}`,
                                    `Setting: "${forceBaseDirectory}"`,
                                    `Workspace folder: ${folder.name}`,
                                ]
                            );

                            return null;
                        }
                    } catch {
                        OutputWindow.Show(
                            OutputLevel.Critical,
                            "Error with your `forceBaseDirectory` setting",
                            [
                                `Can not find path: ${basePath}`,
                                `Setting: "${forceBaseDirectory}"`,
                                `Workspace folder: ${folder.name}`,
                            ]
                        );

                        return null;
                    }

                    OutputWindow.Show(
                        OutputLevel.Trace,
                        "No problem with path, changing from workspace folder",
                        [`New folder: ${basePath}`]
                    );
                } else {
                    OutputWindow.Show(
                        OutputLevel.Trace,
                        "No base folder override found. Keeping workspace folder"
                    );
                }

                // @ts-ignore ts2322 => string[] doesn't match string (False negative as string[] is allowed)
                const isMatch = picomatch(fileList, { ignore: excludeItems, dot: true });

                OutputWindow.Show(OutputLevel.Trace, "Searching folder");

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
        if (fileResult.includes(true)) {
            OutputWindow.Show(OutputLevel.Trace, "File found, not excluded");

            return false;
        } else {
            OutputWindow.Show(OutputLevel.Trace, "File not found, must be excluded");
            return true;
        }
    }

    private async getSassFiles(
        queryPattern: string | string[] = "**/[^_]*.s[a|c]ss",
        isQueryPatternFixed = false,
        isDebugging = false
    ): Promise<string[]> {
        OutputWindow.Show(OutputLevel.Trace, "Getting SASS files", [
            `Query pattern: ${queryPattern}`,
            `Can be overwritten: ${!isQueryPatternFixed}`,
        ]);

        const excludedList = isDebugging
                ? ["**/node_modules/**", ".vscode/**"]
                : Helper.getConfigSettings<string[]>("excludeList"),
            includeItems = Helper.getConfigSettings<string[] | null>("includeItems");

        if (!isQueryPatternFixed && includeItems && includeItems.length) {
            queryPattern = includeItems;

            OutputWindow.Show(OutputLevel.Trace, "Query pattern overwritten", [
                `New pattern(s): "${includeItems.join('" , "')}"`,
            ]);
        }

        const fileList: string[] = [];
        (
            await Promise.all(
                vscode.workspace.workspaceFolders.map(async (folder, index) => {
                    OutputWindow.Show(
                        OutputLevel.Trace,
                        `Checking folder ${index + 1} of ${
                            vscode.workspace.workspaceFolders.length
                        }`,
                        [`Folder: ${folder}`]
                    );

                    const forceBaseDirectory = Helper.getConfigSettings<string | null>(
                        "forceBaseDirectory",
                        folder
                    );

                    let basePath = folder.uri.fsPath;

                    if (forceBaseDirectory && forceBaseDirectory.length > 1) {
                        OutputWindow.Show(
                            OutputLevel.Trace,
                            "`forceBaseDirectory` setting found, checking validity"
                        );

                        basePath = path.resolve(
                            basePath,
                            ["\\", "/"].indexOf(forceBaseDirectory.substr(0, 1)) >= 0
                                ? forceBaseDirectory.substr(1)
                                : forceBaseDirectory
                        );

                        try {
                            if (!(await fs.promises.stat(basePath)).isDirectory()) {
                                OutputWindow.Show(
                                    OutputLevel.Critical,
                                    "Error with your `forceBaseDirectory` setting",
                                    [
                                        `Path is not a folder: ${basePath}`,
                                        `Setting: "${forceBaseDirectory}"`,
                                        `Workspace folder: ${folder.name}`,
                                    ]
                                );

                                return null;
                            }
                        } catch {
                            OutputWindow.Show(
                                OutputLevel.Critical,
                                "Error with your `forceBaseDirectory` setting",
                                [
                                    `Can not find path: ${basePath}`,
                                    `Setting: "${forceBaseDirectory}"`,
                                    `Workspace folder: ${folder.name}`,
                                ]
                            );

                            return null;
                        }

                        OutputWindow.Show(
                            OutputLevel.Trace,
                            "No problem with path, changing from workspace folder",
                            [`New folder: ${basePath}`]
                        );
                    } else {
                        OutputWindow.Show(
                            OutputLevel.Trace,
                            "No base folder override found. Keeping workspace folder"
                        );
                    }

                    // @ts-ignore ts2322 => string[] doesn't match string (False negative as string[] is allowed)
                    const isMatch = picomatch(queryPattern, { ignore: excludedList, dot: true });

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

        OutputWindow.Show(OutputLevel.Trace, `Found ${fileList.length} SASS files`);

        return fileList;
    }

    //#endregion Private

    //#endregion Fetch & check SASS functions

    //#region Debugging

    async debugInclusion(): Promise<void> {
        OutputWindow.Show(OutputLevel.Critical, "Checking current file", null, false);

        try {
            if (!vscode.window.activeTextEditor) {
                OutputWindow.Show(OutputLevel.Critical, "No active file", [
                    "There isn't an active editor window to process",
                    "Click an open file so it can be checked",
                ]);

                return;
            }

            const sassPath = vscode.window.activeTextEditor.document.fileName;

            OutputWindow.Show(OutputLevel.Critical, sassPath, null, true);

            if (!this.isSassFile(sassPath, true)) {
                OutputWindow.Show(OutputLevel.Critical, "Not a Sass file", [
                    "The file currently open in the editor window isn't a sass file",
                ]);
            } else if (await this.isSassFileExcluded(sassPath)) {
                OutputWindow.Show(OutputLevel.Critical, "File excluded", [
                    "The file is excluded based on your settings, please check your configuration",
                ]);
            } else {
                OutputWindow.Show(OutputLevel.Critical, "File should get processed", [
                    "If the file isn't being processed, run `liveSass.command.debugFileList`",
                ]);
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

            OutputWindow.Show(OutputLevel.Critical, "Extension Info", outputInfo);
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
        OutputWindow.Show(OutputLevel.Trace, "Disposing app model");

        StatusBarUi.dispose();
        OutputWindow.dispose();

        OutputWindow.Show(OutputLevel.Trace, "App model disposed");
    }
}
