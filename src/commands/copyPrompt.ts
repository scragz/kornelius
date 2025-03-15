import * as vscode from 'vscode';

/**
 * Command to copy the generated prompt to the clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage('Prompt copied to clipboard!');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to copy prompt to clipboard: ${error instanceof Error ? error.message : String(error)}`);
  }
}
