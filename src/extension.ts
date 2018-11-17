'use strict';

import * as vscode from 'vscode';

import { AppModel } from './appModel';
import { checkNewAnnouncement } from './announcement/index';

export function activate(context: vscode.ExtensionContext) {

    console.log('"live-sass-compiler" is now activated! Go and Debug :P ');

    const appModel = new AppModel();

    checkNewAnnouncement(context.globalState);

    const disposablecompileAll =
        vscode.commands.registerCommand('liveSass.command.watchMySass', () => {
            appModel.compileAllFiles();
        });

    const disposableStopWaching =
        vscode.commands.registerCommand('liveSass.command.donotWatchMySass', () => {
            appModel.StopWaching();
        });

    const disposableOneTimeCompileSass =
        vscode.commands.registerCommand('liveSass.command.oneTimeCompileSass', () => {
            appModel.compileAllFiles(false);
        });

    const disposableOpenOutputWindow =
        vscode.commands.registerCommand('liveSass.command.openOutputWindow', () => {
            appModel.openOutputWindow();
        })
    const disposableOnDivSave =
        vscode.workspace.onDidSaveTextDocument(() => {
            appModel.compileOnSave();
        });

    context.subscriptions.push(disposablecompileAll,
        disposableStopWaching,
        disposableOnDivSave,
        disposableOneTimeCompileSass,
        disposableOpenOutputWindow,
        appModel);
}

export function deactivate() {
}
