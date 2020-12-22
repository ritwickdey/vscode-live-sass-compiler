//import { WindowPopout, OutputWindow } from "./VscodeExtensions";
import { Helper } from "./helper";
import * as compiler from "sass";

export class SassHelper {
    static get instance(): SassHelper {
        return new SassHelper();
    }

    static targetCssFormat(format: "expanded" | "compressed"): compiler.Options {
        return {
            outputStyle: format,
        };
    }

    compileOne(
        SassPath: string,
        mapFileUri: string,
        options: compiler.Options
    ): { result: compiler.Result | null; errorString: string | null } {
        const generateMap = Helper.getConfigSettings<boolean>("generateMap"),
            //showOutputWindow = Helper.getConfigSettings<boolean>("showOutputWindow"),
            data: compiler.Options = {};

        Object.assign(data, options);

        data.file = SassPath;

        if (generateMap) data.sourceMap = mapFileUri;
        else data.omitSourceMapUrl = true;

        /*
         * TODO: Chase with dart-sass (now just 'sass')
            See if warn and debug will be accessible properties --> string[] maybe
        data.functions = {
            // @error is handled suitably
            '\@warn': function (info) {
                let lines: string[] = [];

                infoCompiler(lines, info);

                OutputWindow.Show('Warning:', lines, showOutputWindow, true);
                WindowPopout.Warn('Live Sass Compiler\n *Warning:* \n' + (lines.join('\n')))

                return compiler.types.Null;
            },
            '\\@debug': function (info) {
                let lines: string[] = [];

                infoCompiler(lines, info);

                OutputWindow.Show('Debug info:', lines, showOutputWindow, true);

                return compiler.types.Null;
            }
        };//*/

        try {
            return { result: compiler.renderSync(data), errorString: null };
        } catch (err) {
            return { result: null, errorString: err.formatted };
        }

        /*function infoCompiler(list: string[], info): void {
            if (typeof info.getLength === "function")
                for (let i = 0; i < info.getLength(); i++) infoCompiler(list, info.getValue(i));
            else list.push(info.getValue().toString() as string);
        }*/
    }
}
