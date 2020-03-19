'use strict';
import * as vscode from 'vscode';
import { AppModel } from './appModel';
import { checkNewAnnouncement } from './announcement/index';
import { WindowPopout, OutputWindow } from './VscodeWindow';

export function activate(context: vscode.ExtensionContext) {

    console.log('"live-sass-compiler" is now actived! Go and debug :P ');

    let appModel = new AppModel();

    checkNewAnnouncement(context.globalState);

    let disposablecompileAll =
        vscode.commands.registerCommand('liveSass.command.watchMySass', () => {
            appModel.compileAllFiles();
        });

    let disposableStopWaching =
        vscode.commands.registerCommand('liveSass.command.donotWatchMySass', () => {
            appModel.StopWaching();
        });

    let disposableOneTimeCompileSass =
        vscode.commands.registerCommand('liveSass.command.oneTimeCompileSass', () => {
            appModel.compileAllFiles(false);
        });

    let disposableCompileCurrentSass =
        vscode.commands.registerCommand('liveSass.command.compileCurrentSass', () => {
            appModel.compileCurrentFile();
        });

    let disposableOpenOutputWindow =
        vscode.commands.registerCommand('liveSass.command.openOutputWindow', () => {
            appModel.openOutputWindow();
        })

    let disposableOnDidSave =
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
