import * as vscode from 'vscode';

export class Helper {

    private static get configSettings() {
        return vscode.workspace.getConfiguration('liveSassCompile.settings');
    }

    static getConfigSettings<T>(val: string): T {
        return this.configSettings.get(val) as T;
    }

}
