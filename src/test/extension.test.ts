import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Tests", function () {
    test("Extension should be present", () => {
        assert.ok(vscode.extensions.getExtension("glenn2223.live-sass"));
    });

    test("Extension should activate", () => {
        assert.ok(vscode.extensions.getExtension("glenn2223.live-sass").isActive);
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
        const doc = await vscode.workspace.openTextDocument(
            (await vscode.workspace.findFiles("css/**"))[0]
        );

        if (!(await doc.save())) {
            assert.ok(false, "Save failed");
        }

        setTimeout(async () => {
            const docs = await vscode.workspace.findFiles("css/**");

            assert.strictEqual(docs, [
                vscode.Uri.parse("css/sample.scss"),
                vscode.Uri.parse("css/sample.css"),
                vscode.Uri.parse("css/sample.css.map"),
            ]);
        }, 1000);
    });

    // TODO: increase tests for the following
    //      testing forceBaseDirectory
    //      testing autoprefixer
    //      more known features 
    //          (so future changes don't break something they shouldn't)
});
