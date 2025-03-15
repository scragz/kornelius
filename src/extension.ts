import * as vscode from 'vscode';
import { SidebarViewProvider } from './views/sidebarViewProvider';
import { JinaReader } from './utils/jinaReader';
import { browsePrompts, selectPromptTemplate, getTemplateContent } from './commands/browsePrompts';
import { generatePrompt, saveGeneratedPrompt } from './commands/generatePrompt';
import { copyToClipboard } from './commands/copyPrompt';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "kornelius" is now active!');

  // Log successful activation
  console.log('KoЯnelius extension activated!');

  // Register the sidebar provider
  const sidebarProvider = new SidebarViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarViewProvider.viewType,
      sidebarProvider
    )
  );

  // Make sure the activity bar icon is visible on activation
  vscode.commands.executeCommand('setContext', 'korneliusVisible', true);

  // Register command to focus sidebar
  const focusCmd = vscode.commands.registerCommand('kornelius.focus', () => {
    vscode.commands.executeCommand('workbench.view.extension.kornelius-activity');
  });

  // Register browse prompts command
  const browsePromptsCmd = vscode.commands.registerCommand('kornelius.browsePrompts', async () => {
    return await browsePrompts();
  });

  // Register generate prompt command
  const generatePromptCmd = vscode.commands.registerCommand('kornelius.generatePrompt',
    async (step: string, userInputs: any) => {
      return await generatePrompt(step, userInputs);
    }
  );

  // Register save prompt command
  const savePromptCmd = vscode.commands.registerCommand('kornelius.savePrompt',
    async (content: string) => {
      return await saveGeneratedPrompt(content);
    }
  );

  // Register copy to clipboard command
  const copyToClipboardCmd = vscode.commands.registerCommand('kornelius.copyToClipboard',
    async (text: string) => {
      await copyToClipboard(text);
    }
  );

  // Register Jina.ai commands
  JinaReader.registerCommands(context);

  // Register template selection command
  const selectTemplateCmd = vscode.commands.registerCommand('kornelius.selectTemplate',
    async (templates: any[]) => {
      return await selectPromptTemplate(templates);
    }
  );

  // Register get template content command
  const getTemplateContentCmd = vscode.commands.registerCommand('kornelius.getTemplateContent',
    async (templatePath: string) => {
      return await getTemplateContent(templatePath);
    }
  );

  // Add all commands to subscriptions
  context.subscriptions.push(
    browsePromptsCmd,
    generatePromptCmd,
    savePromptCmd,
    copyToClipboardCmd,
    selectTemplateCmd,
    getTemplateContentCmd,
    focusCmd
  );

  // Add initial configuration if not already present
  const config = vscode.workspace.getConfiguration('kornelius');
  if (config.get('enableJinaIntegration') === undefined) {
    config.update('enableJinaIntegration', false, vscode.ConfigurationTarget.Global);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
