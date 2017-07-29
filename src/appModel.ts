'use strict';
import * as vscode from 'vscode';
import * as SassCompile from "SassLib/sass.node.js";
import * as fs from 'fs';
import * as path from 'path';

export class AppModel {

    statusBarItem: vscode.StatusBarItem;
    isWatching: boolean;
    outputWindow: vscode.OutputChannel;

    get configSettings() {
        return vscode.workspace.getConfiguration('liveSassCompile.settings');
    }

    constructor() {
        this.isWatching = false;
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
            this.notWatchingUI();
            this.statusBarItem.show();
        }
        if (!this.outputWindow) {
            this.outputWindow = vscode.window.createOutputChannel('Live Sass Compile - Output Window');
        }
    }


    compileAllFiles(withWatchingMode = true) {
        if (this.isWatching) {
            vscode.window.showInformationMessage('already watching...');
            return;
        }
        this.showWorkingStageUI();
        let options = this.generateTargetCssFormatOptions();
        this.compileAllSassFileAsync(() => {
            if (!withWatchingMode) {
                this.isWatching = true; //tricky to toggle status
            }
            this.toggleStatusUI();
        });
    }

    compileOnSave() {
        if (!this.isWatching) {
            return;
        }

        let fileUri = vscode.window.activeTextEditor.document.fileName;

        if (fileUri.endsWith('.scss') || fileUri.endsWith('.sass')) {

            this.showMsgToOutputWindow('Change Detected...', [path.basename(fileUri)]);

            if (path.basename(fileUri).startsWith('_')) {
                this.compileAllSassFileAsync(null, false);
            }
            else {
                let sassPath = fileUri;
                let options = this.generateTargetCssFormatOptions();
                let targetPath = this.generateTargetCssFileUri(sassPath);
                this.compileOneSassFileAsync(sassPath, targetPath, options);
            }
        }
    }

    StopWaching() {
        if (this.isWatching) {
            this.toggleStatusUI();
        }
        else {
            vscode.window.showInformationMessage('not watching...');
        }
    }

    private toggleStatusUI() {
        this.isWatching = !this.isWatching;

        if (!this.isWatching) {
            this.notWatchingUI();
        }
        else {
            this.watchingUI();
        }

    }

    private watchingUI() {
        this.statusBarItem.text = `$(x) Watching...`;
        this.statusBarItem.command = 'liveSass.command.donotWatchMySass';
        this.statusBarItem.tooltip = 'Stop live compilation of SASS or SCSS to CSS';
        this.showMsgToOutputWindow('Watching...', [], true);
    }

    private notWatchingUI() {
        this.statusBarItem.text = `$(eye) Watch Sass`;
        this.statusBarItem.command = 'liveSass.command.watchMySass';
        this.statusBarItem.tooltip = 'live compilation of SASS or SCSS to CSS';
        this.showMsgToOutputWindow('Not Watching...', [], true);
    }

    private showWorkingStageUI() {
        this.statusBarItem.text = '$(pulse) Working...';
        this.statusBarItem.tooltip = 'In case if it takes long time, Show output window and report.';
        this.statusBarItem.command = null;
    }

    private findAllSaasFilesAsync(callback) {
        let filePaths: string[] = [];
        let excludedList = this.configSettings
            .get('excludeFolders') as String[];
        let excludeByGlobString = `{${excludedList.join(',')}}`;

        vscode.workspace.findFiles('**/[^_]*.s[a|c]ss', excludeByGlobString)
            .then((files) => {
                files.forEach((file) => {
                    filePaths.push(file.fsPath);
                });
                return callback(filePaths);
            });
    }

    private compileOneSassFileAsync(SassPath: string, targetCssUri: string, options) {
        SassCompile(SassPath, options, (result) => {
            //console.log(result);
            if (result.status === 0) {
                this.writeToFileAsync(targetCssUri, `${result.text || '/*No CSS*/'} \n\n\n  /*# sourceMappingURL=${path.basename(targetCssUri)}.map */`);
                this.GenerateOneMapFile(result.map, targetCssUri);
            }
            else {
                this.showMsgToOutputWindow('Compilation Error', [result.formatted], true);
                console.log(result.formatted);
            }

        });
    }

    private compileAllSassFileAsync(callback?, logMsgWindowFocusUI = true) {

        let options = this.generateTargetCssFormatOptions();
        this.findAllSaasFilesAsync((sassPaths: string[]) => {
            //  console.log(sassPaths);
            this.showMsgToOutputWindow('Compiling Sass/Scss Files: ', sassPaths, logMsgWindowFocusUI);

            sassPaths.forEach((sassPath) => {
                let targetPath = this.generateTargetCssFileUri(sassPath);
                this.compileOneSassFileAsync(sassPath, targetPath, options);
            });

            if (callback) {
                callback();
            }
        });
    }

    private GenerateOneMapFile(mapObject, targetCssUri: string) {
        let mapFileUri = targetCssUri + '.map';
        console.log(mapObject);
        let map = {
            'version': 3,
            'mappings': '',
            'sources': [],
            'names': [],
            'file': ''
        }
        map.mappings = mapObject.mappings;
        map.file = path.basename(targetCssUri);
        mapObject.sources.forEach((source: string) => {
            //path starts with ../saas/<abs path> or ../<abs path>
            if (source.startsWith('../sass/')) {
                source = source.substring('../sass/'.length);
            }
            else if (source.startsWith('../')) {
                source = source.substring('../'.length);
            }
            if (process.platform != 'win32') {
                source = '/' + source; //for linux, maybe for MAC too
            }

            let testpath = path.relative(
                path.dirname(targetCssUri), source);
            testpath = testpath.replace(/\\/gi, '/');
            map.sources.push(testpath);
        });



        this.writeToFileAsync(mapFileUri, JSON.stringify(map, null, 4));
    }

    private writeToFileAsync(TargetFile, data) {

        fs.writeFile(TargetFile, data, 'utf8', (err) => {
            if (err) {
                this.showMsgToOutputWindow('Error:', [
                    err.errno.toString(),
                    err.path,
                    err.message
                ], true);
                return console.error('error :', err);
            }

            this.showMsgToOutputWindow('Generated: ', [TargetFile]);
            console.log('File saved');
        });
    }

    private generateTargetCssFileUri(filePath: string) {

        let saveLocation = this.configSettings.get('savePath') as string;

        if (saveLocation !== 'null') {

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

                this.showMsgToOutputWindow('Error:', [
                    err.errno.toString(),
                    err.path,
                    err.message
                ], true);

                throw Error('Something Went Wrong.');
            }

        }

        let extensionName = this.configSettings.get('extensionName') as string;

        return filePath.substring(0, filePath.lastIndexOf('.')) + extensionName;
    }

    private mkdirRecursiveSync(dir) {

        if (!fs.existsSync(path.dirname(dir))) {
            this.mkdirRecursiveSync(path.dirname(dir));
        }
        fs.mkdirSync(dir);
    }

    private generateTargetCssFormatOptions() {
        let outputStyleFormat = this.configSettings.get('format') as string;

        return {
            style: SassCompile.Sass.style[outputStyleFormat],
        }

    }

    private showMsgToOutputWindow(headMsg: string, bodyMsgs: string[], popUpToUI: boolean = false) {
        
        if(!this.outputWindow) return;

        this.outputWindow.appendLine(headMsg);

        if (bodyMsgs) {
            bodyMsgs.forEach(msg => {
                this.outputWindow.appendLine(msg);
            });
        }

        if (popUpToUI) {
            this.outputWindow.show(true);
        }
        this.outputWindow.appendLine('--------------------')
    }

    dispose() {
        this.statusBarItem.dispose();
        this.outputWindow.dispose();
    }
}
