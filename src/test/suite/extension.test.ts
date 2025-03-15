import * as assert from 'assert';
import * as vscode from 'vscode';
import { PromptManager } from '../../utils/promptManager';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Starting test suite');

  test('Extension should be present', () => {
    assert.notStrictEqual(
      vscode.extensions.getExtension('kornelius.kornelius'),
      undefined
    );
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('kornelius.kornelius');
    if (!extension) {
      assert.fail('Extension not found');
    }

    try {
      await extension.activate();
      assert.strictEqual(extension.isActive, true);
    } catch (error) {
      assert.fail(`Failed to activate extension: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test('PromptManager should be instantiable', () => {
    assert.doesNotThrow(() => {
      new PromptManager();
    });
  });

  test('Command kornelius.helloWorld should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('kornelius.helloWorld'));
  });

  test('Command kornelius.browsePrompts should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('kornelius.browsePrompts'));
  });

  test('Command kornelius.generatePrompt should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('kornelius.generatePrompt'));
  });

  test('Command kornelius.savePrompt should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('kornelius.savePrompt'));
  });

  test('Command kornelius.copyToClipboard should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('kornelius.copyToClipboard'));
  });
});
