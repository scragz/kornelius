import * as vscode from 'vscode';
import { PromptManager } from '../utils/promptManager';
import { DebugLogger } from '../utils/debugLogger';

/**
 * Interface representing user input data for prompt generation
 */
export interface PromptUserInputs {
  request: string;
  spec: string;
  planner: string;
  codegen: string;
  review: string;
  [key: string]: string; // Add index signature to allow dynamic access
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
    vscode.window.showInformationMessage(`Generating prompt for: ${step}`);

    // Create prompt manager
    const promptManager = new PromptManager();

    // Get all templates
    DebugLogger.log(`Looking for templates in: ${promptManager['_promptsDirectory']}`);
    const templates = await promptManager.getPromptTemplates();
    DebugLogger.log(`Found ${templates.length} templates:`, templates.map(t => t.name).join(', '));

    // Find the template that matches the current step
    const matchingTemplate = templates.find(template => template.type === step);

    if (!matchingTemplate) {
      DebugLogger.error(`No template found for step: ${step}. Available: ${templates.map(t => t.name).join(', ')}`);
      throw new Error(`No template found for step: ${step}. Available templates: ${templates.map(t => t.name).join(', ')}`);
    }

    DebugLogger.log(`Found matching template: ${matchingTemplate.name} at ${matchingTemplate.fullPath}`);

    // Get the template content
    const templateContent = await promptManager.getPromptContent(matchingTemplate.fullPath);
    DebugLogger.log(`Loaded template content, length: ${templateContent.length} characters`);

    // Convert the structured user inputs to a flat record of key-value pairs
    const placeholderMap: Record<string, string> = {};

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
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
}

/**
 * Command to save the generated prompt to a file
 */
export async function saveGeneratedPrompt(content: string): Promise<string | undefined> {
  try {
    // Get a filename for the generated prompt
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `generated-prompt-${timestamp}.md`;

    const promptManager = new PromptManager();

    // Save the generated prompt to a file
    const filePath = await promptManager.saveGeneratedPrompt(content, filename);

    vscode.window.showInformationMessage(`Prompt saved to: ${filePath}`);

    return filePath;
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to save generated prompt: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}
