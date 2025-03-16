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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const sidebarViewProvider_1 = require("./views/sidebarViewProvider");
const jinaReader_1 = require("./utils/jinaReader");
const browsePrompts_1 = require("./commands/browsePrompts");
const generatePrompt_1 = require("./commands/generatePrompt");
const copyPrompt_1 = require("./commands/copyPrompt");
const debugLogger_1 = require("./utils/debugLogger");
const catFiles_1 = require("./commands/catFiles");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Initialize debug logging
    debugLogger_1.DebugLogger.initialize();
    // Log successful activation
    debugLogger_1.DebugLogger.log('KoЯnelius extension activated!');
    // Create a special debug command for testing
    const debugCommand = vscode.commands.registerCommand('kornelius.debugAction', () => {
        vscode.window.showInformationMessage('Debug action invoked - This is a test message');
        // Test clipboard functionality
        const testText = "This is a test of the clipboard functionality at " + new Date().toISOString();
        vscode.env.clipboard.writeText(testText).then(() => {
            vscode.window.showInformationMessage('Test text copied to clipboard: ' + testText.substring(0, 20) + '...');
        }, (err) => {
            vscode.window.showErrorMessage('Clipboard test failed: ' + err.message);
        });
        return "Debug command executed";
    });
    // Register the sidebar provider and configure it to handle Jina messages
    const sidebarProvider = new sidebarViewProvider_1.SidebarViewProvider(context.extensionUri);
    // Setup Jina message handling for the sidebar provider
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebarViewProvider_1.SidebarViewProvider.viewType, sidebarProvider));
    // Make sure the activity bar icon is visible on activation
    vscode.commands.executeCommand('setContext', 'korneliusVisible', true);
    // Register command to focus sidebar
    const focusCmd = vscode.commands.registerCommand('kornelius.focus', () => {
        vscode.commands.executeCommand('workbench.view.extension.kornelius-activity');
    });
    // Register browse prompts command
    const browsePromptsCmd = vscode.commands.registerCommand('kornelius.browsePrompts', async () => {
        return await (0, browsePrompts_1.browsePrompts)();
    });
    // Register generate prompt command
    const generatePromptCmd = vscode.commands.registerCommand('kornelius.generatePrompt', async (step, userInputs) => {
        debugLogger_1.DebugLogger.log('Command kornelius.generatePrompt called', { step, userInputsKeys: Object.keys(userInputs || {}) });
        try {
            const result = await (0, generatePrompt_1.generatePrompt)(step, userInputs);
            debugLogger_1.DebugLogger.log('Command kornelius.generatePrompt succeeded', { resultLength: result.length });
            return result;
        }
        catch (err) {
            debugLogger_1.DebugLogger.error('Command kornelius.generatePrompt failed', err);
            throw err;
        }
    });
    // Register copy to clipboard command
    const copyToClipboardCmd = vscode.commands.registerCommand('kornelius.copyToClipboard', async (text) => {
        debugLogger_1.DebugLogger.log('Command kornelius.copyToClipboard called', { textLength: text?.length });
        try {
            await (0, copyPrompt_1.copyToClipboard)(text);
            debugLogger_1.DebugLogger.log('Text copied to clipboard successfully');
            return true;
        }
        catch (err) {
            debugLogger_1.DebugLogger.error('Failed to copy to clipboard', err);
            return false;
        }
    });
    // Register Jina.ai commands
    jinaReader_1.JinaReader.registerCommands(context);
    // Register template selection command
    const selectTemplateCmd = vscode.commands.registerCommand('kornelius.selectTemplate', async (templates) => {
        return await (0, browsePrompts_1.selectPromptTemplate)(templates);
    });
    // Register get template content command
    const getTemplateContentCmd = vscode.commands.registerCommand('kornelius.getTemplateContent', async (templatePath) => {
        return await (0, browsePrompts_1.getTemplateContent)(templatePath);
    });
    // Register cat files command
    const catFilesCmd = vscode.commands.registerCommand('kornelius.catFiles', async () => {
        return await (0, catFiles_1.catFiles)();
    });
    // Add all commands to subscriptions
    context.subscriptions.push(browsePromptsCmd, generatePromptCmd, copyToClipboardCmd, selectTemplateCmd, getTemplateContentCmd, focusCmd, debugCommand, catFilesCmd, 
    // Add a command to handle log messages from webview
    vscode.commands.registerCommand('kornelius.log', (message) => {
        debugLogger_1.DebugLogger.log(message);
    }));
    // Configure Jina integration message handling
    sidebarProvider.setJinaMessageHandler(async (message, webviewView) => {
        try {
            debugLogger_1.DebugLogger.log('Handling Jina message: ' + message.command);
            switch (message.command) {
                case 'fetchJina':
                    // Handle Jina fetch request with progress indicator
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: 'Fetching from Jina...',
                        cancellable: false
                    }, async () => {
                        try {
                            const reader = new jinaReader_1.JinaReader();
                            const markdown = await reader.fetchMarkdown(message.url);
                            // Create a new document with the content
                            const document = await vscode.workspace.openTextDocument({
                                content: markdown,
                                language: 'markdown'
                            });
                            await vscode.window.showTextDocument(document);
                            await vscode.env.clipboard.writeText(markdown);
                            // Send success result back to webview
                            webviewView.webview.postMessage({
                                command: 'fetchJinaSuccess',
                                results: [{
                                        url: message.url,
                                        error: null
                                    }]
                            });
                        }
                        catch (error) {
                            debugLogger_1.DebugLogger.error(`Error fetching from Jina: ${error instanceof Error ? error.message : String(error)}`);
                            webviewView.webview.postMessage({
                                command: 'fetchJinaError',
                                error: error instanceof Error ? error.message : String(error)
                            });
                        }
                    });
                    break;
                case 'checkJinaEnabled':
                    // Send current Jina settings to webview
                    const config = vscode.workspace.getConfiguration('kornelius');
                    webviewView.webview.postMessage({
                        command: 'jinaStatus',
                        enabled: config.get('enableJinaIntegration')
                    });
                    break;
                default:
                    debugLogger_1.DebugLogger.log(`Unknown Jina message command: ${message.command}`);
            }
        }
        catch (error) {
            debugLogger_1.DebugLogger.error(`Error handling Jina message: ${error instanceof Error ? error.message : String(error)}`);
            webviewView.webview.postMessage({
                command: 'fetchJinaError',
                error: 'Internal extension error'
            });
        }
    });
    // Add initial configuration if not already present
    const config = vscode.workspace.getConfiguration('kornelius');
    if (config.get('enableJinaIntegration') === undefined) {
        config.update('enableJinaIntegration', false, vscode.ConfigurationTarget.Global);
    }
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map