'use strict';

import * as vscode from 'vscode';

import { AppModel } from './appModel';
import { checkNewAnnouncement } from './announcement/index';
import { ErrorLogger } from './VscodeExtensions';

export async function activate(context: vscode.ExtensionContext) {
    try {
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
            disposableCreateIssue =
                vscode.commands.registerCommand('liveSass.command.createIssue', () => {
                    appModel.createIssue();
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
            disposableCreateIssue,
            appModel)
    }
    catch (err) {
        await new ErrorLogger(context.storagePath).LogIssueWithAlert(
            `Unhandled error with Live Sass Compiler. Error message: ${err.message}`,
            {
                'error': ErrorLogger.PrepErrorForLogging(err)
            }
        );
    }
}

export function deactivate() {
}
