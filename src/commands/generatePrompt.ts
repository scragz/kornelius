import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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
  codeToAudit?: string; // Added for security/a11y audit steps
  [key: string]: string | undefined; // Add index signature to allow dynamic access
}

/**
 * Command to generate a prompt for a specific step from a template and user inputs
 */
export async function generatePrompt(
  step: string,
  userInputs: PromptUserInputs
): Promise<string> {
  try {
    // Enhanced logging with file output
    DebugLogger.log('*******************************************');
    DebugLogger.log(`generatePrompt called for step: ${step}`);
    DebugLogger.log('User inputs:', userInputs);

    // Show message to user for debugging
    // vscode.window.showInformationMessage(`Generating prompt for: ${step}`);

    // Create prompt manager - no need to calculate paths manually now
    const promptManager = new PromptManager();

    // Get all templates
    const templates = await promptManager.getPromptTemplates();
    const matchingTemplate = templates.find(template => template.type === step);

    if (!matchingTemplate) {
      // Try a more direct approach to find the prompt file
      const promptsDirectory = path.join(vscode.extensions.getExtension('kornelius')?.extensionPath || '', 'prompts');
      const directPromptPath = path.join(promptsDirectory, `${step}.prompt`);
      DebugLogger.log(`No template found for step: ${step}. Trying direct path: ${directPromptPath}`);

      if (fs.existsSync(directPromptPath)) {
        DebugLogger.log(`Found prompt file directly at: ${directPromptPath}`);
        // Create an ad-hoc template
        const templateContent = fs.readFileSync(directPromptPath, 'utf-8');
        DebugLogger.log(`Loaded template content directly, length: ${templateContent.length} characters`);

        // Generate the prompt using our placeholder values
        return processPromptWithPlaceholders(step, templateContent, userInputs);
      } else {
        DebugLogger.error(`No template found for step: ${step}. Available: ${templates.map(t => t.name).join(', ')}`);
        throw new Error(`No template found for step: ${step}. Available templates: ${templates.map(t => t.name).join(', ')}`);
      }
    }

    DebugLogger.log(`Found matching template: ${matchingTemplate.name} at ${matchingTemplate.fullPath}`);

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

  // Map appropriate values based on the current step
  switch (step) {
    case 'request':
      // For request step, use initialIdea
      placeholderMap['PROJECT_REQUEST'] = userInputs.initialIdea || '';
      break;

    case 'spec':
      // For spec step, use projectRequest, projectRules, referenceCode
      placeholderMap['PROJECT_REQUEST'] = userInputs.projectRequest || '';
      placeholderMap['PROJECT_RULES'] = userInputs.projectRules || '';
      placeholderMap['REFERENCE_CODE'] = userInputs.referenceCode || '';
      break;

    case 'planner':
      // For planner step, use projectRequest, projectRules, technicalSpecification, referenceCode
      placeholderMap['PROJECT_REQUEST'] = userInputs.projectRequest || '';
      placeholderMap['PROJECT_RULES'] = userInputs.projectRules || '';
      placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.technicalSpecification || '';
      placeholderMap['REFERENCE_CODE'] = userInputs.referenceCode || '';
      break;

    case 'codegen':
      // For codegen step, use projectRequest, projectRules, technicalSpecification, implementationPlan, existingCode
      placeholderMap['PROJECT_REQUEST'] = userInputs.projectRequest || '';
      placeholderMap['PROJECT_RULES'] = userInputs.projectRules || '';
      placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.technicalSpecification || '';
      placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.implementationPlan || '';
      placeholderMap['EXISTING_CODE'] = userInputs.existingCode || '';
      break;

    case 'review':
      // For review step, use projectRequest, projectRules, technicalSpecification, implementationPlan, existingCode
      placeholderMap['PROJECT_REQUEST'] = userInputs.projectRequest || '';
      placeholderMap['PROJECT_RULES'] = userInputs.projectRules || '';
      placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.technicalSpecification || '';
      placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.implementationPlan || '';
      placeholderMap['EXISTING_CODE'] = userInputs.existingCode || '';
      break;

    case 'audit-security':
    case 'audit-a11y':
      // For audit steps, use codeToAudit
      placeholderMap['CODE_TO_AUDIT'] = userInputs.codeToAudit || '';
      break;

    default:
      // Fallback for any steps not explicitly handled (should ideally not happen for known steps)
      DebugLogger.log(`[Warning] Unhandled step in processPromptWithPlaceholders: ${step}. Using direct input mapping.`); // Changed warn to log
      // Attempt to map camelCase keys from userInputs to SCREAMING_SNAKE_CASE for placeholders
      Object.keys(userInputs).forEach(key => {
        // Convert camelCase key to SCREAMING_SNAKE_CASE for the placeholder map
        const placeholderKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
        placeholderMap[placeholderKey] = userInputs[key] || '';
      });
  }

  DebugLogger.log('Placeholder map:', placeholderMap);

  // Create a new prompt manager to generate the prompt
  const promptManager = new PromptManager();
  const generatedPrompt = promptManager.generatePrompt(templateContent, placeholderMap);

  DebugLogger.log(`Generated prompt for step ${step}, length: ${generatedPrompt.length} characters`);

  return generatedPrompt;
}
