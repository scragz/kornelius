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
exports.saveGeneratedPrompt = exports.generatePrompt = void 0;
const vscode = __importStar(require("vscode"));
const promptManager_1 = require("../utils/promptManager");
/**
 * Command to generate a prompt from a template and user inputs
 */
async function generatePrompt(templateContent, userInputs) {
    try {
        const promptManager = new promptManager_1.PromptManager();
        // Convert the structured user inputs to a flat record of key-value pairs
        const placeholderMap = {
            // Map each type of input to a placeholder in the template
            'request': userInputs.request || '',
            'spec': userInputs.spec || '',
            'planner': userInputs.planner || '',
            'codegen': userInputs.codegen || '',
            // Add additional mappings as needed for more complex templates
        };
        // Generate the prompt using the template and user inputs
        const generatedPrompt = promptManager.generatePrompt(templateContent, placeholderMap);
        // Return the generated prompt
        return generatedPrompt;
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
        return '';
    }
}
exports.generatePrompt = generatePrompt;
/**
 * Command to save the generated prompt to a file
 */
async function saveGeneratedPrompt(content) {
    try {
        // Get a filename for the generated prompt
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const filename = `generated-prompt-${timestamp}.md`;
        const promptManager = new promptManager_1.PromptManager();
        // Save the generated prompt to a file
        const filePath = await promptManager.saveGeneratedPrompt(content, filename);
        vscode.window.showInformationMessage(`Prompt saved to: ${filePath}`);
        return filePath;
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to save generated prompt: ${error instanceof Error ? error.message : String(error)}`);
        return undefined;
    }
}
exports.saveGeneratedPrompt = saveGeneratedPrompt;
//# sourceMappingURL=generatePrompt.js.map