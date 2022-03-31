import * as vscode from 'vscode';

export class StatusBarUi {

    private static _statusBarItem: vscode.StatusBarItem;

    private static get statusBarItem() {
        if (!StatusBarUi._statusBarItem) {
            StatusBarUi._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
            this.statusBarItem.show();
        }

        return StatusBarUi._statusBarItem;
    }

    static init() {
        StatusBarUi.working("Starting...");
        setTimeout(function () {
            StatusBarUi.notWatching();
        }, 1000);
    }

    static watching() {
        StatusBarUi.statusBarItem.text = `$(telescope) Watching...`;
        StatusBarUi.statusBarItem.color = 'inherit';
        StatusBarUi.statusBarItem.command = 'liveSass.command.donotWatchMySass';
        StatusBarUi.statusBarItem.tooltip = 'Stop live compilation of SASS or SCSS to CSS';
    }

    static notWatching() {
        StatusBarUi.statusBarItem.text = `$(eye) Watch Sass`;
        StatusBarUi.statusBarItem.color = 'inherit';
        StatusBarUi.statusBarItem.command = 'liveSass.command.watchMySass';
        StatusBarUi.statusBarItem.tooltip = 'live compilation of SASS or SCSS to CSS';
    }

    static working(workingMsg: string = "Working on it...") {
        StatusBarUi.statusBarItem.text = `$(pulse) ${workingMsg}`;
        StatusBarUi.statusBarItem.tooltip = 'In case if it takes long time, Show output window and report.';
        StatusBarUi.statusBarItem.command = null;
    }

    // Quick status bar messages after compile success or error
    static compilationSuccess(isWatching) {
        StatusBarUi.statusBarItem.text = `$(check) Success`;
        StatusBarUi.statusBarItem.color = '#33ff00';
        StatusBarUi.statusBarItem.command = null;

        if (isWatching) {
            setTimeout(function () {
                StatusBarUi.statusBarItem.color = 'inherit';
                StatusBarUi.watching();
            }, 4500);
        }
        else {
            StatusBarUi.notWatching();
        }
    }
    static compilationError(isWatching) {
        StatusBarUi.statusBarItem.text = `$(x) Error`;
        StatusBarUi.statusBarItem.color = '#ff0033';
        StatusBarUi.statusBarItem.command = null;

        if (isWatching) {
            setTimeout(function () {
                StatusBarUi.statusBarItem.color = 'inherit';
                StatusBarUi.watching();
            }, 4500);
        }
        else {
            StatusBarUi.notWatching();
        }
    }

    static dispose() {
        StatusBarUi.statusBarItem.dispose();
    }
}