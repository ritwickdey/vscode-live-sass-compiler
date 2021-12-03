import { Helper, IFormat } from "./helper";
import { OutputWindow, OutputLevel } from "./VscodeExtensions";
import { SassException } from "sass";
import * as compiler from "sass";

export class SassHelper {
    static toSassOptions(format: IFormat): compiler.Options {
        return {
            outputStyle: format.format,
            linefeed: format.linefeed,
            indentType: format.indentType,
            indentWidth: format.indentWidth,
        };
    }

    static compileOne(
        SassPath: string,
        targetCssUri: string,
        mapFileUri: string,
        options: compiler.Options
    ): { result: compiler.Result | null; errorString: string | null } {
        const generateMap = Helper.getConfigSettings<boolean>("generateMap"),
            data: compiler.Options = {};

        Object.assign(data, options);

        data.file = SassPath;
        data.omitSourceMapUrl = true;
        data.logger = {
            warn: (
                message: string,
                options: { deprecation: boolean; span?: compiler.SourceSpan; stack?: string }
            ) => {
                OutputWindow.Show(
                    OutputLevel.Warning,
                    "Warning:",
                    [message].concat(this.format(options.span))
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

        data.outFile = targetCssUri;
        data.sourceMap = mapFileUri;

        if (!generateMap) {
            data.omitSourceMapUrl = true;
        }

        try {
            return { result: compiler.renderSync(data), errorString: null };
        } catch (err) {
            if (this.instanceOfSassExcpetion(err)) {
                return { result: null, errorString: err.formatted };
            } else if (err instanceof Error) {
                return { result: null, errorString: err.message };
            }

            return { result: null, errorString: "Unexpected error" };
        }
    }

    private static instanceOfSassExcpetion(object: unknown): object is SassException {
        return "formatted" in (object as SassException);
    }

    private static format(span: compiler.SourceSpan | undefined | null): string[] {
        const stringArray: string[] = [];

        if (span === undefined || span === null) {
            return stringArray;
        }

        stringArray.push(this.charOfLength(span.start.line.toString().length, "╷"));

        let lineNumber = span.start.line;

        do {
            stringArray.push(
                `${lineNumber} |${
                    span.context?.split("\n")[lineNumber - span.start.line] ??
                    span.text.split("\n")[lineNumber - span.start.line]
                }`
            );

            lineNumber++;
        } while (lineNumber < span.end.line);

        stringArray.push(
            this.charOfLength(span.start.line.toString().length, this.addUnderLine(span))
        );

        stringArray.push(this.charOfLength(span.start.line.toString().length, "╵"));

        if (span.url) {
            // possibly include `,${span.end.line}:${span.end.column}`, if VS Code ever supports it
            stringArray.push(`${span.url.toString()}:${span.start.line}:${span.start.column}`);
        }

        return stringArray;
    }

    private static charOfLength(charCount: number, suffix?: string, char = " "): string {
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
                this.charOfLength(span.end.column - span.start.column - 1, "^", ".");
        }

        return outString;
    }
}
