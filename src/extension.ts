'use strict';
import * as vscode from 'vscode';
import { AppModel } from './appModel';

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "live-sass" is now active!');
    var appModel = new AppModel();

    let disposable = vscode.commands.registerCommand('extension.liveSass.transpile', () => {
        appModel.compileAllFiles();
    });

    vscode.workspace.onDidSaveTextDocument(()=>{
        appModel.compileOnSave();
    });

    context.subscriptions.push(disposable,appModel);
}


export function deactivate() {
}