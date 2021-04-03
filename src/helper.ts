import * as vscode from "vscode";
import { OutputLevel } from "./VscodeExtensions";

export interface IFormat {
    format: "compressed" | "expanded";
    extensionName: string;
    savePath: string;
    savePathSegmentKeys?: string[];
    savePathReplaceSegmentsWith: string;
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

            case "Information":
                return OutputLevel.Information;

            case "Error":
                return OutputLevel.Error;

            case "None":
                return OutputLevel.Critical;

            case "Warning":
            default:
                return OutputLevel.Warning;
        }
    }
}
