import * as vscode from 'vscode';
import * as SassCompile from 'SassLib/sass.node';
import * as fs from 'fs';
import * as path from 'path';

export class AppModel {
    statusBarItem: vscode.StatusBarItem;
    isWatching: boolean;
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
    }

    compileAllFiles() {
        let options = this.generateTargetCssFormatOptions();
        this.findAllSaasFilesAsync((sassPaths: string[]) => {
            console.log(sassPaths);

            sassPaths.forEach((sassPath) => {
                let targetPath = this.generateTargetCssFileUri(sassPath);
                this.compileOneSassFile(sassPath, targetPath, options)
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
            this.compileOneSassFile(sassPath, targetPath, options);

        }
    }

    StopWaching() {
        if (this.isWatching) {
            this.toggleStatus();
        }
    }

    private toggleStatus() {
        this.isWatching = !this.isWatching;

        if (!this.isWatching) {
            this.statusBarItem.text = `$(eye) Watch my Sass`;
            this.statusBarItem.command = 'liveSass.command.watchMySass';
            this.statusBarItem.tooltip = "live compile SASS or SCSS to CSS";
        }
        else {
            this.statusBarItem.text = `$(x) Stop Watching Sass`;
            this.statusBarItem.command = 'liveSass.command.donotWatchMySass';
            this.statusBarItem.tooltip = "Stop live compile SASS or SCSS to CSS";
        }

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

    private compileOneSassFile(SassPath: string, TargetCssFile: string, options) {
        SassCompile(SassPath, options, (result) => {
            console.log(result);

            if (result.status == 0) {
                this.writeToFileAsync(TargetCssFile, result.text);
            }
            else {
                console.log(result.formatted);
            }

        });
    }

    private writeToFileAsync(TargetFile, data) {
      
        fs.writeFile(TargetFile, data, (err) => {
            if (err) {
                return console.error("error :", err);
            }
            console.log("File saved");
        });
    }

    private generateTargetCssFileUri(filePath: string) {
        return filePath.substring(0, filePath.lastIndexOf('.')) + ".css";
    }

    private generateTargetCssFormatOptions() {
        let outputStyleFormat = vscode.workspace.getConfiguration("liveSassCompile")
            .get("generatedCss.Format") as string;

        return {
            style: SassCompile.Sass.style[outputStyleFormat],
        }

    }

    dispose() {

    }
}