import * as path from "path";

import { runTests } from "vscode-test";

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, "..");
        const extensionTestsPath = __dirname;
        const testWorkspace = path.resolve(__dirname, "../../src/test/sample");

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            version: "1.74.0",
            launchArgs: [testWorkspace],
        });
    } catch (err) {
        console.error(err);
        console.error("Failed to run tests");
        process.exit(1);
    }
}

main();
