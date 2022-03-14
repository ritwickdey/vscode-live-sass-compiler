'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';
import * as autoprefixer from 'autoprefixer';
import * as postcss from 'postcss';

import { FileHelper, IFileResolver } from './FileHelper';
import { SassHelper } from './SassCompileHelper';
import { OutputWindow } from './OuputWindow';
import { Helper, IFormat } from './helper';
import { StatusBarUi } from './StatubarUi'

export class AppModel {

    isWatching: boolean;

    constructor() {
        this.isWatching = false;
        let watchOnLaunch = Helper.getConfigSettings<boolean>('watchOnLaunch');

        StatusBarUi.init(watchOnLaunch);

        if (watchOnLaunch) {
            console.log("\"live-sass-compiler\" is set to watch sass files on launch");        
            this.toggleStatusUI();
        }
    }

    static get basePath(): string {
        return vscode.workspace.rootPath || path.basename(vscode.window.activeTextEditor.document.fileName);
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

        let showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow');

        this.GenerateAllCssAndMap(showOutputWindow).then(() => {
            if (!WatchingMode) {
                this.isWatching = true; // tricky to toggle status
            }
            this.toggleStatusUI();
        });
    }

    openOutputWindow() {
        OutputWindow.Show(null, null, true);
    }

    async compileOnSave() {
        if (!this.isWatching) return;

        let currentFile = vscode.window.activeTextEditor.document.fileName;
        if (!this.isASassFile(currentFile, true)) return;
        // if (!(await this.isSassFileIncluded(fileUri, '**/*.s[a|c]ss'))) return;
        OutputWindow.Show('Change Detected...', [path.basename(currentFile)]);

        if (!this.isASassFile(currentFile)) { // Partial Or not
            this.GenerateAllCssAndMap(false).then(() => {
                OutputWindow.Show('Watching...', null);
            });
        }
        else {
            let formats = Helper.getConfigSettings<IFormat[]>('formats');
            let sassPath = currentFile;
            formats.forEach(format => { // Each format
                let options = this.getCssStyle(format.format);
                let cssMapPath = this.generateCssAndMapUri(sassPath, format.savePath, format.extensionName);
                this.GenerateCssAndMap(sassPath, cssMapPath.css, cssMapPath.map, options)
                    .then(() => {
                        OutputWindow.Show('Watching...', null);
                    });
            });
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
        let showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow');

        if (!this.isWatching) {
            StatusBarUi.notWatching();
            OutputWindow.Show('Not Watching...', null, showOutputWindow);
        }
        else {
            StatusBarUi.watching();
            OutputWindow.Show('Watching...', null, showOutputWindow);
        }

    }

    async isSassFileIncluded(sassPath: string, queryPatten = '**/[^_]*.s[a|c]ss') {
        let files = await this.getSassFiles(queryPatten);
        return files.find(e => e === sassPath) ? true : false;
    }

    isASassFile(pathUrl: string, partialSass = false): boolean {
        const filename = path.basename(pathUrl);
        return  (partialSass || !filename.startsWith('_')) && (filename.endsWith('sass') || filename.endsWith('scss'))
    }

    getSassFiles(queryPatten = '**/[^_]*.s[a|c]ss'): Thenable<string[]> {
        let excludedList = Helper.getConfigSettings<string[]>('excludeList');
        let includeItems = Helper.getConfigSettings<string[] | null>('includeItems');

        let options = {
            ignore: excludedList,
            mark: true,
            cwd: AppModel.basePath
        }

        if (includeItems && includeItems.length) {
            if (includeItems.length === 1) {
                queryPatten = includeItems[0];
            }
            else {
                queryPatten = `{${includeItems.join(',')}}`;
            }
        }

        return new Promise(resolve => {
            glob(queryPatten, options, (err, files: string[]) => {
                if (err) {
                    OutputWindow.Show('Error To Seach Files', err, true);
                    resolve([]);
                    return;
                }
                const filePaths = files
                    .filter(file => this.isASassFile(file))
                    .map(file => path.join(AppModel.basePath, file));
                return resolve(filePaths || []);
            });
        })
    }

    /**
     * [Deprecated]
     * Find ALL Sass & Scss from workspace & It also exclude Sass/Scss from exclude list settings
     * @param callback - callback(filepaths) with be called with Uri(s) of Sass/Scss(s) (string[]).
     */
    private findAllSaasFilesAsync(callback) {

        this.getSassFiles().then(files => callback(files));
    }

    /**
     * To Generate one One Css & Map file from Sass/Scss
     * @param SassPath Sass/Scss file URI (string)
     * @param targetCssUri Target CSS file URI (string)
     * @param mapFileUri Target MAP file URI (string)
     * @param options - Object - It includes target CSS style and some more.
     */
    private GenerateCssAndMap(SassPath: string, targetCssUri: string, mapFileUri: string, options) {
        let generateMap = Helper.getConfigSettings<boolean>('generateMap');
        let autoprefixerTarget = Helper.getConfigSettings<Array<string>>('autoprefix');
        let showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow');

        return new Promise(resolve => {
            SassHelper.instance.compileOne(SassPath, options)
                .then(async result => {
                    if (result.status !== 0) {
                        OutputWindow.Show('Compilation Error', [result.formatted], showOutputWindow);
                        StatusBarUi.compilationError(this.isWatching);

                        if (!showOutputWindow) {
                            vscode.window.setStatusBarMessage(result.formatted.split('\n')[0], 4500);
                        }

                        resolve(true);
                    }
                    else {
                        let promises: Promise<IFileResolver>[] = [];
                        let mapFileTag = `/*# sourceMappingURL=${path.basename(targetCssUri)}.map */`

                        if (autoprefixerTarget) {
                            result.text = await this.autoprefix(result.text, autoprefixerTarget);
                        }

                        if (!generateMap) {
                            promises.push(FileHelper.Instance.writeToOneFile(targetCssUri, `${result.text}`));
                        }
                        else {
                            promises.push(FileHelper.Instance.writeToOneFile(targetCssUri, `${result.text}${mapFileTag}`));
                            let map = this.GenerateMapObject(result.map, targetCssUri);
                            promises.push(FileHelper.Instance.writeToOneFile(mapFileUri, JSON.stringify(map, null, 4)));
                        }

                        Promise.all(promises).then(fileResolvers => {
                            OutputWindow.Show('Generated :', null, false, false);
                            StatusBarUi.compilationSuccess(this.isWatching);
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
     * @param popUpOutputWindow To control output window.
     */
    private GenerateAllCssAndMap(popUpOutputWindow) {
        let formats = Helper.getConfigSettings<IFormat[]>('formats');

        return new Promise((resolve) => {
            this.findAllSaasFilesAsync((sassPaths: string[]) => {
                OutputWindow.Show('Compiling Sass/Scss Files: ', sassPaths, popUpOutputWindow);
                let promises = [];
                sassPaths.forEach((sassPath) => {
                    formats.forEach(format => { // Each format
                        let options = this.getCssStyle(format.format);
                        let cssMapUri = this.generateCssAndMapUri(sassPath, format.savePath, format.extensionName);
                        promises.push(this.GenerateCssAndMap(sassPath, cssMapUri.css, cssMapUri.map, options));
                    });
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
            // path starts with ../saas/<path> or ../< path>
            if (source.startsWith('../sass/')) {
                source = source.substring('../sass/'.length);
            }
            else if (source.startsWith('../')) {
                source = source.substring('../'.length);
            }
            if (process.platform !== 'win32') {
                source = '/' + source; // for linux, maybe for MAC too
            }

            let testpath = path.relative(
                path.dirname(targetCssUri), source);
            testpath = testpath.replace(/\\/gi, '/');
            map.sources.push(testpath);
        });

        return map;

        //  this.writeToFileAsync(mapFileUri, JSON.stringify(map, null, 4));
    }

    private generateCssAndMapUri(filePath: string, savePath: string, _extensionName?: string) {

        let extensionName = _extensionName || '.css'; // Helper.getConfigSettings<string>('extensionName');

        // If SavePath is NULL, CSS uri will be same location of SASS.
        if (savePath) {
            try {
                let workspaceRoot = vscode.workspace.rootPath;
                let generatedUri = null;

                if (savePath.startsWith('~'))
                    generatedUri = path.join(path.dirname(filePath), savePath.substring(1));
                else
                    generatedUri = path.join(workspaceRoot, savePath);

                FileHelper.Instance.MakeDirIfNotAvailable(generatedUri);

                filePath = path.join(generatedUri, path.basename(filePath));
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

    private getCssStyle(format?: string) {
        let outputStyleFormat = format || 'expanded'; // Helper.getConfigSettings<string>('format');
        return SassHelper.targetCssFormat(outputStyleFormat);
    }

    /**
     * Autoprefixes CSS properties
     *
     * @param css String representation of CSS to transform
     * @param target What browsers to be targeted, as supported by [Browserslist](https://github.com/ai/browserslist)
     */
    private async autoprefix(css: string, browsers: Array<string>): Promise<string> {
        let showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow');
        const prefixer = postcss([
            autoprefixer({
                browsers,
                grid: true
            })
        ]);

        return await prefixer
            .process(css)
            .then(res => {
                res.warnings().forEach(warn => {
                    OutputWindow.Show('Autoprefix Error', [warn.text], showOutputWindow);
                });
                return res.css;
            });
    }

    dispose() {
        StatusBarUi.dispose();
        OutputWindow.dispose();
    }
}
