'use strict';
import * as vscode from 'vscode';
import { AppModel } from './appModel';

export function activate(context: vscode.ExtensionContext) {

    console.log('"live-sass-compiler" is now actived! Go and Debug :P ');

    var appModel = new AppModel();

    let disposablecompileAll =
        vscode.commands.registerCommand('liveSass.command.watchMySass', () => {
            appModel.compileAllFiles();
        });

    let disposableStopWaching =
        vscode.commands.registerCommand('liveSass.command.donotWatchMySass', () => {
            appModel.StopWaching();
        });

    let disposableOnDivSave =
        vscode.workspace.onDidSaveTextDocument(() => {
            appModel.compileOnSave();
        });

    context.subscriptions.push(disposablecompileAll,
        disposableStopWaching,
        disposableOnDivSave,
        appModel);
}


export function deactivate() {
}