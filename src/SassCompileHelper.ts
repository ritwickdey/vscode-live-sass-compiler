import { Helper, IFormat } from "./helper";
import { OutputWindow } from "./VscodeExtensions";
import { OutputLevel } from "./OutputLevel";
import { LegacyException } from "sass";
import * as compiler from "sass";
import { workspace } from "vscode";
import { existsSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";

export class SassHelper {
    private static parsePath<T>(
        importUrl: string,
        cb: (newPath: string) => T
    ): T | null {
        if (workspace.workspaceFolders) {
            const normalisedUrl = importUrl.replace(/\\/g, "/"),
                urlParts = normalisedUrl
                    .substring(1)
                    .split("/")
                    .filter((x) => x.length > 0);

            if (
                normalisedUrl.startsWith("~") &&
                normalisedUrl.indexOf("/") > -1
            ) {
                for (let i = 0; i < workspace.workspaceFolders.length; i++) {
                    const workingPath = [
                        workspace.workspaceFolders[i].uri.fsPath,
                        "node_modules",
                    ]
                        .concat(...urlParts.slice(0, -1))
                        .join("/");

                    if (existsSync(workingPath)) {
                        return cb(
                            workingPath +
                                path.sep +
                                urlParts.slice(-1).join(path.sep)
                        );
                    }
                }
            } else if (normalisedUrl.startsWith("/")) {
                for (let i = 0; i < workspace.workspaceFolders.length; i++) {
                    const folder = workspace.workspaceFolders[i],
                        rootIsWorkspace = Helper.getConfigSettings<boolean>(
                            "rootIsWorkspace",
                            folder
                        );

                    if (rootIsWorkspace) {
                        const filePath = [
                            folder.uri.fsPath,
                            normalisedUrl.substring(1),
                        ].join("/");

                        if (
                            existsSync(
                                filePath.substring(0, filePath.lastIndexOf("/"))
                            )
                        ) {
                            return cb(filePath);
                        }
                    }
                }
            }
        }

        return null;
    }

    private static readonly loggerProperty = {
        warn: (
            message: string,
            options: {
                deprecation: boolean;
                span?: compiler.SourceSpan;
                stack?: string;
            }
        ) => {
            OutputWindow.Show(
                OutputLevel.Warning,
                "Warning:",
                [message].concat(
                    this.format(
                        options.span,
                        options.stack,
                        options.deprecation
                    )
                )
            );
        },
        debug: (message: string, options: { span?: compiler.SourceSpan }) => {
            OutputWindow.Show(
                OutputLevel.Debug,
                "Debug info:",
                [message].concat(this.format(options.span))
            );
        },
    };

    static toSassOptions<T extends boolean>(
        format: IFormat,
        useNew: T
    ): T extends true
        ? compiler.LegacyFileOptions<"sync">
        : compiler.Options<"sync">;
    static toSassOptions(
        format: IFormat,
        useNew: boolean
    ): compiler.LegacyFileOptions<"sync"> | compiler.Options<"sync"> {
        if (useNew) {
            const options: compiler.Options<"sync"> = {
                style: format.format,
                importers: [
                    {
                        findFileUrl: (importUrl) =>
                            SassHelper.parsePath(importUrl, (newPath) =>
                                pathToFileURL(newPath)
                            ),
                    },
                ],
                logger: SassHelper.loggerProperty,
            };

            return options;
        } else {
            const legacyOptions: compiler.LegacyFileOptions<"sync"> = {
                file: "",
                outputStyle: format.format,
                omitSourceMapUrl: true,
                linefeed: format.linefeed,
                indentType: format.indentType,
                indentWidth: format.indentWidth,
                importer: (importUrl) =>
                    SassHelper.parsePath(importUrl, (newPath) => {
                        return { file: newPath };
                    }),
                logger: SassHelper.loggerProperty,
            };

            return legacyOptions;
        }
    }

    static compileOne(
        SassPath: string,
        targetCssUri: string,
        mapFileUri: string,
        options: compiler.LegacyFileOptions<"sync"> | compiler.Options<"sync">
    ): {
        result: { css: string; map?: string } | null;
        errorString: string | null;
    } {
        try {
            if ("file" in options) {
                const data: compiler.LegacyFileOptions<"sync"> = { file: "" };

                Object.assign(data, options);

                data.file = SassPath;

                data.outFile = targetCssUri;
                data.sourceMap = mapFileUri;

                const renderResult = compiler.renderSync(data);

                return {
                    result: {
                        css: renderResult.css.toString(),
                        map: renderResult.map?.toString(),
                    },
                    errorString: null,
                };
            }

            const compileResult = compiler.compile(SassPath, options);

            return {
                result: {
                    css: compileResult.css,
                    map: compileResult.sourceMap
                        ? JSON.stringify(compileResult.sourceMap)
                        : undefined,
                },
                errorString: null,
            };
        } catch (err) {
            if (this.instanceOfSassExcpetion(err)) {
                return { result: null, errorString: err.formatted };
            } else if (err instanceof Error) {
                return { result: null, errorString: err.message };
            }

            return { result: null, errorString: "Unexpected error" };
        }
    }

    private static instanceOfSassExcpetion(
        object: unknown
    ): object is LegacyException {
        return "formatted" in (object as LegacyException);
    }

    private static format(
        span: compiler.SourceSpan | undefined | null,
        stack?: string,
        deprecated?: boolean
    ): string[] {
        const stringArray: string[] = [];

        if (span === undefined || span === null) {
            if (stack !== undefined) {
                stringArray.push(stack);
            }
        } else {
            stringArray.push(
                this.charOfLength(span.start.line.toString().length, "╷")
            );

            let lineNumber = span.start.line;

            do {
                stringArray.push(
                    `${lineNumber} |${
                        span.context?.split("\n")[
                            lineNumber - span.start.line
                        ] ?? span.text.split("\n")[lineNumber - span.start.line]
                    }`
                );

                lineNumber++;
            } while (lineNumber < span.end.line);

            stringArray.push(
                this.charOfLength(
                    span.start.line.toString().length,
                    this.addUnderLine(span)
                )
            );

            stringArray.push(
                this.charOfLength(span.start.line.toString().length, "╵")
            );

            if (span.url) {
                // possibly include `,${span.end.line}:${span.end.column}`, if VS Code ever supports it
                stringArray.push(
                    `${span.url.toString()}:${span.start.line}:${
                        span.start.column
                    }`
                );
            }
        }

        if (deprecated === true) {
            stringArray.push(
                "THIS IS DEPRECATED AND WILL BE REMOVED IN SASS 2.0"
            );
        }

        return stringArray;
    }

    private static charOfLength(
        charCount: number,
        suffix?: string,
        char = " "
    ): string {
        if (charCount < 0) {
            return suffix ?? "";
        }

        let outString = "";

        for (let item = 0; item <= charCount; item++) {
            outString += char;
        }

        return outString + (suffix ?? "");
    }

    private static addUnderLine(span: compiler.SourceSpan): string {
        let outString = "|";

        if (span.start.line !== span.end.line) {
            outString += this.charOfLength(span.end.column - 4, "...^");
        } else {
            outString +=
                this.charOfLength(span.start.column - 2, "^") +
                this.charOfLength(
                    span.end.column - span.start.column - 1,
                    "^",
                    "."
                );
        }

        return outString;
    }
}
