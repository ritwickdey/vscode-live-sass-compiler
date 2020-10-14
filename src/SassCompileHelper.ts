import { WindowPopout, OutputWindow } from './VscodeExtensions';
import { Helper } from './helper';
const compiler = require('node-sass');

export class SassHelper {

    static get instance() {
        return new SassHelper();
    }

    static targetCssFormat(format) {
        return {
            outputStyle: format
        }
    }

    compileOne(SassPath: string, mapFileUri: string, options) {
        const 
            showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow'),
            generateMap = Helper.getConfigSettings<boolean>('generateMap'),
            data: any = {};

        Object.assign(data, options);

        data.file = SassPath;

        if (generateMap)
            data.sourceMap = mapFileUri;
        else
            data.omitSourceMapUrl = true;

        data.functions = {
            //@ error is handled suitably
            '@warn': function (info) {
                let lines: string[] = [];
                
                infoCompiler(lines, info);

                OutputWindow.Show('Warning:', lines, showOutputWindow, true);
                WindowPopout.Warn('Live Sass Compiler\n *Warning:* \n' + (lines.join('\n')))

                return compiler.NULL;
            },
            '@debug': function (info) {
                let lines: string[] = [];
                
                infoCompiler(lines, info);

                OutputWindow.Show('Debug info:', lines, showOutputWindow, true);

                return compiler.NULL;
            }
        }

        return new Promise<CompileResult>((resolve, _) => {
            compiler.render(data, function (err: CompileError, result: CompileResult) {
                let newResult = new CompileResult(result);

                if (err) {
                    newResult.friendlyError = err.formatted;
                    if (!newResult.css)
                        newResult.css = `/* Error in processing:\n\n${err.formatted} */`;
                }
                resolve(newResult);
            });
        });

        function infoCompiler(list: string[], info: any): void{
            if (typeof(info.getLength) === 'function')
                for (let i = 0; i < info.getLength(); i++)
                    infoCompiler(list, info.getValue(i))
            else
                list.push((info.getValue()).toString() as string);
        }
    }
}

class CompileResult {
    css: string;
    map: string;
    stats: CompileStats;
    friendlyError: string;

    constructor(result) {
        if (!result) return null;

        this.css = result.css.toString();
        this.stats = result.stats;
        this.map = result.map ? result.map.toString() : undefined;
    }
}

class CompileStats {
    entry: string;
    start: number;
    end: number;
    duration: number;
    includedFiles: string[];
}

class CompileError {
    formatted: string;
    message: string;
    line: number;
    column: number;
    status: number;
    file: string;
}