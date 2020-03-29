'use strict';

import * as vscode from 'vscode';

import { AppModel } from './appModel';
import { checkNewAnnouncement } from './announcement/index';

export function activate(context: vscode.ExtensionContext) {
    console.log('"live-sass-compiler" is now activated! Go and debug :P ');

    const appModel = new AppModel(context.storagePath);

    checkNewAnnouncement(context.globalState);

    const
        disposablecompileAll =
            vscode.commands.registerCommand('liveSass.command.watchMySass', () => {
                appModel.StartWatching();
            }),
        disposableStopWaching =
            vscode.commands.registerCommand('liveSass.command.donotWatchMySass', () => {
                appModel.StopWatching();
            }),
        disposableOneTimeCompileSass =
            vscode.commands.registerCommand('liveSass.command.oneTimeCompileSass', () => {
                appModel.compileAllFiles();
            }),
        disposableCompileCurrentSass =
            vscode.commands.registerCommand('liveSass.command.compileCurrentSass', () => {
                appModel.compileCurrentFile();
            }),
        disposableOpenOutputWindow =
            vscode.commands.registerCommand('liveSass.command.openOutputWindow', () => {
                appModel.openOutputWindow();
            }),
        disposable =
            vscode.commands.registerCommand('liveSass.command.outputIssue', () => {
                appModel.outputIssue();
            }),
        disposableOnDidSave =
            vscode.workspace.onDidSaveTextDocument(() => {
                appModel.compileOnSave();
            });

    context.subscriptions.push(
        disposablecompileAll,
        disposableStopWaching,
        disposableOnDidSave,
        disposableOneTimeCompileSass,
        disposableCompileCurrentSass,
        disposableOpenOutputWindow,
        appModel);
}

export function deactivate() {
}
