import { env, extensions, Memento, OutputChannel, Uri, version, window } from "vscode";
import { Helper } from "./helper";

const _errorLogPath = "liveSassCompiler.ErrorInfo";

export class ErrorLogger {
    private _workplaceState: Memento;
    logs: LogEvent[] = [];

    constructor(workplaceState: Memento) {
        OutputWindow.Show(OutputLevel.Trace, "Constructing error logger");

        this._workplaceState = workplaceState;

        OutputWindow.Show(OutputLevel.Trace, "Clearing any old log data");

        this.ClearLogs();
    }

    async LogIssueWithAlert(Message: string, DetailedLogInfo: unknown): Promise<void> {
        OutputWindow.Show(OutputLevel.Trace, "Logging issue", [`Message: ${Message}`]);

        WindowPopout.Alert(`Live Sass Compiler: ${Message}`);

        this.logs.push(new LogEvent(DetailedLogInfo));

        await this.SaveLogs();
    }

    private async SaveLogs(): Promise<void> {
        OutputWindow.Show(OutputLevel.Trace, "Saving logs to storage");

        await this._workplaceState.update(_errorLogPath, this.logs);
    }

    async InitiateIssueCreator(): Promise<void> {
        OutputWindow.Show(OutputLevel.Trace, "Issue creation started", [
            "Preparing last error for output",
        ]);

        let lastError: LogEvent | null = null;

        if (this.logs.length > 0) {
            OutputWindow.Show(OutputLevel.Trace, "Error log has been found");

            lastError = this.logs[this.logs.length - 1];
        } else {
            OutputWindow.Show(OutputLevel.Trace, "No error log could be found");
        }

        await env.clipboard.writeText(
            [
                "### UNEXPECTED ERROR\n",
                "**Machine & Versions**",
                "| Item | Value |",
                "|----------------------:|:-----------------------|",
                `| VS Code | v${version} |`,
                `| Platform | ${process.platform} ${process.arch} |`,
                `| Node | ${process.versions.node} (${process.versions.modules}) |`,
                `| Live Sass | ${
                    extensions.getExtension("glenn2223.live-sass")!.packageJSON.version
                } |`,
                `<details><summary>Installed Extensions</summary><div>`,
                extensions.all
                    .filter((ext) => ext.isActive)
                    .map((ext) => `- ${ext.id} (${ext.packageJSON.version})`)
                    .join("<br/>"),
                "</div></details>",
                "",
                `**LOG**: ${
                    lastError === null ? "" : lastError.createdAt.toISOString().replace("T", " ")
                }`,
                "```JSON",
                lastError === null
                    ? '{\n"NO LOG": "PLEASE SPECIFY YOUR ISSUE BELOW"\n}'
                    : JSON.stringify(lastError, null, 4),
                "```",
                "=======================",
                "<!-- You can add any supporting information below here -->\n",
            ].join("\n")
        );

        OutputWindow.Show(OutputLevel.Trace, "Ready to create issue", [
            "The data has been saved to the clipboard",
            "Attempting to open new issue URL on GitHub",
        ]);

        await env.openExternal(
            Uri.parse(
                "https://github.com/glenn2223/vscode-live-sass-compiler/issues/new" 
                    + `?title=${lastError === null ? "Issue+Report" : "Unexpected+Error"}%3A+SUMMARY+HERE`
                    + "&body=%3C%21--+Highlight+this+line+and+then+paste+(Ctrl+%2B+V+%7C+Command+%2B+V)+--%3E"
            )
        );

        OutputWindow.Show(
            OutputLevel.Critical,
            'Opened your browser for creating an "Unexpected Error" issue',
            [
                // TODO: If required - setup command for outputting all logs
                //'Not the right error message? Run `outputAllLogs` to see all recorded errors'
            ]
        );
    }

    private async ClearLogs(): Promise<void> {
        OutputWindow.Show(OutputLevel.Trace, "Error logs cleared");

        return this._workplaceState.update(_errorLogPath, {});
    }

    static PrepErrorForLogging(Err: Error): unknown {
        OutputWindow.Show(OutputLevel.Trace, "Converting error to a usable object");

        return JSON.parse(JSON.stringify(Err, Object.getOwnPropertyNames(Err)));
    }
}

class LogEvent {
    public createdAt: Date;
    public event: unknown;

    constructor(event: unknown) {
        this.createdAt = new Date();
        this.event = event;
    }
}

export class OutputWindow {
    private static _msgChannel: OutputChannel;

    private static get MsgChannel() {
        if (!OutputWindow._msgChannel) {
            OutputWindow._msgChannel = window.createOutputChannel("Live Sass Compile");
        }

        return OutputWindow._msgChannel;
    }

    static Show(
        outputLevel: OutputLevel,
        msgHeadline: string | null,
        msgBody?: string[] | null,
        addEndLine = true
    ): void {
        const userLogLevel = Helper.getOutputLogLevel();

        if (outputLevel >= userLogLevel || outputLevel === OutputLevel.Critical) {
            OutputWindow.MsgChannel.show(true);

            if (msgHeadline) {
                OutputWindow.MsgChannel.appendLine(msgHeadline);
            }

            if (msgBody) {
                msgBody.forEach((msg) => {
                    OutputWindow.MsgChannel.appendLine(msg);
                });
            }

            if (addEndLine) {
                OutputWindow.MsgChannel.appendLine("--------------------");
            }
        }
    }

    static dispose(): void {
        this.MsgChannel.dispose();
    }
}

export class WindowPopout {
    static Inform(message: string): void {
        window.showInformationMessage(message);
    }

    static Warn(message: string): void {
        window.showWarningMessage(message);
    }

    static Alert(message: string): void {
        window.showErrorMessage(message);
    }
}

export enum OutputLevel {
    Trace = 1,
    Debug = 2,
    Information = 3,
    Warning = 4,
    Error = 5,
    Critical = 6,
}
