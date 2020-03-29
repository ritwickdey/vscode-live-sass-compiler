import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import { resolve } from 'url';

export class ErrorLogger {
    private _workspaceStorageLocation: string = null;

    constructor(LogFolder: string) {
        const startUpProcesses = async function (logger: ErrorLogger) {
            await logger.CheckFolderExists();

            logger.ClearLogFolder();
        };

        this._workspaceStorageLocation = LogFolder;

        startUpProcesses(this);
    }

    async LogIssueWithAlert(Message: string, DetailedLogInfo: any) {
        WindowPopout.Alert(`Live Sass Compiler: ${Message}`);

        const jsonLog = JSON.stringify(DetailedLogInfo);

        const err = await new Promise<NodeJS.ErrnoException>(resolve =>
            fs.writeFile(
                path.join(this._workspaceStorageLocation, new Date().toISOString().replace('T', '_').replace('Z', '').replace(/:/gm, '-') + '.txt'),
                `${Message}\n\n${jsonLog}`,
                (err) => resolve(err)
            ));

        if (err)
            OutputWindow.Show(
                'Could not write error to log',
                ['Error:', JSON.stringify(err), '', 'Original error details are below. You can save them opening an issue', Message, jsonLog],
                true,
                true
            );
    }

    async OutputIsssueDetails() {
        const result = await new Promise<{ Error: NodeJS.ErrnoException, Files: string[] }>(resolve => fs.readdir(this._workspaceStorageLocation, (err, files) => resolve({ Error: err, Files: files })));

        let 
            lastDate = new Date(0),
            lastLogName: string = null,
            lastLogData: string = null;

        if (!result.Error) {
            for (const file of result.Files) {
                const dateString = `${file.split('_')[0]}T${file.split('_')[1].replace(/-/gm,':').replace('.txt','')}`;
                if (new Date(dateString) > lastDate) {
                    lastDate = new Date(dateString);
                    lastLogName = file;
                }
            }

            if (lastLogName !== null)
                lastLogData = fs.readFileSync(path.join(this._workspaceStorageLocation,lastLogName)).toString();
        }

        OutputWindow.Show(
            '=======================\nCOPY FROM THE NEXT LINE\n=======================', 
            [
                '### UNEXPECTED ERROR\n', 
                '**Machine & Versions**',
                `| Item | Value |\n|----------------------:|:-----------------------|\n| Platform | ${process.platform} |\n| Arch | ${process.arch} |\n| Node | ${process.versions.node} (${process.versions.modules}) |`,
                '',
                `**LOG**: ${lastDate.toISOString().replace('T', ' ')}`,
                `\`\`\` JSON`,
                (lastLogData === null ? '{ "NO LOG": "PLEASE SPECIFY YOUR ISSUE BELOW" }' : lastLogData),
                `\`\`\``,
                '======================='
            ], 
            true, 
            false
        );

        OutputWindow.Show(
            'Use the information above to log an "Unexpected error" issue', 
            [
                'You can file it at https://github.com/ritwickdey/vscode-live-sass-compiler/issues/new?title=Unexpected+Error%3A+SUMMARY+HERE&body=Paste+output+window+content+here', 
                `Not the right error message? You can find all error logs here: ${this._workspaceStorageLocation}`
            ], 
            true, 
            true
        );
    }

    private async CheckFolderExists() {
        const exists = await new Promise<Boolean>(resolve => { fs.exists(this._workspaceStorageLocation, (exists) => resolve(exists)) });
        if (!exists)
            await new Promise(_ => fs.mkdir(path.join(this._workspaceStorageLocation, 'example-file.txt')));
    }

    private async ClearLogFolder() {
        const
            result = await new Promise<{ Error: NodeJS.ErrnoException, Files: string[] }>(resolve => fs.readdir(this._workspaceStorageLocation, (err, files) => resolve({ Error: err, Files: files }))),
            promises: Promise<NodeJS.ErrnoException>[] = [];

        if (result.Error) return;

        for (const file of result.Files)
            if ((new Date().valueOf() - new Date(file.split('_')[0]).valueOf()) > 259200000)
                promises.push(new Promise<NodeJS.ErrnoException>(resolve =>
                    fs.unlink(path.join(this._workspaceStorageLocation, file), err => resolve(err))
                ));

        if (promises.length) {
            var errors = (await Promise.all(promises)).filter((val) => val !== null);
            if (errors.length)
                OutputWindow.Show('Could not clear log history, details below', [JSON.stringify(errors)], true, true);
        }
    }

    static PrepErrorForLogging(Err: Error) {
        return JSON.parse(JSON.stringify(Err, Object.getOwnPropertyNames(Err)))
    }
}

export class OutputWindow {
    private static _msgChannel: vscode.OutputChannel;

    private static get MsgChannel() {
        if (!OutputWindow._msgChannel) {
            OutputWindow._msgChannel = vscode.window.createOutputChannel('Live Sass Compile');
        }

        return OutputWindow._msgChannel;
    }

    static Show(msgHeadline: string, MsgBody: string[], popUpToUI: Boolean = false, addEndLine = true) {
        if (msgHeadline) {
            OutputWindow.MsgChannel.appendLine(msgHeadline);
        }

        if (MsgBody) {
            MsgBody.forEach(msg => {
                OutputWindow.MsgChannel.appendLine(msg);
            });
        }

        if (popUpToUI) {
            OutputWindow.MsgChannel.show(true);
        }

        if (addEndLine) {
            OutputWindow.MsgChannel.appendLine('--------------------');
        }
    }

    static dispose() {
        this.MsgChannel.dispose();
    }
}

export class WindowPopout {
    static Inform(message: string) {
        vscode.window.showInformationMessage(message);
    }

    static Warn(message: string) {
        vscode.window.showWarningMessage(message);
    }

    static Alert(message: string) {
        vscode.window.showErrorMessage(message);
    }
}