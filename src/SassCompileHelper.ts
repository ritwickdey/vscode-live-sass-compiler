import * as SassCompiler from "SassLib/sass.node.js";


export class SassHelper {

    static get instance() {
        return new SassHelper();
    }

    compileOne(SassPath: string, options) {

        return new Promise<any>((resolve, reject) => {
            SassCompiler(SassPath, options, (result) => {
                if (result.status === 0) {
                    if (!result.text) {
                        result.text = "/* No CSS */";
                    }
                }
                else {
                    result.text = `/* \n Error: ${result.formatted} \n */`;
                }
                resolve(result);
            });

        });

    }

    compileMultiple(sassPaths: string[], option) {

        return new Promise<any[]>((resolve, reject) => {
            let promises: Promise<{}>[] = [];

            sassPaths.forEach(sassPath => {
                promises.push(this.compileOne(sassPath, option));
            });

            Promise.all(promises).then(results => resolve(results));

        });


    }

    static targetCssFormat(format) {
        return {
            style: SassCompiler.Sass.style[format],
        }
    }




}