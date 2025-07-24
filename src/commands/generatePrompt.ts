import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PromptManager } from '../utils/promptManager';
import { DebugLogger } from '../utils/debugLogger';

/**
 * Interface representing user input data for prompt generation
 */
export interface PromptUserInputs {
  initialIdea?: string;
  projectRequest?: string;
  projectRules?: string;
  technicalSpecification?: string;
  implementationPlan?: string;
  referenceCode?: string;
  existingCode?: string;
  includeFrontendAppendix?: boolean; // Checkbox for including frontend appendix
  codeToAudit?: string; // Added for security/a11y audit steps
  [key: string]: string | boolean | undefined; // Add index signature to allow dynamic access
}

/**
 * Command to generate a prompt for a specific step and mode from a template and user inputs
 */
export async function generatePrompt(
  step: string, // e.g., 'request', 'spec', 'observe', 'security', 'a11y'
  mode: 'create' | 'debug' | 'audit' | 'unknown', // The current mode
  userInputs: PromptUserInputs
): Promise<string> {
  try {
    // Enhanced logging with file output
    DebugLogger.log('*******************************************');
    DebugLogger.log(`generatePrompt called for step: ${step}`);
    DebugLogger.log('User inputs:', userInputs);

    // Show message to user for debugging
    // vscode.window.showInformationMessage(`Generating prompt for: ${step}`);

    // Create prompt manager
    const promptManager = new PromptManager();

    // Get all templates (now includes mode)
    const templates = await promptManager.getPromptTemplates();

    // Find the template matching both the step type and the current mode
    DebugLogger.log(`Searching for template with type: ${step} and mode: ${mode}`);
    const matchingTemplate = templates.find(template => template.type === step && template.mode === mode);

    if (!matchingTemplate) {
      // Log available templates for debugging
      const availableTemplatesInfo = templates.map(t => `(${t.mode}/${t.type})`).join(', ');
      DebugLogger.error(`No template found for step: ${step} in mode: ${mode}. Available: ${availableTemplatesInfo}`);
      // Provide a more informative error message
      throw new Error(`No template found for step '${step}' in mode '${mode}'. Available templates: ${availableTemplatesInfo}`);
    }

    DebugLogger.log(`Found matching template: ${matchingTemplate.name} (mode: ${matchingTemplate.mode}) at ${matchingTemplate.fullPath}`);

    // Get the template content
    const templateContent = await promptManager.getPromptContent(matchingTemplate.fullPath);
    DebugLogger.log(`Loaded template content, length: ${templateContent.length} characters`);

    // Process the prompt with the appropriate placeholders
    return processPromptWithPlaceholders(step, templateContent, userInputs);
  } catch (error) {
    DebugLogger.error(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
    vscode.window.showErrorMessage(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);

    // Rethrow the error to ensure the webview gets the error message
    throw error;
  }
}

// Basic sanitization: remove control characters except common whitespace (\n, \r, \t)
function sanitizeInput(input: string | undefined): string {
  if (!input) return '';
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

// Helper function to safely convert any input type to string for placeholder replacement
function sanitizeAnyInput(input: string | boolean | undefined): string {
  if (typeof input === 'boolean') {
    return input.toString();
  }
  return sanitizeInput(input);
}

/**
 * Process the template content with the appropriate placeholders based on the step
 */
function processPromptWithPlaceholders(
  step: string,
  templateContent: string,
  userInputs: PromptUserInputs
): string {
  // Convert the structured user inputs to a flat record of key-value pairs
  const placeholderMap: Record<string, string> = {};

  DebugLogger.log(`Processing template for step: ${step}`);

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

    case 'codegen': {
      placeholderMap['PROJECT_REQUEST'] = sanitizeInput(userInputs.projectRequest);
      placeholderMap['PROJECT_RULES'] = sanitizeInput(userInputs.projectRules);
      placeholderMap['TECHNICAL_SPECIFICATION'] = sanitizeInput(userInputs.technicalSpecification);
      placeholderMap['IMPLEMENTATION_PLAN'] = sanitizeInput(userInputs.implementationPlan);
      placeholderMap['EXISTING_CODE'] = sanitizeInput(userInputs.existingCode);

      // Handle appendices based on checkboxes
      let appendicesContent = '';
      if (userInputs.includeFrontendAppendix) {
        try {
          const extension = vscode.extensions.getExtension('scragz.kornelius');
          if (extension) {
            const frontendAppendixPath = path.join(extension.extensionPath, 'prompts', 'create', 'appendices', 'frontend.prompt');
            const frontendContent = fs.readFileSync(frontendAppendixPath, 'utf-8');
            appendicesContent += frontendContent + '\n\n';
          }
        } catch (error) {
          DebugLogger.error('Failed to load frontend appendix:', error);
        }
      }
      placeholderMap['APPENDICES'] = appendicesContent;
      break;
    }

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
      placeholderMap['BUG_DESCRIPTION'] = sanitizeAnyInput(userInputs.bugDescription);
      placeholderMap['ERROR_MESSAGES'] = sanitizeAnyInput(userInputs.errorMessages);
      placeholderMap['REPRO_STEPS'] = sanitizeAnyInput(userInputs.reproSteps);
      placeholderMap['ENV_DETAILS'] = sanitizeAnyInput(userInputs.envDetails);
      placeholderMap['USER_FEEDBACK'] = sanitizeAnyInput(userInputs.userFeedback);
      placeholderMap['ADDITIONAL_EVIDENCE'] = sanitizeAnyInput(userInputs.additionalEvidence);
      break;
    case 'orient':
      placeholderMap['ANALYSIS_SUMMARY'] = sanitizeAnyInput(userInputs.analysisSummary);
      placeholderMap['UPDATED_CLARIFICATIONS'] = sanitizeAnyInput(userInputs.updatedClarifications);
      break;
    case 'decide':
      placeholderMap['ANALYSIS_SUMMARY'] = sanitizeAnyInput(userInputs.analysisSummary);
      placeholderMap['CONSTRAINTS_OR_RISKS'] = sanitizeAnyInput(userInputs.constraintsOrRisks);
      break;
    case 'act':
      placeholderMap['CHOSEN_ACTIONS'] = sanitizeAnyInput(userInputs.chosenActions);
      placeholderMap['IMPLEMENTATION_PLAN'] = sanitizeAnyInput(userInputs.implementationPlan);
      placeholderMap['SUCCESS_CRITERIA'] = sanitizeAnyInput(userInputs.successCriteria);
      break;

    default:
      DebugLogger.log(`[Warning] Unhandled step in processPromptWithPlaceholders: ${step}. Attempting direct input mapping with sanitization.`);
      Object.keys(userInputs).forEach(key => {
        const placeholderKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
        placeholderMap[placeholderKey] = sanitizeAnyInput(userInputs[key]); // Apply sanitization here too
      });
  }

  DebugLogger.log('Sanitized placeholder map:', placeholderMap);

  // Create a new prompt manager to generate the prompt
  const promptManager = new PromptManager();
  const generatedPrompt = promptManager.generatePrompt(templateContent, placeholderMap);

  DebugLogger.log(`Generated prompt for step ${step}, length: ${generatedPrompt.length} characters`);

  return generatedPrompt;
}
