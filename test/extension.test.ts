// import * as assert from 'assert';
// import * as vscode from 'vscode';
// import { exec } from 'child_process';
// import * as path from 'path';

// suite('Extension Tests', function() {
//   this.timeout(5 * 60 * 1000);
//   suiteSetup(done => {
//     // if (!process.env.CI) return console.log('Not CI env');
//     let testRunFolder = path.join('.vscode-test', 'stable');
//     let testRunFolderAbsolute = path.join(process.cwd(), testRunFolder);
//     let darwinExecutable = path.join(
//       testRunFolderAbsolute,
//       'Visual Studio Code.app',
//       'Contents',
//       'MacOS',
//       'Electron'
//     );
//     let linuxExecutable = path.join(testRunFolderAbsolute, 'VSCode-linux-x64', 'code');
//     let executable = process.platform === 'darwin' ? darwinExecutable : linuxExecutable;

//     exec(`'${executable}' -v`, (err, result) => {
//       if (err) throw err;
//       console.log(result);
//     });
//     exec(`'${executable}' --install-extension ritwickdey.LiveServer`, (err, result) => {
//       if (err) throw err;
//       console.log(result);
//       done();
//     });
//   });

//   test('Extension should be present', () => {
//     assert.ok(vscode.extensions.getExtension('ritwickdey.live-sass'));
//   });

//   test('should activate', function() {
//     this.timeout(1 * 60 * 1000);
//     return vscode.extensions
//       .getExtension('ritwickdey.live-sass')
//       .activate()
//       .then(api => {
//         assert.ok(true);
//       });
//   });

//   test('should register all live server commands', function() {
//     return vscode.commands.getCommands(true).then(commands => {
//       const COMMANDS = [
//         'liveSass.command.watchMySass',
//         'liveSass.command.donotWatchMySass',
//         'liveSass.command.oneTimeCompileSass',
//         'liveSass.command.openOutputWindow'
//       ];
//       const foundLiveServerCommands = commands.filter(value => {
//         return COMMANDS.indexOf(value) >= 0 || value.startsWith('liveSass.command.');
//       });
//       assert.equal(foundLiveServerCommands.length, COMMANDS.length);
//     });
//   });
// });
