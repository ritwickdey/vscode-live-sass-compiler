'use strict';
import * as vscode from 'vscode';
import * as path from 'path';

import { FileHelper, IFileResolver } from './FileHelper';
import { SassHelper } from './SassCompileHelper';
import { OutputWindow } from './OuputWindow';
import { Helper } from './helper';
import { StatusBarUi } from './StatubarUi'

export class AppModel {

    isWatching: boolean;

    constructor() {
        this.isWatching = false;
        StatusBarUi.init();
    }

    /**
     * Compile All file with watch mode.
     * @param WatchingMode WatchingMode = false for without watch mode.
     */
    compileAllFiles(WatchingMode = true) {
        if (this.isWatching) {
            vscode.window.showInformationMessage('already watching...');
            return;
        }
        StatusBarUi.working();
        this.GenerateAllCssAndMap().then(() => {
            if (!WatchingMode) {
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
                this.GenerateAllCssAndMap(false).then(() => {
                    OutputWindow.Show("Watching...", null);
                });
            }
            else {
                let sassPath = fileUri;
                let options = this.generateCssStyle();
                let cssMapPath = this.generateCssAndMapUri(sassPath);
                this.GenerateCssAndMap(sassPath, cssMapPath.css, cssMapPath.map, options)
                    .then(() => {
                        OutputWindow.Show("Watching...", null);
                    });
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

    /**
     * Find ALL Sass & Scss from workspace & It also exclude Sass/Scss from exclude list settings
     * @param callback - callback(filepaths) with be called with Uri(s) of Sass/Scss(s) (string[]).
     */
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

    /**
     * To Generate one One Css & Map file from Sass/Scss
     * @param SassPath Sass/Scss file URI (string) 
     * @param targetCssUri Target CSS file URI (string)
     * @param mapFileUri Target MAP file URI (string)
     * @param options - Object - It includes target CSS style and some more. 
     */
    private GenerateCssAndMap(SassPath: string, targetCssUri: string, mapFileUri: string, options) {
        return new Promise(resolve => {
            SassHelper.instance.compileOne(SassPath, options)
                .then((result) => {
                    if (result.status !== 0) {
                        OutputWindow.Show('Compilation Error', [result.formatted], true);
                        resolve(true);
                    }
                    else {
                        let promises: Promise<IFileResolver>[] = [];
                        let mapFileTag = `/*# sourceMappingURL= ${path.basename(targetCssUri)}.map */`
                        promises.push(FileHelper.Instance.writeToOneFile(targetCssUri, `${result.text} \n\n ${mapFileTag}`));

                        let map = this.GenerateMapObject(result.map, targetCssUri);
                        promises.push(FileHelper.Instance.writeToOneFile(mapFileUri,
                            JSON.stringify(map, null, 4)));

                        Promise.all(promises).then(fileResolvers => {
                            OutputWindow.Show("Generated :", null, false, false);
                            fileResolvers.forEach(fileResolver => {
                                if (fileResolver.Exception) {
                                    OutputWindow.Show('Error:', [
                                        fileResolver.Exception.errno.toString(),
                                        fileResolver.Exception.path,
                                        fileResolver.Exception.message
                                    ], true);
                                    console.error('error :', fileResolver);
                                }
                                else {
                                    OutputWindow.Show(null, [fileResolver.FileUri], false, false);
                                }
                            });
                            OutputWindow.Show(null, null, false, true);
                            resolve(true);
                        });
                    }
                });
        });
    }

    /**
     * To compile all Sass/scss files 
     * @param popUpOutputWindow To control output window. default value is true.
     */
    private GenerateAllCssAndMap(popUpOutputWindow = true) {
        return new Promise((resolve) => {
            let options = this.generateCssStyle();
            this.findAllSaasFilesAsync((sassPaths: string[]) => {
                OutputWindow.Show('Compiling Sass/Scss Files: ', sassPaths, popUpOutputWindow);

                let promises = [];
                sassPaths.forEach((sassPath) => {
                    let cssMapUri = this.generateCssAndMapUri(sassPath);
                    promises.push(this.GenerateCssAndMap(sassPath, cssMapUri.css, cssMapUri.map, options));
                });

                Promise.all(promises).then((e) => resolve(e));
            });
        });
    }

    /**
     * Generate Map Object
     * @param mapObject Generated Map object form Sass.js library
     * @param targetCssUri Css URI 
     */
    private GenerateMapObject(mapObject, targetCssUri: string) {
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
            //path starts with ../saas/<path> or ../< path>
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

        return map;

        //  this.writeToFileAsync(mapFileUri, JSON.stringify(map, null, 4));
    }

    private generateCssAndMapUri(filePath: string) {

        let savePath = Helper.getConfigSettings<string>('savePath');
        let extensionName = Helper.getConfigSettings<string>('extensionName');

        if (savePath !== 'null') {
            try {
                let workspaceRoot = vscode.workspace.rootPath;
                let fileUri = path.join(workspaceRoot, savePath);

                FileHelper.Instance.MakeDirIfNotAvailable(fileUri);

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

        let cssUri = filePath.substring(0, filePath.lastIndexOf('.')) + extensionName;
        return {
            css: cssUri,
            map: cssUri + '.map'
        };
    }

    private generateCssStyle() {
        let outputStyleFormat = Helper.getConfigSettings<string>('format');
        return SassHelper.targetCssFormat(outputStyleFormat);
    }

    dispose() {
        StatusBarUi.dispose();
        OutputWindow.dispose();
    }
}
