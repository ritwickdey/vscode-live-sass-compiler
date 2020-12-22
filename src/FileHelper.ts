import * as fs from "fs";
import * as path from "path";

export interface IFileResolver {
    FileUri: string;
    Exception: NodeJS.ErrnoException;
}

export class FileHelper {
    static writeToOneFile(targetFileUri: string, data: string): Promise<IFileResolver> {
        return new Promise<IFileResolver>((resolve) => {
            fs.writeFile(targetFileUri, data, "utf8", (err) => {
                resolve({
                    FileUri: targetFileUri,
                    Exception: err,
                });
            });
        });
    }

    static writeToMultipleFile(targetFileUris: string[], data: string[]): Promise<IFileResolver[]> {
        return new Promise<IFileResolver[]>((resolve) => {
            const promises: Promise<IFileResolver>[] = [];

            for (let i = 0; i < targetFileUris.length; i++) {
                promises.push(this.writeToOneFile(targetFileUris[i], data[i]));
            }

            Promise.all(promises).then((errList) => resolve(errList));
        });
    }

    static MakeDirIfNotAvailable(dir: string): void {
        if (fs.existsSync(dir)) return;
        if (!fs.existsSync(path.dirname(dir))) {
            this.MakeDirIfNotAvailable(path.dirname(dir));
        }
        fs.mkdirSync(dir);
    }
}
