import { Memento, extensions, window, commands, Uri } from 'vscode';

const SETUP_STRING = 'liveSassCompiler.setup.version';

export async function checkNewAnnouncement(memento: Memento) {

    const packageJSON = extensions.getExtension('glenn2223.live-sass').packageJSON;
    const announment = packageJSON.announcement;

    if (!announment && Object.keys(announment).length === 0) return;

    const stateVersion = await memento.get(SETUP_STRING) || '0.0.0';
    const installedVersion = packageJSON.version;

    if (stateVersion !== installedVersion && installedVersion === announment.onVersion) {
        await memento.update(SETUP_STRING, installedVersion);
        const showMore = 'Show Details';
        const choice = await window.showInformationMessage(announment.message, showMore);
        if (choice === showMore) {
            const url = announment.url || 'https://github.com/glenn2223/vscode-live-sass-compiler/';
            commands.executeCommand('vscode.open', Uri.parse(url))
        }

    }

}