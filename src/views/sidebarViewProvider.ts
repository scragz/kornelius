import * as vscode from 'vscode';
import { DebugLogger } from '../utils/debugLogger';
import * as fs from 'fs';
import * as path from 'path';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kornelius-sidebar';
  public static readonly viewId = 'kornelius-sidebar';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
      // Allow loading resources from the extension root AND the 'out' directory
      localResourceRoots: [
          this._extensionUri,
          vscode.Uri.joinPath(this._extensionUri, 'out')
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      try {
        // Handle Jina-related messages first
        if (message.command === 'checkJinaEnabled') {
          const config = vscode.workspace.getConfiguration('kornelius');
          const enabled = config.get<boolean>('enableJinaIntegration') || false;
          webviewView.webview.postMessage({
            command: 'jinaStatus',
            enabled: enabled
          });
          return;
        } else if (message.command === 'fetchJina') {
          // Execute the registered command which handles UI and fetching
          DebugLogger.log('Sidebar received fetchJina message, executing kornelius.fetchJina command.');
          try {
            await vscode.commands.executeCommand('kornelius.fetchJina');
            // The command itself handles success/error messages/UI
          } catch (error) {
            DebugLogger.error('Error executing kornelius.fetchJina command:', error);
            vscode.window.showErrorMessage(`Error running Jina fetch: ${error instanceof Error ? error.message : String(error)}`);
          }
          return;
        } else if (message.command === 'runCat') {
          try {
            await vscode.commands.executeCommand('kornelius.catFiles');
          } catch (error) {
            DebugLogger.error('Error running cat files:', error);
            vscode.window.showErrorMessage(`Error running cat files: ${error instanceof Error ? error.message : String(error)}`);
          }
          return;
        }

        // Handle other messages (step navigation, prompt generation, etc.)
        switch (message.command) {
          case 'stepChange':
            DebugLogger.log(`Changed to step: ${message.step}`);
            break;
          case 'generatePrompt':
            try {
              DebugLogger.log(`Sidebar: Received generatePrompt request for step ${message.step} with data:`, message.data);
              const generatedPrompt = await vscode.commands.executeCommand(
                'kornelius.generatePrompt',
                message.step,
                message.data
              );
              DebugLogger.log(`Sidebar: Successfully generated prompt for step ${message.step}, sending back to webview`);
              webviewView.webview.postMessage({
                command: 'promptGenerated',
                step: message.step,
                content: generatedPrompt
              });
            } catch (error) {
              DebugLogger.error(`Sidebar: Error generating prompt for step ${message.step}:`, error);
              vscode.window.showErrorMessage(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
              webviewView.webview.postMessage({
                command: 'promptError',
                step: message.step,
                error: error instanceof Error ? error.message : String(error)
              });
            }
            break;
          case 'copyToClipboard':
            vscode.env.clipboard.writeText(message.text);
            break;
          case 'logError':
            DebugLogger.error(`Error in webview: ${message.message}`);
            if (message.message.startsWith('Error posting message') ||
                message.message.startsWith('Error preparing inputs')) {
              vscode.window.showErrorMessage(`Webview error: ${message.message}`);
            }
            break;
          case 'log':
            DebugLogger.log(`Webview log: ${message.message}`);
            break;
          default:
            DebugLogger.log(`Unknown message command: ${message.command}`);
        }
      } catch (error) {
        DebugLogger.error('Error handling webview message:', error);
        vscode.window.showErrorMessage(`Error in extension: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get URIs for CSS and JS resources within the 'out' directory (media folder is flattened by copyfiles -u 1)
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'main.css'));
    // JS and Fonts retain their subdirectories relative to 'out'
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'js', 'sidebar.js'));

    const nonce = getNonce();

    // Read the HTML template file
    try {
      // Construct path to the template file inside the 'out/views/templates' directory
      const templatePath = path.join(this._extensionUri.fsPath, 'out', 'views', 'templates', 'sidebar.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

      // Construct CSP string using concatenation
      const cspString = "default-src 'none'; style-src " + webview.cspSource + '; font-src ' + webview.cspSource + "; script-src 'nonce-" + nonce + "';";

      // Replace template variables in order: CSP, nonce, then URIs
      htmlTemplate = htmlTemplate
        .replace(/\${csp}/g, cspString) // Replace CSP first
        .replace(/\${nonce}/g, nonce)   // Then nonce
        .replace(/\${styleResetUri}/g, styleResetUri.toString()) // Then URIs
        .replace(/\${styleVSCodeUri}/g, styleVSCodeUri.toString())
        .replace(/\${styleMainUri}/g, styleMainUri.toString())
        .replace(/\${jsUri}/g, jsUri.toString()); // <-- Add JS URI replacement

      return htmlTemplate;
    } catch (error) {
      DebugLogger.error('Error loading sidebar template:', error);
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <div class="container">
    <h1>Error loading sidebar</h1>
    <p>There was an error loading the sidebar template: ${error instanceof Error ? error.message : String(error)}</p>
  </div>
</body>
</html>`;
    }
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
