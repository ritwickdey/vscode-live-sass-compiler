import * as vscode from 'vscode';

export class WindowPopout {
    static Inform(message: string)
    {
        vscode.window.showInformationMessage(message);
    }

    static Warn(message: string)
    {
        vscode.window.showWarningMessage(message);
    }

    static Alert(message: string)
    {
        vscode.window.showErrorMessage(message);
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
