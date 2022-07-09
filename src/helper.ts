import * as vscode from "vscode";
import { OutputLevel } from "./VscodeExtensions";

export interface IFormat {
    format: "compressed" | "expanded";
    extensionName: string;
    savePath?: string;
    savePathReplacementPairs?: Record<string, unknown>,
    savePathSegmentKeys?: string[];
    savePathReplaceSegmentsWith?: string;
    linefeed: "cr" | "crlf" | "lf" | "lfcr";
    indentType: "space" | "tab";
    indentWidth: number;
}

export class Helper {
    private static configSettings(folder?: vscode.WorkspaceFolder) {
        return vscode.workspace.getConfiguration("liveSassCompile.settings", folder);
    }

    static getConfigSettings<T>(val: string, folder?: vscode.WorkspaceFolder): T {
        return this.configSettings(folder).get(val) as T;
    }

    static getOutputLogLevel(): OutputLevel {
        switch (this.configSettings().get("showOutputWindowOn") as string) {
            case "Trace":
                return OutputLevel.Trace;

            case "Debug":
                return OutputLevel.Debug;

            case "Warning":
                return OutputLevel.Warning;

            case "Error":
                return OutputLevel.Error;

            case "None":
                return OutputLevel.Critical;

            case "Information":
            default: {
                const oldSetting = this.configSettings().get("showOutputWindow") as boolean | null;

                return oldSetting == false
                    ? OutputLevel.Warning
                    : OutputLevel.Information;
            }
        }
    }

    static async updateOutputLogLevel(level: OutputLevel): Promise<void> {
        let value: string | undefined;

        switch (level) {
            case OutputLevel.Trace:
                value = "Trace";
                break;

            case OutputLevel.Debug:
                value = "Debug";
                break;

            case OutputLevel.Warning:
                value = "Warning";
                break;

            case OutputLevel.Error:
                value = "Error";
                break;

            case OutputLevel.Critical:
                value = "None";
                break;

            case OutputLevel.Information:
            default:
                // `undefined` clears the setting from file
                // Clearing will then result in the default value
                value = undefined;
                break;
        }

        await this.configSettings().update("showOutputWindowOn", value);
    }
}
