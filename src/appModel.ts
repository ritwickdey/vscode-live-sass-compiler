import * as vscode from 'vscode';
import * as SassCompile from 'SassLib/sass.node';
import * as fs from 'fs';
import * as path from 'path';

export class AppModel {

    statusBarItem: vscode.StatusBarItem;
    isWatching: boolean;
    outputWindow: vscode.OutputChannel;

    constructor() {
        this.Init()
    }

    Init() {
        this.isWatching = false;
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
            this.statusBarItem.text = `$(eye) Watch my Sass`;
            this.statusBarItem.command = 'liveSass.command.watchMySass';
            this.statusBarItem.tooltip = "live complile SASS or SCSS to CSS";
            this.statusBarItem.show();
        }
        if (!this.outputWindow) {
            this.outputWindow = vscode.window.createOutputChannel("Live Sass Compile - Output Window");
        }
    }

    compileAllFiles() {
        if (this.isWatching) {
            vscode.window.showInformationMessage("already watching...");
            return;
        }
        this.ShowWorkingStage();
        let options = this.generateTargetCssFormatOptions();
        this.findAllSaasFilesAsync((sassPaths: string[]) => {
            console.log(sassPaths);
            this.showMsgToOutputWindow("Found Sass/Scss Files: ", sassPaths, true);

            sassPaths.forEach((sassPath) => {
                let targetPath = this.generateTargetCssFileUri(sassPath);
                this.compileOneSassFileAsync(sassPath, targetPath, options)
            });

            this.toggleStatus();

        });
    }

    compileOnSave() {
        if (!this.isWatching) {
            return;
        }

        let fileUri = vscode.window.activeTextEditor.document.fileName;

        if ((fileUri.endsWith('.scss') || fileUri.endsWith('.sass'))
            && !path.basename(fileUri).startsWith('_')) {

            let sassPath = fileUri;
            let options = this.generateTargetCssFormatOptions();
            let targetPath = this.generateTargetCssFileUri(sassPath);
            this.compileOneSassFileAsync(sassPath, targetPath, options);

            this.showMsgToOutputWindow("Compiling...", [sassPath]);
        }
    }

    StopWaching() {
        if (this.isWatching) {
            this.toggleStatus();
        }
        else {
            vscode.window.showInformationMessage("not watching...");
        }
    }

    private toggleStatus() {
        this.isWatching = !this.isWatching;

        if (!this.isWatching) {
            this.statusBarItem.text = `$(eye) Watch my Sass`;
            this.statusBarItem.command = 'liveSass.command.watchMySass';
            this.statusBarItem.tooltip = "live compile SASS or SCSS to CSS";
            this.showMsgToOutputWindow("Stop Watching...", [], true);
        }
        else {
            this.statusBarItem.text = `$(x) Stop Watching Sass`;
            this.statusBarItem.command = 'liveSass.command.donotWatchMySass';
            this.statusBarItem.tooltip = "Stop live compile SASS or SCSS to CSS";
            this.showMsgToOutputWindow("Watching...", [], true);
        }

    }

    private ShowWorkingStage() {
        this.statusBarItem.text = "$(pulse) Working on it...";
        this.statusBarItem.tooltip = "In case if it takes long time, Show output window and report.";
        this.statusBarItem.command = null;
    }

    private findAllSaasFilesAsync(callback) {
        let FilePaths: string[] = [];
        vscode.workspace.findFiles("**/*.s[a|c]ss", "**/node_modules/**")
            .then((files) => {
                files.forEach((file) => {
                    if (!path.basename(file.fsPath).startsWith("_")) {
                        FilePaths.push(file.fsPath);
                    }
                });
                return callback(FilePaths);
            });
    }

    private compileOneSassFileAsync(SassPath: string, TargetCssFile: string, options) {
        SassCompile(SassPath, options, (result) => {
            // console.log(result);

            if (result.status == 0) {
                this.writeToFileAsync(TargetCssFile, result.text || "/*No CSS*/");
            }
            else {
                this.showMsgToOutputWindow("Compilation Error", [result.formatted], true);
                console.log(result.formatted);
            }

        });
    }

    private writeToFileAsync(TargetFile, data) {

        fs.writeFile(TargetFile, data, (err) => {
            if (err) {
                this.showMsgToOutputWindow("Error:", [
                    err.errno.toString(),
                    err.path,
                    err.message
                ], true);
                return console.error("error :", err);
            }

            this.showMsgToOutputWindow("CSS Generated: ", [TargetFile]);
            console.log("File saved");
        });
    }

    private generateTargetCssFileUri(filePath: string) {

        let saveLocation = vscode.workspace.getConfiguration('liveSassCompile')
            .get('settings.savePath') as string;

        if (saveLocation != "null") {

            try {
                let workspaceRoot = vscode.workspace.rootPath;
                let fileUri = path.join(workspaceRoot, saveLocation);

                if (!fs.existsSync(fileUri)) {
                    this.mkdirRecursiveSync(fileUri);
                }

                filePath = path.join(fileUri, path.basename(filePath));
            }
            catch (err) {
                console.log(err);

                this.showMsgToOutputWindow("Error:", [
                    err.errno.toString(),
                    err.path,
                    err.message
                ], true);

                throw Error("Something Went Wrong.");
            }

        }

        return filePath.substring(0, filePath.lastIndexOf('.')) + ".css";
    }

    private mkdirRecursiveSync(dir) {
        if (!fs.existsSync(path.dirname(dir))) {
            this.mkdirRecursiveSync(path.dirname(dir));
        }
        fs.mkdirSync(dir);
    }

    private generateTargetCssFormatOptions() {
        let outputStyleFormat = vscode.workspace.getConfiguration("liveSassCompile")
            .get("settings.format") as string;

        return {
            style: SassCompile.Sass.style[outputStyleFormat],
        }

    }

    private showMsgToOutputWindow(headMsg: string, bodyMsgs: string[], willShowToUI: boolean = false) {
        this.outputWindow.appendLine(headMsg);

        bodyMsgs.forEach(msg => {
            this.outputWindow.appendLine(msg);
        });

        if (willShowToUI) {
            this.outputWindow.show(true);
        }
        this.outputWindow.appendLine("--------------------")
    }

    dispose() {
        this.statusBarItem.dispose();
        this.outputWindow.dispose();
    }
}