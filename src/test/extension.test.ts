import * as assert from "assert";
import * as vscode from "vscode";
import * as liveSass from '../extension';

suite("Extension Tests", function () {

    test("Extension should be present", () => {
        assert.ok(vscode.extensions.getExtension("glenn2223.live-sass"));
    });
    
    test("Extension should activate", async () => {
        await vscode.extensions.getExtension("glenn2223.live-sass").activate();
        
        assert.ok(true);
    });

    test("should register all live server commands", async () => {
        const commands = await vscode.commands.getCommands(true);
        const COMMANDS = [
            "liveSass.command.watchMySass",
            "liveSass.command.donotWatchMySass",
            "liveSass.command.compileCurrentSass",
            "liveSass.command.oneTimeCompileSass",
            "liveSass.command.openOutputWindow",
            "liveSass.command.createIssue",
            "liveSass.command.debugInclusion",
            "liveSass.command.debugFileList",
        ];
        const foundLiveServerCommands = commands.filter((value) => {
            return COMMANDS.indexOf(value) >= 0 || value.startsWith("liveSass.command.");
        });
        assert.strictEqual(foundLiveServerCommands.length, COMMANDS.length);
    });
    
    test("Save should ouput default files", async () => {
        const doc = await vscode.workspace.openTextDocument('./assets/css/style.css');

        if (!await doc.save())
            assert.ok(false, 'Save failed');

        setTimeout(
            async () => {
                const docs = await vscode.workspace.findFiles('./assets/css/**');

                assert.strictEqual(
                    docs,
                    [
                        vscode.Uri.parse('./assets/css/style.scss'),
                        vscode.Uri.parse('./assets/css/style.css'),
                        vscode.Uri.parse('./assets/css/style.css.map')
                    ]
                );
            },
            1000
        );
    });
});
