import * as path from "path";

import { runTests } from "vscode-test";

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, "..");
        const extensionTestsPath = path.resolve(__dirname, "./out/test/extension.test.js");
        const testWorkspace = path.resolve(__dirname, "./assets/");

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            version: "1.50.0",
            launchArgs: [testWorkspace],
        });
    } catch (err) {
        console.error(err);
        console.error("Failed to run tests");
        process.exit(1);
    }
}

main();
