'use strict';
import * as vscode from 'vscode';
import * as SassCompile from "SassLib/sass.node.js";
import * as fs from 'fs';
import * as path from 'path';

import { OutputWindow } from './OuputWindow';
import { Helper } from './helper';
import {StatusBarUi} from './StatubarUi'

export class AppModel {

    isWatching: boolean;

    constructor() {
        this.isWatching = false;
        StatusBarUi.init();
    }

    //Compile All file with watch mode. Set @'withWatchingMode' = false for without watch mode.
    compileAllFiles(withWatchingMode = true) {
        if (this.isWatching) {
            vscode.window.showInformationMessage('already watching...');
            return;
        }
        StatusBarUi.working();
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

            OutputWindow.Show('Change Detected...', [path.basename(fileUri)]);

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
            StatusBarUi.notWatching();
             OutputWindow.Show('Not Watching...', null, true);
        }
        else {
            StatusBarUi.watching();
            OutputWindow.Show('Watching...', null, true);
        }

    }

    private findAllSaasFilesAsync(callback) {
        let filePaths: string[] = [];
        let excludedList = Helper.getConfigSettings<string[]>('excludeFolders');
        
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
                OutputWindow.Show('Compilation Error', [result.formatted], true);
                console.log(result.formatted);
            }

        });
    }

    private compileAllSassFileAsync(callback?, logMsgWindowFocusUI = true) {

        let options = this.generateTargetCssFormatOptions();
        this.findAllSaasFilesAsync((sassPaths: string[]) => {
            //  console.log(sassPaths);
            OutputWindow.Show('Compiling Sass/Scss Files: ', sassPaths, logMsgWindowFocusUI);

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
                OutputWindow.Show('Error:', [
                    err.errno.toString(),
                    err.path,
                    err.message
                ], true);
                return console.error('error :', err);
            }

            OutputWindow.Show('Generated: ', [TargetFile]);
            console.log('File saved');
        });
    }

    private generateTargetCssFileUri(filePath: string) {

        let saveLocation = Helper.getConfigSettings<string>('savePath');

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

                OutputWindow.Show('Error:', [
                    err.errno.toString(),
                    err.path,
                    err.message
                ], true);

                throw Error('Something Went Wrong.');
            }

        }

        let extensionName = Helper.getConfigSettings<string>('extensionName');

        return filePath.substring(0, filePath.lastIndexOf('.')) + extensionName;
    }

    private mkdirRecursiveSync(dir) {

        if (!fs.existsSync(path.dirname(dir))) {
            this.mkdirRecursiveSync(path.dirname(dir));
        }
        fs.mkdirSync(dir);
    }

    private generateTargetCssFormatOptions() {
        let outputStyleFormat = Helper.getConfigSettings<string>('format');

        return {
            style: SassCompile.Sass.style[outputStyleFormat],
        }

    }
    
    dispose() {
        StatusBarUi.dispose();
        OutputWindow.dispose();
    }
}
