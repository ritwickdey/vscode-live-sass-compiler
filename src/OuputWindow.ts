import * as vscode from 'vscode';

export class OutputWindow {
    
    private static _msgChannel: vscode.OutputChannel;

    private static get MsgChannel() {

        if(!OutputWindow._msgChannel) {
             OutputWindow._msgChannel = vscode.window.createOutputChannel('Live Sass Compile');
        }
        
        return OutputWindow._msgChannel;
    }
    
    static Show(msgHeadline: string, MsgBody: string[], popUpToUI: boolean = false) {
        
        OutputWindow.MsgChannel.appendLine(msgHeadline);

        if (MsgBody) {
            MsgBody.forEach(msg => {
                OutputWindow.MsgChannel.appendLine(msg);
            });
        }

        if (popUpToUI) {
            OutputWindow.MsgChannel.show(true);
        }

        OutputWindow.MsgChannel.appendLine('--------------------')
    }

    static dispose() {
        this.MsgChannel.dispose();
    }

}