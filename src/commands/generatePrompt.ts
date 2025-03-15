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
}

/**
 * Command to generate a prompt from a template and user inputs
 */
export async function generatePrompt(
  templateContent: string,
  userInputs: PromptUserInputs
): Promise<string> {
  try {
    const promptManager = new PromptManager();

    // Convert the structured user inputs to a flat record of key-value pairs
    const placeholderMap: Record<string, string> = {
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
