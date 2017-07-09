import * as vscode from 'vscode';
import * as SassCompile from 'SassLib/sass.node';
import * as fs from 'fs';
import * as path from 'path';

export class AppModel {

    compileAllFiles() {
        let options = {
            style: SassCompile.Sass.style.expanded,
        };
        this.findAllSaasFiles((sassPaths: string[]) => {
            console.log(sassPaths);

            sassPaths.forEach((sassPath) => {
                let targetPath = this.generateTargetCssFileUri(sassPath);
                this.compileOneSassFile(sassPath, targetPath, options)
            });

        });
    }

    compileOnSave() {
        let fileUri = vscode.window.activeTextEditor.document.fileName;

        if ((fileUri.endsWith('.scss') || fileUri.endsWith('.sass'))
            && !path.basename(fileUri).startsWith('_')) {

            let sassPath = fileUri;
            let options = {
                style: SassCompile.Sass.style.expanded,
            };
            let targetPath = this.generateTargetCssFileUri(sassPath);
            this.compileOneSassFile(sassPath, targetPath, options);

        }
    }

    private findAllSaasFiles(callback) {
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
            //console.log(result);

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

    dispose() {

    }
}