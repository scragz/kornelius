import * as vscode from 'vscode';
import { SidebarViewProvider } from './views/sidebarViewProvider';
import { JinaReader } from './utils/jinaReader';
import { browsePrompts, selectPromptTemplate, getTemplateContent } from './commands/browsePrompts';
import { generatePrompt } from './commands/generatePrompt';
import { copyToClipboard } from './commands/copyPrompt';
import { DebugLogger } from './utils/debugLogger';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Initialize debug logging
  DebugLogger.initialize();

  // Log successful activation
  DebugLogger.log('KoЯnelius extension activated!');

  // Create a special debug command for testing
  const debugCommand = vscode.commands.registerCommand('kornelius.debugAction', () => {
    vscode.window.showInformationMessage('Debug action invoked - This is a test message');

    // Test clipboard functionality
    const testText = "This is a test of the clipboard functionality at " + new Date().toISOString();
    vscode.env.clipboard.writeText(testText).then(() => {
      vscode.window.showInformationMessage('Test text copied to clipboard: ' + testText.substring(0, 20) + '...');
    }, (err) => {
      vscode.window.showErrorMessage('Clipboard test failed: ' + err.message);
    });

    return "Debug command executed";
  });

  // Register the sidebar provider and configure it to handle Jina messages
  const sidebarProvider = new SidebarViewProvider(context.extensionUri);

  // Setup Jina message handling for the sidebar provider
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

  // Register command to handle Jina fetch command from webview
  const jinaFetchCmd = vscode.commands.registerCommand('kornelius.fetchJina', async () => {
    DebugLogger.log('Command kornelius.fetchJina called from webview');
    const reader = new JinaReader();
    if (!reader.isEnabled()) {
      const configureAction = 'Configure Settings';
      const result = await vscode.window.showErrorMessage(
        'Jina.ai integration is not enabled or missing API key.',
        configureAction
      );
      if (result === configureAction) {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'kornelius');
      }
      return;
    }

    const url = await vscode.window.showInputBox({
      prompt: 'Enter URL to fetch markdown from',
      placeHolder: 'https://example.com/article',
      validateInput: (value) => {
        try {
          new URL(value);
          return null;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    });

    if (!url) return;

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Fetching markdown content...',
      cancellable: false
    }, async () => {
      const markdown = await reader.fetchMarkdown(url);
      const document = await vscode.workspace.openTextDocument({
        content: markdown,
        language: 'markdown'
      });
      await vscode.window.showTextDocument(document);
      await vscode.env.clipboard.writeText(markdown);
      vscode.window.showInformationMessage('Content fetched and copied to clipboard');
    });
  });

  // Register generate prompt command
  const generatePromptCmd = vscode.commands.registerCommand('kornelius.generatePrompt',
    async (step: string, userInputs: any) => {
      DebugLogger.log('Command kornelius.generatePrompt called', { step, userInputsKeys: Object.keys(userInputs || {}) });

      try {
        const result = await generatePrompt(step, userInputs);
        DebugLogger.log('Command kornelius.generatePrompt succeeded', { resultLength: result.length });
        return result;
      } catch (err) {
        DebugLogger.error('Command kornelius.generatePrompt failed', err);
        throw err;
      }
    }
  );

  // Register copy to clipboard command
  const copyToClipboardCmd = vscode.commands.registerCommand('kornelius.copyToClipboard',
    async (text: string) => {
      DebugLogger.log('Command kornelius.copyToClipboard called', { textLength: text?.length });
      try {
        await copyToClipboard(text);
        DebugLogger.log('Text copied to clipboard successfully');
        return true;
      } catch (err) {
        DebugLogger.error('Failed to copy to clipboard', err);
        return false;
      }
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
    copyToClipboardCmd,
    selectTemplateCmd,
    getTemplateContentCmd,
    focusCmd,
    debugCommand,
    jinaFetchCmd,  // Add the new command
    // Add a command to handle log messages from webview
    vscode.commands.registerCommand('kornelius.log', (message: string) => {
      DebugLogger.log(message);
    })
  );

  // Configure Jina integration message handling
  sidebarProvider.setJinaMessageHandler(async (message, webviewView) => {
    try {
      DebugLogger.log('Handling Jina message: ' + message.command);

      switch (message.command) {
        case 'fetchJina':
          // Handle Jina fetch request with progress indicator
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Fetching from Jina...',
            cancellable: false
          }, async () => {
            try {
              const reader = new JinaReader();
              const markdown = await reader.fetchMarkdown(message.url);

              // Create a new document with the content
              const document = await vscode.workspace.openTextDocument({
                content: markdown,
                language: 'markdown'
              });
              await vscode.window.showTextDocument(document);
              await vscode.env.clipboard.writeText(markdown);

              // Send success result back to webview
              webviewView.webview.postMessage({
                command: 'fetchJinaSuccess',
                results: [{
                  url: message.url,
                  error: null
                }]
              });
            } catch (error) {
              DebugLogger.error(`Error fetching from Jina: ${error instanceof Error ? error.message : String(error)}`);
              webviewView.webview.postMessage({
                command: 'fetchJinaError',
                error: error instanceof Error ? error.message : String(error)
              });
            }
          });
          break;

        case 'checkJinaEnabled':
          // Send current Jina settings to webview
          const config = vscode.workspace.getConfiguration('kornelius');
          webviewView.webview.postMessage({
            command: 'jinaStatus',
            enabled: config.get<boolean>('enableJinaIntegration')
          });
          break;

        default:
          DebugLogger.log(`Unknown Jina message command: ${message.command}`);
      }
    } catch (error) {
      DebugLogger.error(`Error handling Jina message: ${error instanceof Error ? error.message : String(error)}`);
      webviewView.webview.postMessage({
        command: 'fetchJinaError',
        error: 'Internal extension error'
      });
    }
  });

  // Add initial configuration if not already present
  const config = vscode.workspace.getConfiguration('kornelius');
  if (config.get('enableJinaIntegration') === undefined) {
    config.update('enableJinaIntegration', false, vscode.ConfigurationTarget.Global);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
