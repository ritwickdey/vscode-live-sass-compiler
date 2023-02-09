import * as fs from "fs";
import * as path from "path";
import { OutputWindow } from "./VscodeExtensions";
import { OutputLevel } from "./OutputLevel";

export interface IFileResolver {
    FileUri: string;
    Exception: NodeJS.ErrnoException | null;
}

export class FileHelper {
    static async writeToOneFile(
        targetFileUri: string,
        data: string
    ): Promise<IFileResolver> {
        OutputWindow.Show(OutputLevel.Trace, `Saving file`, [
            "Saving a file to the system",
            `Target: ${targetFileUri}`,
        ]);

        return new Promise<IFileResolver>((resolve) =>
            fs.writeFile(targetFileUri, data, "utf8", (err) =>
                resolve({
                    FileUri: targetFileUri,
                    Exception: err,
                })
            )
        );
    }

    static MakeDirIfNotAvailable(dir: string): void {
        OutputWindow.Show(
            OutputLevel.Trace,
            "Checking directory exists",
            [`Directory: ${dir}`],
            false
        );

        if (fs.existsSync(dir)) {
            OutputWindow.Show(
                OutputLevel.Trace,
                "Directory exists, no action required"
            );

            return;
        }

        if (!fs.existsSync(path.dirname(dir))) {
            OutputWindow.Show(OutputLevel.Trace, "NO PARENT DIRECTORY", [
                "Parent directory doesn't exist, we must create it",
            ]);

            this.MakeDirIfNotAvailable(path.dirname(dir));
        }

        OutputWindow.Show(
            OutputLevel.Trace,
            "Directory doesn't exist, creating it"
        );

        fs.mkdirSync(dir);
    }
}
