import { WindowPopout, OutputWindow } from "./VscodeWindow";
import { Helper } from "./helper";
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

    compileOne(SassPath: string, options) {
        const showOutputWindow = Helper.getConfigSettings<boolean>('showOutputWindow');
        let data: any = {};

        Object.assign(data, options);

        data.file = SassPath;
        data.omitSourceMapUrl = true;

        data.functions = {
            //@ error is handled suitably
            '@warn': function (info) {
                let lines: string[] = [];
                
                infoCompiler(lines, info);

                OutputWindow.Show('Warning:', lines, showOutputWindow, true);
                WindowPopout.Warn('Live Sass Compiler\n *Warning:* \n' + (lines.join("\n")))

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
                    newResult.firendlyError = err.formatted;
                    if (!newResult.css)
                        newResult.css = `/* Error in processing:\n\n${err.formatted} */`;
                }
                resolve(newResult);
            });
        });

        function infoCompiler(list: string[], info: any): void{
            if (typeof(info.getLength) === "function")
                for (let i = 0; i < info.getLength(); i++)
                    infoCompiler(list, info.getValue(i))
            else
                list.push((info.getValue()).toString() as string);
        }
    }

    compileMultiple(sassPaths: string[], option) {

        return new Promise<CompileResult[]>((resolve, _) => {
            const promises: Promise<CompileResult>[] = [];

            sassPaths.forEach(sassPath => {
                promises.push(this.compileOne(sassPath, option));
            });

            Promise.all(promises).then(results => resolve(results));

        });
    }
}

class CompileResult {
    css: string;
    map: string;
    stats: CompileStats;
    firendlyError: string;

    constructor(result) {
        if (!result) return null;

        this.css = result.css.toString();
        this.stats = result.stats;
        // TODO: Transition to node-sass map (save re-doing work that this can do while processing)
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