import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PromptManager } from '../utils/promptManager';
import { DebugLogger } from '../utils/debugLogger';

/**
 * Interface representing user input data for prompt generation
 */
export interface PromptUserInputs {
  INITIAL_IDEA?: string;
  PROJECT_REQUEST?: string;
  PROJECT_RULES?: string;
  TECHNICAL_SPECIFICATION?: string;
  IMPLEMENTATION_PLAN?: string;
  REFERENCE_CODE?: string;
  EXISTING_CODE?: string;
  EXISTING_CODE?: string;
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
      // For request step, use INITIAL_IDEA instead of PROJECT_REQUEST
      placeholderMap['PROJECT_REQUEST'] = userInputs.INITIAL_IDEA || '';
      break;

    case 'spec':
      // For spec step, use previous step's input plus any spec-specific input
      placeholderMap['PROJECT_REQUEST'] = userInputs.PROJECT_REQUEST || '';  // Fixed: Use PROJECT_REQUEST instead of REQUEST
      placeholderMap['PROJECT_RULES'] = userInputs.PROJECT_RULES || '';
      placeholderMap['REFERENCE_CODE'] = userInputs.REFERENCE_CODE || '';
      break;

    case 'planner':
      // For planner step, use request and spec inputs
      placeholderMap['PROJECT_REQUEST'] = userInputs.PROJECT_REQUEST || '';
      placeholderMap['PROJECT_RULES'] = userInputs.PROJECT_RULES || '';
      placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.TECHNICAL_SPECIFICATION || '';  // Fixed: Use TECHNICAL_SPECIFICATION instead of spec
      placeholderMap['REFERENCE_CODE'] = userInputs.REFERENCE_CODE || '';
      break;

    case 'codegen':
      // For codegen step, use request, spec and planner inputs
      placeholderMap['PROJECT_REQUEST'] = userInputs.PROJECT_REQUEST || '';
      placeholderMap['PROJECT_RULES'] = userInputs.PROJECT_RULES || '';
      placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.TECHNICAL_SPECIFICATION || '';
      placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.IMPLEMENTATION_PLAN || '';
      placeholderMap['EXISTING_CODE'] = userInputs.EXISTING_CODE || '';
      break;

    case 'review':
      // For review step, use all previous inputs
      placeholderMap['PROJECT_REQUEST'] = userInputs.PROJECT_REQUEST || '';
      placeholderMap['PROJECT_RULES'] = userInputs.PROJECT_RULES || '';
      placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.TECHNICAL_SPECIFICATION || '';
      placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.IMPLEMENTATION_PLAN || '';
      placeholderMap['EXISTING_CODE'] = userInputs.EXISTING_CODE || '';
      break;

    default:
      // For unknown steps, use whatever inputs are provided
      Object.keys(userInputs).forEach(key => {
        placeholderMap[key.toUpperCase()] = userInputs[key] || '';
      });
  }

  DebugLogger.log('Placeholder map:', placeholderMap);

  // Create a new prompt manager to generate the prompt
  const promptManager = new PromptManager();
  const generatedPrompt = promptManager.generatePrompt(templateContent, placeholderMap);

  DebugLogger.log(`Generated prompt for step ${step}, length: ${generatedPrompt.length} characters`);

  return generatedPrompt;
}
