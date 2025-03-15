import * as vscode from 'vscode';
import { PromptManager } from '../utils/promptManager';

/**
 * Interface representing user input data for prompt generation
 */
export interface PromptUserInputs {
  request: string;
  spec: string;
  planner: string;
  codegen: string;
  review: string;
}

/**
 * Command to generate a prompt for a specific step from a template and user inputs
 */
export async function generatePrompt(
  step: string,
  userInputs: PromptUserInputs
): Promise<string> {
  try {
    const promptManager = new PromptManager();

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
    const placeholderMap: Record<string, string> = {};

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
