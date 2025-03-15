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
const debugLogger_1 = require("../utils/debugLogger");
/**
 * Command to generate a prompt for a specific step from a template and user inputs
 */
async function generatePrompt(step, userInputs) {
    try {
        // Enhanced logging with file output
        debugLogger_1.DebugLogger.log('*******************************************');
        debugLogger_1.DebugLogger.log(`generatePrompt called for step: ${step}`);
        debugLogger_1.DebugLogger.log('User inputs:', userInputs);
        // Show message to user for debugging
        vscode.window.showInformationMessage(`Generating prompt for: ${step}`);
        // Create prompt manager
        const promptManager = new promptManager_1.PromptManager();
        // Get all templates
        debugLogger_1.DebugLogger.log(`Looking for templates in: ${promptManager['_promptsDirectory']}`);
        const templates = await promptManager.getPromptTemplates();
        debugLogger_1.DebugLogger.log(`Found ${templates.length} templates:`, templates.map(t => t.name).join(', '));
        // Find the template that matches the current step
        const matchingTemplate = templates.find(template => template.type === step);
        if (!matchingTemplate) {
            debugLogger_1.DebugLogger.error(`No template found for step: ${step}. Available: ${templates.map(t => t.name).join(', ')}`);
            throw new Error(`No template found for step: ${step}. Available templates: ${templates.map(t => t.name).join(', ')}`);
        }
        debugLogger_1.DebugLogger.log(`Found matching template: ${matchingTemplate.name} at ${matchingTemplate.fullPath}`);
        // Get the template content
        const templateContent = await promptManager.getPromptContent(matchingTemplate.fullPath);
        debugLogger_1.DebugLogger.log(`Loaded template content, length: ${templateContent.length} characters`);
        // Convert the structured user inputs to a flat record of key-value pairs
        const placeholderMap = {};
        // Map appropriate values based on the current step
        switch (step) {
            case 'request':
                // For request step, just use the IDEA placeholder
                placeholderMap['IDEA'] = userInputs.request || '';
                break;
            case 'spec':
                // For spec step, use previous step's input plus any spec-specific input
                placeholderMap['insert_request_here'] = userInputs.request || '';
                placeholderMap['insert_rules_here'] = ''; // This would come from a rules file
                placeholderMap['insert_template_here'] = ''; // This would come from a template
                break;
            case 'planner':
                // For planner step, use request and spec inputs
                placeholderMap['PROJECT_REQUEST'] = userInputs.request || '';
                placeholderMap['PROJECT_RULES'] = ''; // Optional
                placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.spec || '';
                placeholderMap['STARTER_TEMPLATE'] = ''; // Optional
                break;
            case 'codegen':
                // For codegen step, use request, spec and planner inputs
                placeholderMap['PROJECT_REQUEST'] = userInputs.request || '';
                placeholderMap['PROJECT_RULES'] = ''; // Optional
                placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.spec || '';
                placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.planner || '';
                placeholderMap['YOUR_CODE'] = ''; // This would be the user's existing code
                break;
            case 'review':
                // For review step, use all previous inputs
                placeholderMap['PROJECT_REQUEST'] = userInputs.request || '';
                placeholderMap['PROJECT_RULES'] = ''; // Optional
                placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.spec || '';
                placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.planner || '';
                placeholderMap['EXISTING_CODE'] = userInputs.codegen || '';
                break;
            default:
                // For unknown steps, use whatever inputs are provided
                Object.keys(userInputs).forEach(key => {
                    placeholderMap[key.toUpperCase()] = userInputs[key] || '';
                });
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