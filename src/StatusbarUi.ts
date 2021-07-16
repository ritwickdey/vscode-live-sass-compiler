import * as vscode from "vscode";
import { OutputLevel, OutputWindow } from "./VscodeExtensions";

export class StatusBarUi {
    private static _statusBarItem: vscode.StatusBarItem;

    private static get statusBarItem() {
        if (!StatusBarUi._statusBarItem) {
            StatusBarUi._statusBarItem = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Right,
                200
            );
            this.statusBarItem.show();
        }

        return StatusBarUi._statusBarItem;
    }

    static init(watchOnLaunch: boolean): void {
        StatusBarUi.customMessage("Starting...", "Initializing... switching state in 1 second");
        
        setTimeout(function () {
            watchOnLaunch ? StatusBarUi.watching() : StatusBarUi.notWatching();
        }, 1000);
    }

    static watching(): void {
        OutputWindow.Show(OutputLevel.Trace, "Changing status bar to: Watching");

        StatusBarUi.statusBarItem.text = `$(telescope) Watching...`;
        StatusBarUi.statusBarItem.color = "inherit";
        StatusBarUi.statusBarItem.command = "liveSass.command.donotWatchMySass";
        StatusBarUi.statusBarItem.tooltip = "Stop live compilation of SASS or SCSS to CSS";
    }

    static notWatching(): void {
        OutputWindow.Show(
            OutputLevel.Trace,
            "Changing status bar to: Not watching (or Watch SASS)"
        );

        StatusBarUi.statusBarItem.text = `$(eye) Watch Sass`;
        StatusBarUi.statusBarItem.color = "inherit";
        StatusBarUi.statusBarItem.command = "liveSass.command.watchMySass";
        StatusBarUi.statusBarItem.tooltip = "live compilation of SASS or SCSS to CSS";
    }

    static working(workingMsg = "Working on it..."): void {
        this.customMessage(
            workingMsg,
            "In case it takes a long time, show output window and report."
        );
    }

    static customMessage(
        text: string,
        tooltip: string,
        iconName = "pulse",
        command: string = null
    ): void {
        OutputWindow.Show(OutputLevel.Trace, `Changing status bar to: "${text}"`);

        let icon = "";
        if (iconName) icon = `$(${iconName}) `;

        StatusBarUi.statusBarItem.text = `${icon}${text}`;
        StatusBarUi.statusBarItem.tooltip = tooltip;
        StatusBarUi.statusBarItem.command = command;
    }

    // Quick status bar messages after compile success or error
    static compilationSuccess(isWatching: boolean): void {
        OutputWindow.Show(OutputLevel.Trace, "Changing status bar to: Success", [
            "Registered timeout to switch state back",
        ]);

        StatusBarUi.statusBarItem.text = `$(check) Success`;
        StatusBarUi.statusBarItem.color = "#33ff00";
        StatusBarUi.statusBarItem.command = "liveSass.command.openOutputWindow";

        setTimeout(function () {
            OutputWindow.Show(OutputLevel.Trace, "Firing timeout function to switch back");

            StatusBarUi.statusBarItem.color = "inherit";
            if (isWatching) {
                StatusBarUi.watching();
            } else {
                StatusBarUi.notWatching();
            }
        }, 4500);
    }

    static compilationError(isWatching: boolean): void {
        OutputWindow.Show(OutputLevel.Trace, "Changing status bar to: Error", null, false);

        StatusBarUi.statusBarItem.text = `$(x) Error`;
        StatusBarUi.statusBarItem.color = "#ff0033";
        StatusBarUi.statusBarItem.command = "liveSass.command.openOutputWindow";

        if (isWatching) {
            OutputWindow.Show(
                OutputLevel.Trace,
                "Registered timeout to switch state back",
                null,
                false
            );

            setTimeout(function () {
                OutputWindow.Show(OutputLevel.Trace, "Firing timeout function to switch back");

                StatusBarUi.statusBarItem.color = "inherit";
                StatusBarUi.watching();
            }, 4500);
        } else {
            StatusBarUi.notWatching();
        }

        OutputWindow.Show(OutputLevel.Trace, null);
    }

    static dispose(): void {
        StatusBarUi.statusBarItem.dispose();

        OutputWindow.Show(OutputLevel.Trace, "Disposing Live SASS status bar item");
    }
}
