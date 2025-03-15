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
 * Command to generate a prompt for a specific step from a template and user inputs
 */
async function generatePrompt(step, userInputs) {
    try {
        const promptManager = new promptManager_1.PromptManager();
        // Get all templates
        const templates = await promptManager.getPromptTemplates();
        // Find the template that matches the current step
        const matchingTemplate = templates.find(template => template.type === step);
        if (!matchingTemplate) {
            throw new Error(`No template found for step: ${step}`);
        }
        // Get the template content
        const templateContent = await promptManager.getPromptContent(matchingTemplate.fullPath);
        // Convert the structured user inputs to a flat record of key-value pairs
        const placeholderMap = {};
        // Map appropriate values based on the current step
        switch (step) {
            case 'request':
                placeholderMap['IDEA'] = userInputs.request || '';
                break;
            case 'spec':
                placeholderMap['insert_request_here'] = userInputs.request || '';
                placeholderMap['insert_rules_here'] = ''; // This would come from a rules file
                placeholderMap['insert_template_here'] = ''; // This would come from a template
                break;
            case 'planner':
                placeholderMap['PROJECT_REQUEST'] = userInputs.request || '';
                placeholderMap['PROJECT_RULES'] = ''; // Optional
                placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.spec || '';
                placeholderMap['STARTER_TEMPLATE'] = ''; // Optional
                break;
            case 'codegen':
                placeholderMap['PROJECT_REQUEST'] = userInputs.request || '';
                placeholderMap['PROJECT_RULES'] = ''; // Optional
                placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.spec || '';
                placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.planner || '';
                placeholderMap['YOUR_CODE'] = ''; // This would be the user's existing code
                break;
            case 'review':
                placeholderMap['PROJECT_REQUEST'] = userInputs.request || '';
                placeholderMap['PROJECT_RULES'] = ''; // Optional
                placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.spec || '';
                placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.planner || '';
                placeholderMap['EXISTING_CODE'] = userInputs.codegen || '';
                break;
            default:
                // For unknown steps, just map all inputs
                placeholderMap['request'] = userInputs.request || '';
                placeholderMap['spec'] = userInputs.spec || '';
                placeholderMap['planner'] = userInputs.planner || '';
                placeholderMap['codegen'] = userInputs.codegen || '';
                placeholderMap['review'] = userInputs.review || '';
        }
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