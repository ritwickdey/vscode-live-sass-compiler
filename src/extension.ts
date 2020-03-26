'use strict';

import * as vscode from 'vscode';

import { AppModel } from './appModel';
import { checkNewAnnouncement } from './announcement/index';
import { WindowPopout, OutputWindow } from './VscodeWindow';

export function activate(context: vscode.ExtensionContext) {

    console.log('"live-sass-compiler" is now activated! Go and debug :P ');

    const appModel = new AppModel();

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
        disposableOnDidSave =
            vscode.workspace.onDidSaveTextDocument(() => {
                try {
                    appModel.compileOnSave();
                }
                catch (e) {
                    OutputWindow.Show("Compile on save errored", [e.message, "", e.stack], false);
                    WindowPopout.Alert('Live Sass Compiler:\nCompile on save has errored, see output window for details');
                }
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
