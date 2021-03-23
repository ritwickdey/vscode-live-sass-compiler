"use strict";

import * as vscode from "vscode";

import { AppModel } from "./appModel";
import { checkNewAnnouncement } from "./announcement/index";
import { ErrorLogger, OutputLevel, OutputWindow } from "./VscodeExtensions";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    try {
        OutputWindow.Show(OutputLevel.Trace, '"live-sass-compiler" is now activate');

        const appModel = new AppModel(context.workspaceState);

        checkNewAnnouncement(context.globalState);

        const disposablecompileAll = vscode.commands.registerCommand(
                "liveSass.command.watchMySass",
                async () => {
                    await appModel.StartWatching();
                }
            ),
            disposableStopWaching = vscode.commands.registerCommand(
                "liveSass.command.donotWatchMySass",
                () => {
                    appModel.StopWatching();
                }
            ),
            disposableOneTimeCompileSass = vscode.commands.registerCommand(
                "liveSass.command.oneTimeCompileSass",
                async () => {
                    await appModel.compileAllFiles();
                }
            ),
            disposableCompileCurrentSass = vscode.commands.registerCommand(
                "liveSass.command.compileCurrentSass",
                async () => {
                    await appModel.compileCurrentFile();
                }
            ),
            disposableOpenOutputWindow = vscode.commands.registerCommand(
                "liveSass.command.openOutputWindow",
                () => {
                    appModel.openOutputWindow();
                }
            ),
            disposableCreateIssue = vscode.commands.registerCommand(
                "liveSass.command.createIssue",
                async () => {
                    await appModel.createIssue();
                }
            ),
            disposableDebugInclusion = vscode.commands.registerCommand(
                "liveSass.command.debugInclusion",
                async () => {
                    await appModel.debugInclusion();
                }
            ),
            disposableDebugFileList = vscode.commands.registerCommand(
                "liveSass.command.debugFileList",
                async () => {
                    await appModel.debugFileList();
                }
            ),
            disposableOnDidSave = vscode.workspace.onDidSaveTextDocument(async () => {
                // TODO: ADD - once autoprefixer can stop caching browserslist
                //await appModel.browserslistChecks();
                await appModel.compileOnSave();
            });

        context.subscriptions.push(
            disposablecompileAll,
            disposableStopWaching,
            disposableOnDidSave,
            disposableOneTimeCompileSass,
            disposableCompileCurrentSass,
            disposableOpenOutputWindow,
            disposableCreateIssue,
            disposableDebugInclusion,
            disposableDebugFileList,
            appModel
        );

        OutputWindow.Show(OutputLevel.Trace, "Live SASS commands ready", [
            "Commands have been saved and are ready to be used",
        ]);
    } catch (err) {
        await new ErrorLogger(context.workspaceState).LogIssueWithAlert(
            `Unhandled error with Live Sass Compiler. Error message: ${err.message}`,
            {
                error: ErrorLogger.PrepErrorForLogging(err),
            }
        );
    }
}

export function deactivate(): void {
    // No actual actions are required

    OutputWindow.Show(OutputLevel.Trace, '"live-sass-compiler" deactivated');
}
