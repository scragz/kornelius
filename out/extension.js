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
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    console.log('Congratulations, your extension "kornelius" is now active!');
    // Log successful activation
    console.log('KoЯnelius extension activated!');
    // Register the sidebar provider
    const sidebarProvider = new sidebarViewProvider_1.SidebarViewProvider(context.extensionUri);
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
        return await (0, generatePrompt_1.generatePrompt)(step, userInputs);
    });
    // Register save prompt command
    const savePromptCmd = vscode.commands.registerCommand('kornelius.savePrompt', async (content) => {
        return await (0, generatePrompt_1.saveGeneratedPrompt)(content);
    });
    // Register copy to clipboard command
    const copyToClipboardCmd = vscode.commands.registerCommand('kornelius.copyToClipboard', async (text) => {
        await (0, copyPrompt_1.copyToClipboard)(text);
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
    // Add all commands to subscriptions
    context.subscriptions.push(browsePromptsCmd, generatePromptCmd, savePromptCmd, copyToClipboardCmd, selectTemplateCmd, getTemplateContentCmd, focusCmd);
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