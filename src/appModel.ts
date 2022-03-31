'use strict';

import * as autoprefixer from 'autoprefixer';
import * as glob from 'glob';
import * as path from 'path';
import * as postcss from 'postcss';
import * as vscode from 'vscode';

import { FileHelper, IFileResolver } from './FileHelper';
import { Helper, IFormat } from './helper';

import { OutputWindow } from './OuputWindow';
import { SassHelper } from './SassCompileHelper';
import { StatusBarUi } from './StatubarUi'

export class AppModel {

    isWatching: boolean;

    constructor() {
        this.isWatching = false;
        StatusBarUi.init();
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

        const showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow');

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

        const currentFile = vscode.window.activeTextEditor.document.fileName;
        if (!this.isASassFile(currentFile, true)) return;
        OutputWindow.Show('Change Detected...', [path.basename(currentFile)]);

        if (this.isASassFile(currentFile)) {
            const formats = Helper.getConfigSettings<IFormat[]>('formats');
            const sassPath = currentFile;
            formats.forEach(format => { // Each format
                const options = this.getCssStyle(format.format);
                const cssMapPath = this.generateCssAndMapUri(sassPath, format.savePath, format.extensionName);
                this.GenerateCssAndMap(sassPath, cssMapPath.css, cssMapPath.map, options)
                    .then(() => {
                        OutputWindow.Show('Watching...', null);
                    });
            });
        }
        else { // Partial Or not            
            this.GenerateAllCssAndMap(false).then(() => {
                OutputWindow.Show('Watching...', null);
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
        const showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow');

        if (!this.isWatching) {
            StatusBarUi.notWatching();
            OutputWindow.Show('Not Watching...', null, showOutputWindow);
        }
        else {
            StatusBarUi.watching();
            OutputWindow.Show('Watching...', null, showOutputWindow);
        }
    }

    async isSassFileIncluded(sassPath: string, queryPattern = '**/[^_]*.s[a|c]ss') {
        const files = await this.getSassFiles(queryPattern);
        return files.find(e => e === sassPath) ? true : false;
    }

    isASassFile(pathUrl: string, partialSass = false): boolean {
        const filename = path.basename(pathUrl);
        return (partialSass || !filename.startsWith('_')) && (filename.endsWith('sass') || filename.endsWith('scss'))
    }

    getSassFiles(queryPattern = '**/[^_]*.s[a|c]ss'): Thenable<string[]> {
        const excludedList = Helper.getConfigSettings<string[]>('excludeList');
        const includeItems = Helper.getConfigSettings<string[] | null>('includeItems');

        const options = {
            ignore: excludedList,
            mark: true,
            cwd: AppModel.basePath
        }

        if (includeItems && includeItems.length) {
            if (includeItems.length === 1) {
                queryPattern = includeItems[0];
            }
            else {
                queryPattern = `{${includeItems.join(',')}}`;
            }
        }

        return new Promise(resolve => {
            glob(queryPattern, options, (err, files: string[]) => {
                if (err) {
                    OutputWindow.Show('Error To Search Files', err, true);
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
    private findAllSassFilesAsync(callback) {
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
        const generateMap = Helper.getConfigSettings<boolean>('generateMap');
        const autoprefixerTarget = Helper.getConfigSettings<Array<string>>('autoprefix');
        const showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow');

        return new Promise(async resolve => {
            const result = await SassHelper.instance.compileOne(SassPath, options);

            if (result.status !== 0) {
                OutputWindow.Show('Compilation Error', [result.formatted], showOutputWindow);
                StatusBarUi.compilationError(this.isWatching);

                if (!showOutputWindow) {
                    vscode.window.setStatusBarMessage(result.formatted.split('\n')[0], 4500);
                }

                resolve(true);
                return;
            }

            const promises: Promise<IFileResolver>[] = [];
            const mapFileTag = `/*# sourceMappingURL=${path.basename(targetCssUri)}.map */`

            if (autoprefixerTarget) {
                result.text = await this.autoprefix(result.text, autoprefixerTarget);
            }

            if (generateMap) {
                promises.push(FileHelper.Instance.writeToOneFile(targetCssUri, `${result.text}${mapFileTag}`));
                const map = this.GenerateMapObject(result.map, targetCssUri);
                promises.push(FileHelper.Instance.writeToOneFile(mapFileUri, JSON.stringify(map, null, 4)));
            }
            else {
                promises.push(FileHelper.Instance.writeToOneFile(targetCssUri, `${result.text}`));
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
        });
    }

    /**
     * To compile all Sass/scss files
     * @param popUpOutputWindow To control output window.
     */
    private GenerateAllCssAndMap(popUpOutputWindow) {
        const formats = Helper.getConfigSettings<IFormat[]>('formats');

        return new Promise((resolve) => {
            this.findAllSassFilesAsync((sassPaths: string[]) => {
                OutputWindow.Show('Compiling Sass/Scss Files: ', sassPaths, popUpOutputWindow);
                const promises = [];
                sassPaths.forEach((sassPath) => {
                    formats.forEach(format => { // Each format
                        const options = this.getCssStyle(format.format);
                        const cssMapUri = this.generateCssAndMapUri(sassPath, format.savePath, format.extensionName);
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
        const map = {
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

        const extensionName = _extensionName || '.css'; // Helper.getConfigSettings<string>('extensionName');

        // If SavePath is NULL, CSS uri will be same location of SASS.
        if (savePath) {
            try {
                const workspaceRoot = vscode.workspace.rootPath;
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

        const cssUri = filePath.substring(0, filePath.lastIndexOf('.')) + extensionName;
        return {
            css: cssUri,
            map: cssUri + '.map'
        };
    }

    private getCssStyle(format?: string) {
        const outputStyleFormat = format || 'expanded'; // Helper.getConfigSettings<string>('format');
        return SassHelper.targetCssFormat(outputStyleFormat);
    }

    /**
     * Autoprefixes CSS properties
     *
     * @param css String representation of CSS to transform
     * @param target What browsers to be targeted, as supported by [Browserslist](https://github.com/ai/browserslist)
     */
    private async autoprefix(css: string, browsers: Array<string>): Promise<string> {
        const showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow');
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
