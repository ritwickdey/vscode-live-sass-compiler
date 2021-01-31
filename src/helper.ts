import * as vscode from "vscode";

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
}
