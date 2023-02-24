"use strict";

import * as path from "path";
import * as vscode from "vscode";

import { FileHelper, IFileResolver } from "./FileHelper";
import { Helper, IFormat } from "./helper";
import { fdir } from "fdir";
import { SassHelper } from "./SassCompileHelper";
import { StatusBarUi } from "./StatusbarUi";
import { ErrorLogger, OutputWindow } from "./VscodeExtensions";
import { OutputLevel } from "./OutputLevel";

import autoprefixer from "autoprefixer";
import BrowserslistError from "browserslist/error";
import fs from "fs";
import picomatch from "picomatch";
import postcss from "postcss";
import { LegacyFileOptions, Options } from "sass";

export class AppModel {
    isWatching: boolean;
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
        const compileOnWatch =
            Helper.getConfigSettings<boolean>("compileOnWatch");

        if (!this.isWatching) {
            this.isWatching = !this.isWatching;

            if (compileOnWatch) {
                await this.compileAllFiles();

                return;
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
            let files: string[] | string;

            try {
                files = await this.getSassFiles();
            } catch (_) {
                files = "Error lies in getSassFiles()";
            }

            if (err instanceof Error) {
                await this._logger.LogIssueWithAlert(
                    `Unhandled error while compiling all files. Error message: ${err.message}`,
                    {
                        files: files,
                        error: ErrorLogger.PrepErrorForLogging(err),
                    }
                );
            } else {
                await this._logger.LogIssueWithAlert(
                    "Unhandled error while compiling all files. Error message: UNKNOWN (not Error type)",
                    {
                        files: files,
                        error: JSON.stringify(err),
                    }
                );
            }
        }

        this.revertUIToWatchingStatusNow();
    }

    /**
     * Compiles the currently active file
     */
    async compileCurrentFile(): Promise<void> {
        OutputWindow.Show(
            OutputLevel.Trace,
            "Starting to compile current file"
        );

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

            const sassPath = vscode.window.activeTextEditor.document.fileName,
                workspaceFolder = AppModel.getWorkspaceFolder(sassPath),
                sassFileType = this.confirmSassType(sassPath, workspaceFolder);

            switch (sassFileType) {
                case SassConfirmationType.PartialFile:
                    OutputWindow.Show(
                        OutputLevel.Debug,
                        "Can't process partial Sass",
                        [
                            "The file currently open in the editor window is a partial sass file, these aren't processed singly",
                        ]
                    );

                    StatusBarUi.customMessage(
                        "Can't process partial Sass",
                        "The file currently open in the editor window is a partial sass file, these aren't processed singly",
                        "warning"
                    );

                    this.revertUIToWatchingStatus();

                    return;

                case SassConfirmationType.NotSass:
                    OutputWindow.Show(OutputLevel.Debug, "Not a Sass file", [
                        "The file currently open in the editor window isn't a sass file",
                    ]);

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
                OutputLevel.Debug,
                "Processing the current file",
                [`Path: ${sassPath}`]
            );

            await this.handleSingleFile(workspaceFolder, sassPath);
        } catch (err) {
            const sassPath = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document.fileName
                : "/* NO ACTIVE FILE, PROCESSING SHOULD NOT HAVE OCCURRED */";

            if (err instanceof Error) {
                await this._logger.LogIssueWithAlert(
                    `Unhandled error while compiling the active file. Error message: ${err.message}`,
                    {
                        files: sassPath,
                        error: ErrorLogger.PrepErrorForLogging(err),
                    }
                );
            } else {
                await this._logger.LogIssueWithAlert(
                    "Unhandled error while compiling the active file. Error message: UNKNOWN (not Error type)",
                    {
                        files: sassPath,
                        error: JSON.stringify(err),
                    }
                );
            }
        }
    }

    /**
     * Compiles the file that has just been saved
     */
    async compileOnSave(textDocument: vscode.TextDocument): Promise<void> {
        try {
            const currentFile = textDocument.fileName;

            const workspaceFolder = AppModel.getWorkspaceFolder(
                    currentFile,
                    !this.isWatching
                ),
                sassFileType = this.confirmSassType(
                    currentFile,
                    workspaceFolder
                );

            if (sassFileType == SassConfirmationType.NotSass) {
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

            if (await this.isSassFileExcluded(currentFile, workspaceFolder)) {
                OutputWindow.Show(OutputLevel.Trace, "File excluded", [
                    "The file has not been compiled as it's excluded by user settings",
                    `Path: ${currentFile}`,
                ]);

                return;
            }

            StatusBarUi.working();
            OutputWindow.Show(
                OutputLevel.Information,
                "Change detected - " + new Date().toLocaleString(),
                [path.basename(currentFile)]
            );

            if (sassFileType == SassConfirmationType.SassFile) {
                OutputWindow.Show(OutputLevel.Trace, "File is not a partial", [
                    "The file is not a partial so we will compile only this one",
                    `Path: ${currentFile}`,
                ]);

                await this.handleSingleFile(workspaceFolder, currentFile);
            } else {
                // Partial
                await this.GenerateAllCssAndMap();
            }
        } catch (err) {
            let files: string[] | string;

            try {
                files = await this.getSassFiles();
            } catch (_) {
                files = "Error lies in getSassFiles()";
            }

            if (err instanceof Error) {
                await this._logger.LogIssueWithAlert(
                    `Unhandled error while compiling the saved changes. Error message: ${err.message}`,
                    {
                        triggeringFile:
                            vscode.window.activeTextEditor?.document.fileName ??
                            "NO SASS FILE - Should not have been called",
                        allFiles: files,
                        error: ErrorLogger.PrepErrorForLogging(err),
                    }
                );
            } else {
                await this._logger.LogIssueWithAlert(
                    "Unhandled error while compiling the saved changes. Error message: UNKNOWN (not Error type)",
                    {
                        triggeringFile:
                            vscode.window.activeTextEditor?.document.fileName ??
                            "NO SASS FILE - Should not have been called",
                        allFiles: files,
                        error: JSON.stringify(err),
                    }
                );
            }
        }

        this.revertUIToWatchingStatus();
    }

    //#endregion Public

    //#region Private

    private async processSingleFile(
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        sassPath: string
    ) {
        const formats = Helper.getConfigSettings<IFormat[]>(
                "formats",
                workspaceFolder
            ),
            useCompile = Helper.getConfigSettings<boolean>(
                "useNewCompiler",
                workspaceFolder
            ),
            paths = await Promise.all(
                formats.map((format, index) => {
                    OutputWindow.Show(
                        OutputLevel.Trace,
                        `Starting format ${index + 1} of ${formats.length}`,
                        [`Settings: ${JSON.stringify(format)}`]
                    );

                    // Each format
                    const options = this.getSassOptions(format, useCompile);
                    return {
                        options,
                        pathData: this.generateCssAndMapUri(
                            sassPath,
                            format,
                            workspaceFolder
                        ),
                    };
                })
            );

        return Promise.all(
            paths.map((data) => {
                return data.pathData.then((result) =>
                    result
                        ? this.GenerateCssAndMap(
                              workspaceFolder,
                              sassPath,
                              result.css,
                              result.map,
                              data.options
                          )
                        : false
                );
            })
        );
    }

    private async handleSingleFile(
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        sassPath: string
    ) {
        const results = await this.processSingleFile(workspaceFolder, sassPath);

        if (results.every((r) => r)) {
            StatusBarUi.compilationSuccess(this.isWatching);
        } else if (results.length) {
            StatusBarUi.compilationError(this.isWatching);
        }
    }

    private getSassOptions(
        format: IFormat,
        useNew: boolean
    ): LegacyFileOptions<"sync"> | Options<"sync"> {
        return SassHelper.toSassOptions(format, useNew);
    }

    /**
     * To Generate one One Css & Map file from Sass/Scss
     * @param sassPath Sass/Scss file URI (string)
     * @param targetCssUri Target CSS file URI (string)
     * @param mapFileUri Target MAP file URI (string)
     * @param options - Object - It includes target CSS style and some more.
     */
    private async GenerateCssAndMap(
        folder: vscode.WorkspaceFolder | undefined,
        sassPath: string,
        targetCssUri: string,
        mapFileUri: string,
        options: LegacyFileOptions<"sync"> | Options<"sync">
    ) {
        OutputWindow.Show(OutputLevel.Trace, "Starting compilation", [
            "Starting compilation of file",
            `Path: ${sassPath}`,
        ]);

        const generateMap = Helper.getConfigSettings<boolean>(
                "generateMap",
                folder
            ),
            compileResult = SassHelper.compileOne(
                sassPath,
                targetCssUri,
                mapFileUri,
                options
            ),
            promises: Promise<IFileResolver>[] = [];

        let autoprefixerTarget = Helper.getConfigSettings<
            Array<string> | boolean | null
        >("autoprefix", folder);

        if (compileResult.errorString !== null) {
            OutputWindow.Show(OutputLevel.Error, "Compilation Error", [
                compileResult.errorString,
            ]);

            return false;
        }

        let css: string | undefined = compileResult.result?.css,
            map: string | undefined | null = compileResult.result?.map;

        if (css === undefined) {
            OutputWindow.Show(OutputLevel.Error, "Compilation Error", [
                "There was no CSS output from sass/sass",
                `Sass error: ${compileResult.errorString ?? "NONE"}`,
            ]);

            return false;
        }

        if (autoprefixerTarget === null) {
            autoprefixerTarget = false;
        }

        if (autoprefixerTarget != false) {
            OutputWindow.Show(
                OutputLevel.Trace,
                "Autoprefixer isn't false, applying to file",
                [`Path: ${sassPath}`]
            );

            try {
                const autoprefixerResult = await this.autoprefix(
                    folder,
                    css,
                    map,
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
        }

        if (map && generateMap) {
            css += `/*# sourceMappingURL=${path.basename(targetCssUri)}.map */`;

            promises.push(FileHelper.writeToOneFile(mapFileUri, map));
        }

        promises.push(FileHelper.writeToOneFile(targetCssUri, css));

        const fileResolvers = await Promise.all(promises);

        OutputWindow.Show(OutputLevel.Information, "Generated:", null, false);

        fileResolvers.forEach((fileResolver) => {
            if (fileResolver.Exception) {
                OutputWindow.Show(OutputLevel.Error, "Error:", [
                    fileResolver.Exception.errno?.toString() ??
                        "UNKNOWN ERR NUMBER",
                    fileResolver.Exception.path ?? "UNKNOWN PATH",
                    fileResolver.Exception.message,
                ]);
                console.error("error :", fileResolver);
            } else {
                OutputWindow.Show(
                    OutputLevel.Information,
                    null,
                    [fileResolver.FileUri],
                    false
                );
            }
        });

        OutputWindow.Show(OutputLevel.Information, null, null, true);

        return true;
    }

    /**
     * To compile all Sass/scss files
     */
    private async GenerateAllCssAndMap() {
        const sassPaths = await this.getSassFiles();

        OutputWindow.Show(
            OutputLevel.Debug,
            "Compiling Sass/Scss Files: ",
            sassPaths
        );

        const results = await Promise.all(
            sassPaths.map((sassPath, pathIndex) => {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    `Starting file ${pathIndex + 1} of ${sassPaths.length}`,
                    [`Path: ${sassPath}`]
                );

                return this.processSingleFile(
                    AppModel.getWorkspaceFolder(sassPath),
                    sassPath
                );
            })
        );

        if (results.every((r) => r.every((s) => s))) {
            StatusBarUi.compilationSuccess(this.isWatching);
        } else if (results.length) {
            StatusBarUi.compilationError(this.isWatching);
        }
    }

    /**
     * Generate a full save path for the final css & map files
     * @param filePath The path to the current SASS file
     */
    private async generateCssAndMapUri(
        filePath: string,
        format: IFormat,
        workspaceRoot?: vscode.WorkspaceFolder
    ) {
        OutputWindow.Show(OutputLevel.Trace, "Calculating file paths", [
            "Calculating the save paths for the css and map output files",
            `Originating path: ${filePath}`,
        ]);

        const extensionName = format.extensionName || ".css";

        if (workspaceRoot) {
            OutputWindow.Show(OutputLevel.Trace, "No workspace provided", [
                `Using originating path: ${filePath}`,
            ]);

            const workspacePath = workspaceRoot.uri.fsPath;
            let generatedUri = null;

            // NOTE: If all SavePath settings are `NULL`, CSS Uri will be same location as SASS
            if (format.savePath) {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    "Using `savePath` setting",
                    [
                        "This format has a `savePath`, using this (takes precedence if others are present)",
                        `savePath: ${format.savePath}`,
                    ]
                );

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

                    generatedUri = path.join(
                        path.dirname(filePath),
                        format.savePath.substring(1)
                    );
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

                    generatedUri = path.join(workspacePath, format.savePath);
                }

                if (
                    format.savePathReplacementPairs &&
                    format.savePath.startsWith("~")
                ) {
                    OutputWindow.Show(
                        OutputLevel.Trace,
                        `New path: ${generatedUri}`
                    );
                } else {
                    OutputWindow.Show(
                        OutputLevel.Trace,
                        `Path to continue with: ${generatedUri}`
                    );

                    FileHelper.MakeDirIfNotAvailable(generatedUri);
                }

                filePath = path.join(generatedUri, path.basename(filePath));
            }

            if (
                format.savePathReplacementPairs &&
                (format.savePath == null || format.savePath.startsWith("~"))
            ) {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    "Using segment replacement",
                    [`Original path: ${filePath}`],
                    false
                );

                generatedUri =
                    "/" +
                    path
                        .relative(workspacePath, path.dirname(filePath))
                        .replace(/\\/g, "/") +
                    "/";

                for (const key in format.savePathReplacementPairs) {
                    if (
                        Object.prototype.hasOwnProperty.hasOwnProperty.call(
                            format.savePathReplacementPairs,
                            key
                        )
                    ) {
                        const value = format.savePathReplacementPairs[key];

                        if (
                            typeof value === "string" ||
                            value instanceof String
                        ) {
                            OutputWindow.Show(
                                OutputLevel.Trace,
                                `Applying: ${key} => ${value}`,
                                null,
                                false
                            );

                            generatedUri = generatedUri.replace(
                                key.replace(/\\/g, "/"),
                                value.toString().replace(/\\/g, "/")
                            );
                        } else {
                            OutputWindow.Show(
                                OutputLevel.Error,
                                "Error: Invalid type passed to savePathReplacementPairs",
                                [
                                    `The key "${key}" must have a string value, not "${typeof value}"`,
                                ]
                            );

                            return null;
                        }
                    }
                }

                FileHelper.MakeDirIfNotAvailable(
                    path.join(workspacePath, generatedUri)
                );

                OutputWindow.Show(
                    OutputLevel.Trace,
                    `New path: ${generatedUri}`
                );

                filePath = path.join(
                    workspacePath,
                    generatedUri,
                    path.basename(filePath)
                );
            }
        }

        const cssUri =
            filePath.substring(0, filePath.lastIndexOf(".")) + extensionName;

        return {
            css: cssUri,
            map: cssUri + ".map",
        };
    }

    /**
     * Autoprefix CSS properties
     */
    private async autoprefix(
        folder: vscode.WorkspaceFolder | undefined,
        css: string,
        map: string | undefined,
        savePath: string,
        browsers: Array<string> | true
    ): Promise<{ css: string; map: string | null }> {
        OutputWindow.Show(OutputLevel.Trace, "Preparing autoprefixer");

        const generateMap = Helper.getConfigSettings<boolean>(
                "generateMap",
                folder
            ),
            prefixer = postcss(
                autoprefixer({
                    overrideBrowserslist:
                        browsers === true ? undefined : browsers,
                })
            );

        // TODO: REMOVE - when autoprefixer can stop caching the browsers
        const oldBrowserlistCache = process.env.BROWSERSLIST_DISABLE_CACHE;

        if (browsers === true) {
            process.env.BROWSERSLIST_DISABLE_CACHE = "1";

            OutputWindow.Show(
                OutputLevel.Trace,
                "Changing BROWSERSLIST_DISABLE_CACHE setting",
                [`Was: ${oldBrowserlistCache ?? "UNDEFINED"}`, "Now: 1"]
            );
        }

        try {
            OutputWindow.Show(OutputLevel.Trace, "Starting autoprefixer");

            const result = await prefixer.process(css, {
                from: savePath,
                to: savePath,
                map: {
                    inline: false,
                    prev: map,
                    annotation: false,
                },
            });

            result.warnings().forEach((warn) => {
                const body: string[] = [];

                if (warn.node.source?.input.file) {
                    body.push(
                        warn.node.source.input.file +
                            `:${warn.line}:${warn.column}`
                    );
                }

                body.push(warn.text);

                OutputWindow.Show(
                    warn.type === "warning"
                        ? OutputLevel.Warning
                        : OutputLevel.Error,
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
            if (browsers === true) {
                process.env.BROWSERSLIST_DISABLE_CACHE = oldBrowserlistCache;

                OutputWindow.Show(
                    OutputLevel.Trace,
                    `Restored BROWSERSLIST_DISABLE_CACHE to: ${
                        oldBrowserlistCache ?? "UNDEFINED"
                    }`
                );
            }
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

    private confirmSassType(
        pathUrl: string,
        workspaceFolder?: vscode.WorkspaceFolder
    ): SassConfirmationType {
        const filename = path.basename(pathUrl).toLowerCase();

        if (filename.endsWith("sass") || filename.endsWith("scss")) {
            if (workspaceFolder === undefined) {
                if (filename.startsWith("_")) {
                    return SassConfirmationType.PartialFile;
                }

                return SassConfirmationType.SassFile;
            } else {
                const basePath = workspaceFolder.uri.fsPath;

                const isPartial = picomatch(
                    AppModel.stripAnyLeadingSlashes(
                        Helper.getConfigSettings<string[]>(
                            "partialsList",
                            workspaceFolder
                        )
                    ),
                    {
                        ignore: AppModel.stripAnyLeadingSlashes(
                            Helper.getConfigSettings<string[]>(
                                "excludeList",
                                workspaceFolder
                            )
                        ),
                        dot: true,
                        nocase: true,
                    }
                );

                if (isPartial(path.relative(basePath, pathUrl))) {
                    return SassConfirmationType.PartialFile;
                }

                return SassConfirmationType.SassFile;
            }
        }

        return SassConfirmationType.NotSass;
    }

    private async isSassFileExcluded(
        sassPath: string,
        workspaceFolder?: vscode.WorkspaceFolder
    ): Promise<boolean> {
        OutputWindow.Show(
            OutputLevel.Trace,
            "Checking SASS path isn't excluded",
            [`Path: ${sassPath}`]
        );

        if (workspaceFolder) {
            const includeItems = Helper.getConfigSettings<string[] | null>(
                    "includeItems",
                    workspaceFolder
                ),
                excludeItems = AppModel.stripAnyLeadingSlashes(
                    Helper.getConfigSettings<string[]>(
                        "excludeList",
                        workspaceFolder
                    )
                ),
                forceBaseDirectory = Helper.getConfigSettings<string | null>(
                    "forceBaseDirectory",
                    workspaceFolder
                );

            let fileList = ["**/*.s[ac]ss"];

            if (includeItems && includeItems.length) {
                fileList = AppModel.stripAnyLeadingSlashes(
                    includeItems.concat(
                        Helper.getConfigSettings<string[]>(
                            "partialsList",
                            workspaceFolder
                        )
                    )
                );
            }

            let basePath = workspaceFolder.uri.fsPath;

            if (forceBaseDirectory && forceBaseDirectory.length > 1) {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    "`forceBaseDirectory` setting found, checking validity"
                );

                basePath = path.resolve(
                    basePath,
                    AppModel.stripLeadingSlash(forceBaseDirectory)
                );

                try {
                    if (!(await fs.promises.stat(basePath)).isDirectory()) {
                        OutputWindow.Show(
                            OutputLevel.Critical,
                            "Error with your `forceBaseDirectory` setting",
                            [
                                `Path is not a folder: ${basePath}`,
                                `Setting: "${forceBaseDirectory}"`,
                                `Workspace folder: ${workspaceFolder.name}`,
                            ]
                        );

                        return false;
                    }
                } catch {
                    OutputWindow.Show(
                        OutputLevel.Critical,
                        "Error with your `forceBaseDirectory` setting",
                        [
                            `Can not find path: ${basePath}`,
                            `Setting: "${forceBaseDirectory}"`,
                            `Workspace folder: ${workspaceFolder.name}`,
                        ]
                    );

                    return false;
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

            OutputWindow.Show(
                OutputLevel.Trace,
                "Searching folder",
                null,
                false
            );

            const searchLogs: Map<string, string[]> = new Map<
                    string,
                    string[]
                >(),
                isMatch = picomatch(fileList, {
                    ignore: excludeItems,
                    dot: true,
                    nocase: true,
                }),
                searchFileCount = (
                    await new fdir({
                        includeBasePath: true,
                        onlyCounts: true,
                        resolvePaths: true,
                        suppressErrors: true,
                    })
                        .filter(
                            (filePath) =>
                                filePath.toLowerCase().endsWith(".scss") ||
                                filePath.toLowerCase().endsWith(".sass")
                        )
                        .filter((filePath) => {
                            const result = isMatch(
                                path.relative(basePath, filePath)
                            );

                            searchLogs.set(`Path: ${filePath}`, [
                                `  isMatch: ${result}`,
                                `   - Base path: ${basePath}`,
                                `   - Rela path: ${path.relative(
                                    basePath,
                                    filePath
                                )}`,
                            ]);

                            return result;
                        })
                        .filter((filePath) => {
                            const result =
                                path
                                    .toNamespacedPath(filePath)
                                    .localeCompare(
                                        path.toNamespacedPath(sassPath),
                                        undefined,
                                        {
                                            sensitivity: "accent",
                                        }
                                    ) === 0;

                            searchLogs
                                .get(`Path: ${filePath}`)
                                ?.push(
                                    `  compare: ${result}`,
                                    `   - Orig file path: ${filePath}`,
                                    `   - Orig sass path: ${sassPath}`
                                );

                            return result;
                        })
                        .onlyCounts()
                        .crawl(basePath)
                        .withPromise()
                ).files;

            OutputWindow.Show(
                OutputLevel.Trace,
                "Search results",
                undefined,
                false
            );

            searchLogs.forEach((logs, key) => {
                OutputWindow.Show(OutputLevel.Trace, key, logs, false);
            });

            OutputWindow.Show(OutputLevel.Trace, null);

            // If doesn't include true then it's not been found
            if (searchFileCount > 0) {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    "File found, not excluded"
                );

                return false;
            } else {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    "File not found, must be excluded"
                );
                return true;
            }
        } else {
            OutputWindow.Show(
                OutputLevel.Trace,
                "No workspace folder, checking the current file"
            );

            return (
                path.basename(sassPath).startsWith("_") ||
                !(sassPath.endsWith(".scss") || sassPath.endsWith(".sass"))
            );
        }
    }

    private async getSassFiles(
        queryPattern?: string[],
        isDebugging = false
    ): Promise<string[]> {
        OutputWindow.Show(OutputLevel.Trace, "Getting SASS files", [
            `Query pattern: ${queryPattern}`,
            `Can be overwritten: ${queryPattern == undefined}`,
        ]);

        const fileList: string[] = [];

        if (
            vscode.workspace.workspaceFolders &&
            vscode.workspace.workspaceFolders.length > 0
        ) {
            (
                await Promise.all(
                    vscode.workspace.workspaceFolders.map(
                        async (folder, index) => {
                            OutputWindow.Show(
                                OutputLevel.Trace,
                                `Checking folder ${index + 1} of ${
                                    vscode.workspace.workspaceFolders!.length
                                }`,
                                [`Folder: ${folder.name}`]
                            );

                            const includeItems = Helper.getConfigSettings<
                                    string[] | null
                                >("includeItems", folder),
                                forceBaseDirectory = Helper.getConfigSettings<
                                    string | null
                                >("forceBaseDirectory", folder);

                            let basePath = folder.uri.fsPath,
                                excludedItems = isDebugging
                                    ? ["**/node_modules/**", ".vscode/**"]
                                    : Helper.getConfigSettings<string[]>(
                                          "excludeList",
                                          folder
                                      );

                            if (queryPattern) {
                                queryPattern = AppModel.stripAnyLeadingSlashes(
                                    Array.isArray(queryPattern)
                                        ? queryPattern
                                        : [queryPattern]
                                );
                            } else if (includeItems && includeItems.length) {
                                queryPattern =
                                    AppModel.stripAnyLeadingSlashes(
                                        includeItems
                                    );

                                OutputWindow.Show(
                                    OutputLevel.Trace,
                                    "Query pattern overwritten",
                                    [
                                        `New pattern(s): "${includeItems.join(
                                            '" , "'
                                        )}"`,
                                    ]
                                );
                            }

                            excludedItems =
                                AppModel.stripAnyLeadingSlashes(excludedItems);

                            if (
                                forceBaseDirectory &&
                                forceBaseDirectory.length > 1
                            ) {
                                OutputWindow.Show(
                                    OutputLevel.Trace,
                                    "`forceBaseDirectory` setting found, checking validity"
                                );

                                basePath = path.resolve(
                                    basePath,
                                    AppModel.stripLeadingSlash(
                                        forceBaseDirectory
                                    )
                                );

                                try {
                                    if (
                                        !(
                                            await fs.promises.stat(basePath)
                                        ).isDirectory()
                                    ) {
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

                            if (!isDebugging) {
                                // Add partials to excludedItems
                                excludedItems.push(
                                    ...AppModel.stripAnyLeadingSlashes(
                                        Helper.getConfigSettings<string[]>(
                                            "partialsList",
                                            folder
                                        )
                                    )
                                );
                            }

                            const isMatch = picomatch(
                                queryPattern || ["**/*.s[ac]ss"],
                                {
                                    ignore: excludedItems,
                                    dot: true,
                                    nocase: true,
                                }
                            );

                            return new fdir({
                                includeBasePath: true,
                                resolvePaths: true,
                                suppressErrors: true,
                            })
                                .filter(
                                    (filePath) =>
                                        filePath
                                            .toLowerCase()
                                            .endsWith(".scss") ||
                                        filePath.toLowerCase().endsWith(".sass")
                                )
                                .filter((filePath) =>
                                    isMatch(path.relative(basePath, filePath))
                                )
                                .withBasePath()
                                .crawl(basePath)
                                .withPromise();
                        }
                    )
                )
            ).forEach((files) => {
                files?.forEach((file) => {
                    fileList.push(file);
                });
            });
        } else {
            OutputWindow.Show(
                OutputLevel.Trace,
                "No workspace, must be a single file solution"
            );

            if (vscode.window.activeTextEditor) {
                fileList.push(vscode.window.activeTextEditor.document.fileName);
            } else {
                fileList.push("No files found - not even an active file");
            }
        }

        OutputWindow.Show(
            OutputLevel.Trace,
            `Found ${fileList.length} SASS files`
        );

        return fileList;
    }

    //#endregion Private

    //#endregion Fetch & check SASS functions

    //#region Debugging

    async debugInclusion(): Promise<void> {
        OutputWindow.Show(
            OutputLevel.Critical,
            "Checking current file",
            null,
            false
        );

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

            const workspaceFolder = AppModel.getWorkspaceFolder(sassPath);

            if (
                this.confirmSassType(sassPath, workspaceFolder) ==
                SassConfirmationType.NotSass
            ) {
                OutputWindow.Show(OutputLevel.Critical, "Not a Sass file", [
                    "The file currently open in the editor window isn't a sass file",
                ]);
            } else if (
                await this.isSassFileExcluded(sassPath, workspaceFolder)
            ) {
                OutputWindow.Show(OutputLevel.Critical, "File excluded", [
                    "The file is excluded based on your settings, please check your configuration",
                ]);
            } else {
                OutputWindow.Show(
                    OutputLevel.Critical,
                    "File should get processed",
                    [
                        "If the file isn't being processed, run `liveSass.command.debugFileList`",
                    ]
                );
            }
        } catch (err) {
            const sassPath = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document.fileName
                : "/* NO ACTIVE FILE, MESSAGE SHOULD HAVE BEEN THROWN */";

            if (err instanceof Error) {
                await this._logger.LogIssueWithAlert(
                    `Unhandled error while checking the active file. Error message: ${err.message}`,
                    {
                        file: sassPath,
                        error: ErrorLogger.PrepErrorForLogging(err),
                    }
                );
            } else {
                await this._logger.LogIssueWithAlert(
                    "Unhandled error while compiling the active file. Error message: UNKNOWN (not Error type)",
                    {
                        files: sassPath,
                        error: JSON.stringify(err),
                    }
                );
            }
        }
    }

    async debugFileList(): Promise<void> {
        try {
            const outputInfo: string[] = [],
                workspaceCount = vscode.workspace.workspaceFolders
                    ? vscode.workspace.workspaceFolders.length
                    : null;

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
                "Workspace Folders",
                "--------------------"
            );
            if (workspaceCount === null) {
                outputInfo.push("No workspaces, must be a single file");
            } else {
                vscode.workspace.workspaceFolders!.map((folder) => {
                    outputInfo.push(
                        `[${folder.index}] ${folder.name}\n${folder.uri.fsPath}`
                    );
                });

                await Promise.all(
                    vscode.workspace.workspaceFolders!.map(
                        async (folder, index) => {
                            const folderOutput: string[] = [];

                            folderOutput.push(
                                "--------------------",
                                `Checking workspace folder ${
                                    index + 1
                                } of ${workspaceCount}`,
                                `Path: ${folder.uri.fsPath}`,
                                "--------------------"
                            );

                            const exclusionList = Helper.getConfigSettings<
                                string[]
                            >("excludeList", folder);

                            folderOutput.push(
                                "--------------------",
                                "Current Include/Exclude Settings",
                                "--------------------",
                                `Include: [ ${
                                    Helper.getConfigSettings<string[] | null>(
                                        "includeItems",
                                        folder
                                    )?.join(", ") ?? "NULL"
                                } ]`,
                                `Exclude: [ ${exclusionList.join(", ")} ]`
                            );

                            folderOutput.push(
                                "--------------------",
                                "Included SASS Files",
                                "--------------------"
                            );
                            (await this.getSassFiles()).map((file) => {
                                folderOutput.push(file);
                            });

                            folderOutput.push(
                                "--------------------",
                                "Included Partial SASS Files",
                                "--------------------"
                            );
                            (
                                await this.getSassFiles(
                                    Helper.getConfigSettings<string[]>(
                                        "partialsList",
                                        folder
                                    ),
                                    true
                                )
                            ).map((file) => {
                                folderOutput.push(file);
                            });

                            folderOutput.push(
                                "--------------------",
                                "Excluded SASS Files",
                                "--------------------"
                            );
                            if (exclusionList.length > 0) {
                                (
                                    await this.getSassFiles(exclusionList, true)
                                ).map((file) => {
                                    folderOutput.push(file);
                                });
                            } else {
                                folderOutput.push("NONE");
                            }

                            outputInfo.push(...folderOutput);
                        }
                    )
                );
            }

            OutputWindow.Show(
                OutputLevel.Critical,
                "Extension Info",
                outputInfo
            );
        } catch (err) {
            const sassPath = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document.fileName
                : "/* NO ACTIVE FILE, DETAILS BELOW */";

            if (err instanceof Error) {
                await this._logger.LogIssueWithAlert(
                    `Unhandled error while checking the active file. Error message: ${err.message}`,
                    {
                        file: sassPath,
                        error: ErrorLogger.PrepErrorForLogging(err),
                    }
                );
            } else {
                await this._logger.LogIssueWithAlert(
                    "Unhandled error while compiling the active file. Error message: UNKNOWN (not Error type)",
                    {
                        files: sassPath,
                        error: JSON.stringify(err),
                    }
                );
            }
        }
    }

    //#endregion Debugging

    private static stripLeadingSlash(partialPath: string): string {
        return ["\\", "/"].indexOf(partialPath.substring(0, 1)) >= 0
            ? partialPath.substring(1)
            : partialPath;
    }

    private static stripAnyLeadingSlashes(
        stringArray: string[] | null
    ): string[] {
        if (!stringArray) {
            return [];
        }

        return stringArray.map((file) => {
            return AppModel.stripLeadingSlash(file);
        });
    }

    private static getWorkspaceFolder(
        filePath: string,
        suppressOutput = false
    ) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(
            vscode.Uri.file(filePath)
        );

        if (!suppressOutput) {
            const filename = filePath.toLowerCase();

            if (workspaceFolder) {
                OutputWindow.Show(
                    OutputLevel.Trace,
                    "Found the workspace folder",
                    [`Workspace Name: ${workspaceFolder.name}`]
                );
            } else if (
                filename.endsWith(".sass") ||
                filename.endsWith(".scss")
            ) {
                OutputWindow.Show(
                    OutputLevel.Warning,
                    "Warning: File is not in a workspace",
                    [`Path: ${filePath}`]
                );
            }
        }

        return workspaceFolder;
    }

    dispose(): void {
        OutputWindow.Show(OutputLevel.Trace, "Disposing app model");

        StatusBarUi.dispose();
        OutputWindow.dispose();

        OutputWindow.Show(OutputLevel.Trace, "App model disposed");
    }
}

enum SassConfirmationType {
    SassFile,
    PartialFile,
    NotSass,
}
