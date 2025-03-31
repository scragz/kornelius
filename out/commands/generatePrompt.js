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
exports.generatePrompt = void 0;
const vscode = __importStar(require("vscode"));
const promptManager_1 = require("../utils/promptManager");
const debugLogger_1 = require("../utils/debugLogger");
/**
 * Command to generate a prompt for a specific step and mode from a template and user inputs
 */
async function generatePrompt(step, // e.g., 'request', 'spec', 'observe', 'security', 'a11y'
mode, // The current mode
userInputs) {
    try {
        // Enhanced logging with file output
        debugLogger_1.DebugLogger.log('*******************************************');
        debugLogger_1.DebugLogger.log(`generatePrompt called for step: ${step}`);
        debugLogger_1.DebugLogger.log('User inputs:', userInputs);
        // Show message to user for debugging
        // vscode.window.showInformationMessage(`Generating prompt for: ${step}`);
        // Create prompt manager
        const promptManager = new promptManager_1.PromptManager();
        // Get all templates (now includes mode)
        const templates = await promptManager.getPromptTemplates();
        // Find the template matching both the step type and the current mode
        debugLogger_1.DebugLogger.log(`Searching for template with type: ${step} and mode: ${mode}`);
        const matchingTemplate = templates.find(template => template.type === step && template.mode === mode);
        if (!matchingTemplate) {
            // Log available templates for debugging
            const availableTemplatesInfo = templates.map(t => `(${t.mode}/${t.type})`).join(', ');
            debugLogger_1.DebugLogger.error(`No template found for step: ${step} in mode: ${mode}. Available: ${availableTemplatesInfo}`);
            // Provide a more informative error message
            throw new Error(`No template found for step '${step}' in mode '${mode}'. Available templates: ${availableTemplatesInfo}`);
        }
        debugLogger_1.DebugLogger.log(`Found matching template: ${matchingTemplate.name} (mode: ${matchingTemplate.mode}) at ${matchingTemplate.fullPath}`);
        // Get the template content
        const templateContent = await promptManager.getPromptContent(matchingTemplate.fullPath);
        debugLogger_1.DebugLogger.log(`Loaded template content, length: ${templateContent.length} characters`);
        // Process the prompt with the appropriate placeholders
        return processPromptWithPlaceholders(step, templateContent, userInputs);
    }
    catch (error) {
        debugLogger_1.DebugLogger.error(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
        vscode.window.showErrorMessage(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
        // Rethrow the error to ensure the webview gets the error message
        throw error;
    }
}
exports.generatePrompt = generatePrompt;
// Basic sanitization: remove control characters except common whitespace (\n, \r, \t)
function sanitizeInput(input) {
    if (!input)
        return '';
    let result = '';
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);
        // Allow common whitespace: HT (\x09), LF (\x0A), CR (\x0D)
        if (charCode === 9 || charCode === 10 || charCode === 13) {
            result += input[i];
            continue;
        }
        // Block C0 controls (0-31) excluding the allowed whitespace above
        if (charCode >= 0 && charCode <= 31) {
            continue; // Skip this character
        }
        // Block DEL (127) and C1 controls (128-159)
        if (charCode >= 127 && charCode <= 159) {
            continue; // Skip this character
        }
        // Allow all other characters
        result += input[i];
    }
    return result;
}
/**
 * Process the template content with the appropriate placeholders based on the step
 */
function processPromptWithPlaceholders(step, templateContent, userInputs) {
    // Convert the structured user inputs to a flat record of key-value pairs
    const placeholderMap = {};
    debugLogger_1.DebugLogger.log(`Processing template for step: ${step}`);
    // Map appropriate values based on the current step, applying sanitization
    switch (step) {
        case 'request':
            placeholderMap['PROJECT_REQUEST'] = sanitizeInput(userInputs.initialIdea);
            break;
        case 'spec':
            placeholderMap['PROJECT_REQUEST'] = sanitizeInput(userInputs.projectRequest);
            placeholderMap['PROJECT_RULES'] = sanitizeInput(userInputs.projectRules);
            placeholderMap['REFERENCE_CODE'] = sanitizeInput(userInputs.referenceCode);
            break;
        case 'planner':
            placeholderMap['PROJECT_REQUEST'] = sanitizeInput(userInputs.projectRequest);
            placeholderMap['PROJECT_RULES'] = sanitizeInput(userInputs.projectRules);
            placeholderMap['TECHNICAL_SPECIFICATION'] = sanitizeInput(userInputs.technicalSpecification);
            placeholderMap['REFERENCE_CODE'] = sanitizeInput(userInputs.referenceCode);
            break;
        case 'codegen':
            placeholderMap['PROJECT_REQUEST'] = sanitizeInput(userInputs.projectRequest);
            placeholderMap['PROJECT_RULES'] = sanitizeInput(userInputs.projectRules);
            placeholderMap['TECHNICAL_SPECIFICATION'] = sanitizeInput(userInputs.technicalSpecification);
            placeholderMap['IMPLEMENTATION_PLAN'] = sanitizeInput(userInputs.implementationPlan);
            placeholderMap['EXISTING_CODE'] = sanitizeInput(userInputs.existingCode);
            break;
        case 'review':
            placeholderMap['PROJECT_REQUEST'] = sanitizeInput(userInputs.projectRequest);
            placeholderMap['PROJECT_RULES'] = sanitizeInput(userInputs.projectRules);
            placeholderMap['TECHNICAL_SPECIFICATION'] = sanitizeInput(userInputs.technicalSpecification);
            placeholderMap['IMPLEMENTATION_PLAN'] = sanitizeInput(userInputs.implementationPlan);
            placeholderMap['EXISTING_CODE'] = sanitizeInput(userInputs.existingCode);
            break;
        case 'security':
            placeholderMap['CODE_TO_AUDIT'] = sanitizeInput(userInputs.codeToAudit);
            break;
        case 'a11y':
            placeholderMap['CODE_TO_AUDIT'] = sanitizeInput(userInputs.codeToAudit);
            break;
        case 'observe':
            placeholderMap['BUG_DESCRIPTION'] = sanitizeInput(userInputs.bugDescription);
            placeholderMap['ERROR_MESSAGES'] = sanitizeInput(userInputs.errorMessages);
            placeholderMap['REPRO_STEPS'] = sanitizeInput(userInputs.reproSteps);
            placeholderMap['ENV_DETAILS'] = sanitizeInput(userInputs.envDetails);
            placeholderMap['USER_FEEDBACK'] = sanitizeInput(userInputs.userFeedback);
            placeholderMap['ADDITIONAL_EVIDENCE'] = sanitizeInput(userInputs.additionalEvidence);
            break;
        case 'orient':
            placeholderMap['ANALYSIS_SUMMARY'] = sanitizeInput(userInputs.analysisSummary);
            placeholderMap['UPDATED_CLARIFICATIONS'] = sanitizeInput(userInputs.updatedClarifications);
            break;
        case 'decide':
            placeholderMap['ANALYSIS_SUMMARY'] = sanitizeInput(userInputs.analysisSummary);
            placeholderMap['CONSTRAINTS_OR_RISKS'] = sanitizeInput(userInputs.constraintsOrRisks);
            break;
        case 'act':
            placeholderMap['CHOSEN_ACTIONS'] = sanitizeInput(userInputs.chosenActions);
            placeholderMap['IMPLEMENTATION_PLAN'] = sanitizeInput(userInputs.implementationPlan);
            placeholderMap['SUCCESS_CRITERIA'] = sanitizeInput(userInputs.successCriteria);
            break;
        default:
            debugLogger_1.DebugLogger.log(`[Warning] Unhandled step in processPromptWithPlaceholders: ${step}. Attempting direct input mapping with sanitization.`);
            Object.keys(userInputs).forEach(key => {
                const placeholderKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
                placeholderMap[placeholderKey] = sanitizeInput(userInputs[key]); // Apply sanitization here too
            });
    }
    debugLogger_1.DebugLogger.log('Sanitized placeholder map:', placeholderMap);
    // Create a new prompt manager to generate the prompt
    const promptManager = new promptManager_1.PromptManager();
    const generatedPrompt = promptManager.generatePrompt(templateContent, placeholderMap);
    debugLogger_1.DebugLogger.log(`Generated prompt for step ${step}, length: ${generatedPrompt.length} characters`);
    return generatedPrompt;
}
//# sourceMappingURL=generatePrompt.js.map