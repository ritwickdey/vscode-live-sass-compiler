import { Memento, extensions, window, commands, Uri } from "vscode";
import { OutputLevel, OutputWindow } from "../VscodeExtensions";

const SETUP_STRING = "liveSassCompiler.setup.version";

export async function checkNewAnnouncement(memento: Memento): Promise<void> {
    OutputWindow.Show(OutputLevel.Trace, "Checking for an unread announcement");

    const packageJSON = extensions.getExtension("glenn2223.live-sass").packageJSON;
    const announment = packageJSON.announcement;

    if (!announment && Object.keys(announment).length === 0) {
        OutputWindow.Show(OutputLevel.Trace, "No announcement has been found");

        return;
    }

    const stateVersion = (await memento.get(SETUP_STRING)) || "0.0.0";
    const installedVersion = packageJSON.version;

    if (stateVersion !== installedVersion && installedVersion === announment.onVersion) {
        OutputWindow.Show(OutputLevel.Trace, "New announcement found", [
            "Showing new announcement",
            "Announcement version updated to current release",
        ]);

        await memento.update(SETUP_STRING, installedVersion);
        const showMore = "Show Details",
            choice = await window.showInformationMessage(announment.message, showMore);

        if (choice === showMore) {
            const url = announment.url || "https://github.com/glenn2223/vscode-live-sass-compiler/";
            commands.executeCommand("vscode.open", Uri.parse(url));
        }
    } else {
        OutputWindow.Show(OutputLevel.Trace, "Announcement has already been shown");
    }
}
