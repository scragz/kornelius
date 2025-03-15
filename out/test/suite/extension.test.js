"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const promptManager_1 = require("../../utils/promptManager");
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Starting test suite');
    test('Extension should be present', () => {
        assert.notStrictEqual(vscode.extensions.getExtension('scragz.kornelius'), undefined);
    });
    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('scragz.kornelius');
        if (!extension) {
            assert.fail('Extension not found');
        }
        try {
            await extension.activate();
            assert.strictEqual(extension.isActive, true);
        }
        catch (error) {
            assert.fail(`Failed to activate extension: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    test('PromptManager should be instantiable', () => {
        assert.doesNotThrow(() => {
            new promptManager_1.PromptManager();
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
//# sourceMappingURL=extension.test.js.map