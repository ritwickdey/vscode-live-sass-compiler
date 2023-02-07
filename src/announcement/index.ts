import { Memento, extensions, window, commands, Uri } from "vscode";
import { Helper } from "../helper";
import { OutputWindow } from "../VscodeExtensions";
import { OutputLevel } from "../OutputLevel";

const SETUP_STRING = "liveSassCompiler.setup.version";

export async function checkNewAnnouncement(memento: Memento): Promise<void> {
    OutputWindow.Show(OutputLevel.Trace, "Call to check for new announcement");

    const showAnnoucement = Helper.getConfigSettings<boolean>("showAnnouncements");

    OutputWindow.Show(OutputLevel.Trace, "Checking `showAnnouncements` setting");

    if (showAnnoucement !== true) {
        OutputWindow.Show(OutputLevel.Trace, "`showAnnouncements` not true, exiting announcemnet check");
        return;
    }

    OutputWindow.Show(OutputLevel.Trace, "`showAnnouncements` is true so checking for an unread announcement");

    const packageJSON = extensions.getExtension("glenn2223.live-sass")!.packageJSON;
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
            const url = announment.url || "https://github.com/glenn2223/vscode-live-sass-compiler/releases";
            commands.executeCommand("vscode.open", Uri.parse(url));
        }
    } else {
        OutputWindow.Show(OutputLevel.Trace, "Announcement has already been shown");
    }
}
