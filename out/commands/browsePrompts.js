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
exports.getTemplateContent = exports.selectPromptTemplate = exports.browsePrompts = void 0;
const vscode = __importStar(require("vscode"));
const promptManager_1 = require("../utils/promptManager");
/**
 * Command to browse available prompt templates and return them
 */
async function browsePrompts() {
    try {
        const promptManager = new promptManager_1.PromptManager();
        const templates = await promptManager.getPromptTemplates();
        if (!templates || templates.length === 0) {
            vscode.window.showInformationMessage('No prompt templates found in the prompts directory.');
            return [];
        }
        return templates;
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to browse prompt templates: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}
exports.browsePrompts = browsePrompts;
/**
 * Command to select a prompt template
 */
async function selectPromptTemplate(templates) {
    if (!templates || templates.length === 0) {
        vscode.window.showInformationMessage('No prompt templates available to select.');
        return undefined;
    }
    const items = templates.map(template => ({
        label: template.name,
        description: template.type,
        detail: template.fullPath,
        template
    }));
    const selectedItem = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a prompt template',
        matchOnDescription: true,
        matchOnDetail: true
    });
    return selectedItem?.template;
}
exports.selectPromptTemplate = selectPromptTemplate;
/**
 * Command to get the content of a template
 */
async function getTemplateContent(templatePath) {
    try {
        const promptManager = new promptManager_1.PromptManager();
        return await promptManager.getPromptContent(templatePath);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to get template content: ${error instanceof Error ? error.message : String(error)}`);
        return '';
    }
}
exports.getTemplateContent = getTemplateContent;
//# sourceMappingURL=browsePrompts.js.map