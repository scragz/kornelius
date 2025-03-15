import * as vscode from 'vscode';
import { PromptManager, PromptTemplate } from '../utils/promptManager';

/**
 * Command to browse available prompt templates and return them
 */
export async function browsePrompts(): Promise<PromptTemplate[]> {
  try {
    const promptManager = new PromptManager();
    const templates = await promptManager.getPromptTemplates();

    if (!templates || templates.length === 0) {
      vscode.window.showInformationMessage('No prompt templates found in the prompts directory.');
      return [];
    }

    return templates;
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to browse prompt templates: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Command to select a prompt template
 */
export async function selectPromptTemplate(templates: PromptTemplate[]): Promise<PromptTemplate | undefined> {
  if (!templates || templates.length === 0) {
    vscode.window.showInformationMessage('No prompt templates available to select.');
    return undefined;
  }

  const items = templates.map(template => ({
    label: template.name,
    description: template.type,
    detail: template.fullPath,
    template
  }));

  const selectedItem = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a prompt template',
    matchOnDescription: true,
    matchOnDetail: true
  });

  return selectedItem?.template;
}

/**
 * Command to get the content of a template
 */
export async function getTemplateContent(templatePath: string): Promise<string> {
  try {
    const promptManager = new PromptManager();
    return await promptManager.getPromptContent(templatePath);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to get template content: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
}
