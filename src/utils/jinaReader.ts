import * as vscode from 'vscode';
import * as https from 'https';
import { URL } from 'url';

/**
 * Class to handle Jina.ai markdown fetching
 */
export class JinaReader {
  private _apiKey: string | undefined;

  constructor() {
    // Get the API key from VS Code settings
    this._apiKey = vscode.workspace.getConfiguration('kornelius').get<string>('jinaApiKey');
  }

  public isEnabled(): boolean {
    const enabled = vscode.workspace.getConfiguration('kornelius').get<boolean>('enableJinaIntegration');
    return Boolean(enabled && this._apiKey);
  }

  public async fetchMarkdown(url: string): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('Jina.ai integration is not enabled or missing API key. Configure it in settings.');
    }

    return new Promise((resolve, reject) => {
      try {
        // Validate URL
        const parsedUrl = new URL(url);
        
        // Create request options with additional headers for markdown formatting
        const options = {
          hostname: 'r.jina.ai',
          path: '/' + parsedUrl.toString(),
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this._apiKey}`,
            'X-Md-Bullet-List-Marker': '-',  // Use - for bullet points
            'X-Md-Em-Delimiter': '*',        // Use * for emphasis
            'X-Return-Format': 'markdown',    // Ensure markdown output
            'X-With-Links-Summary': 'true'    // Include a summary of links
          }
        };

        // Make the request
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                // The r.jina.ai endpoint returns markdown directly, no need to parse JSON
                resolve(data);
              } catch (error) {
                reject(new Error(`Failed to process response: ${error instanceof Error ? error.message : String(error)}`));
              }
            } else {
              reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(new Error(`Request error: ${error.message}`));
        });

        // No need to write request body for GET request
        req.end();
      } catch (error) {
        reject(new Error(`Failed to fetch markdown: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
  }

  public static registerCommands(context: vscode.ExtensionContext): void {
    const fetchCommand = vscode.commands.registerCommand('kornelius.fetchJina', async () => {
      try {
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
      } catch (error) {
        vscode.window.showErrorMessage(`Error fetching markdown: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    context.subscriptions.push(fetchCommand);
  }
}
