import * as fs from 'fs';
import * as path from 'path';
import { env, extensions, Memento, OutputChannel, Uri, version, window } from 'vscode';

const _errorLogPath: string = "liveSassCompiler.ErrorInfo";

export class ErrorLogger {
    private _workplaceState: Memento = null;
    logs: LogEvent[] = [];

    constructor(workplaceState: Memento) {
        this._workplaceState = workplaceState;

        this.ClearLogs();
    }

    async LogIssueWithAlert(Message: string, DetailedLogInfo: any) {
        WindowPopout.Alert(`Live Sass Compiler: ${Message}`);

        this.logs.push(
            new LogEvent(DetailedLogInfo)
        );

        await this.SaveLogs();
    }

    async SaveLogs() {
        await this._workplaceState.update(
            _errorLogPath,
            this.logs
        );
    }

    async InitiateIssueCreator() {
        let lastError: LogEvent | null = null;

        if (this.logs.length > 0) {
            lastError = this.logs[this.logs.length - 1];
        }

        await env.clipboard.writeText([
            '### UNEXPECTED ERROR\n',
            '**Machine & Versions**',
            `| Item | Value |\n|----------------------:|:-----------------------|\n| VS Code | v${version} |\n| Platform | ${process.platform} ${process.arch} |\n| Node | ${process.versions.node} (${process.versions.modules}) |\n| Live Sass | ${extensions.getExtension('glenn2223.live-sass').packageJSON.version} |`,
            `<details><summary>Installed Extensions</summary><div>\n${extensions.all.filter((ext) => ext.isActive).map((ext) => `- ${ext.id} (${ext.packageJSON.version})`).join('<br/>')}\n</div></details>`,
            '',
            `**LOG**: ${lastError === null ? '' : lastError.createdAt.toISOString().replace('T', ' ')}`,
            '```',
            (lastError === null ? '{ "NO LOG": "PLEASE SPECIFY YOUR ISSUE BELOW" }' : lastError),
            '```',
            '=======================',
            '<!-- You can add any supporting information below here -->\n'].join('\n')
        );

        await env.openExternal(Uri.parse('https://github.com/glenn2223/vscode-live-sass-compiler/issues/new?title=Unexpected+Error%3A+SUMMARY+HERE&body=%3C%21--+Highlight+this+line+and+then+paste+(Ctrl+%2B+V+%7C+Command+%2B+V)+--%3E'));

        OutputWindow.Show(
            'Opened your browser for creating an "Unexpected Error" issue',
            [
                // TODO: Ouput all incidents to Output
                //'Not the right error message? Run `outputAllLogs` to see all recorded errors'
            ],
            true,
            true
        );
    }

    private async ClearLogs() {
        return this._workplaceState.update(_errorLogPath, {});
    }

    static PrepErrorForLogging(Err: Error) {
        return JSON.parse(JSON.stringify(Err, Object.getOwnPropertyNames(Err)))
    }
}

class LogEvent {
    public createdAt: Date;
    public event: any;

    constructor(event: any) {
        this.createdAt = new Date();
        this.event = event;
    }
}

export class OutputWindow {
    private static _msgChannel: OutputChannel;

    private static get MsgChannel() {
        if (!OutputWindow._msgChannel) {
            OutputWindow._msgChannel = window.createOutputChannel('Live Sass Compile');
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
        window.showInformationMessage(message);
    }

    static Warn(message: string) {
        window.showWarningMessage(message);
    }

    static Alert(message: string) {
        window.showErrorMessage(message);
    }
}
