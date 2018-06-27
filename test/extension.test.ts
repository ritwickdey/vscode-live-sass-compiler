import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Tests', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('ritwickdey.live-sass'));
  });

  test('should activate', function() {
    this.timeout(1 * 60 * 1000);
    return vscode.extensions
      .getExtension('ritwickdey.live-sass')
      .activate()
      .then(api => {
        assert.ok(true);
      });
  });

  test('should register all live server commands', function() {
    return vscode.commands.getCommands(true).then(commands => {
      const COMMANDS = [
        'liveSass.command.watchMySass',
        'liveSass.command.donotWatchMySass',
        'liveSass.command.oneTimeCompileSass',
        'liveSass.command.openOutputWindow'
      ];
      const foundLiveServerCommands = commands.filter(value => {
        return COMMANDS.indexOf(value) >= 0 || value.startsWith('liveSass.command.');
      });
      assert.equal(foundLiveServerCommands.length, COMMANDS.length);
    });
  });
});
