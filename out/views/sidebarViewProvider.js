"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const debugLogger_1 = require("../utils/debugLogger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SidebarViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    /**
     * Set a handler for Jina-related messages from the webview.
     */
    setJinaMessageHandler(handler) {
        this._jinaMessageHandler = handler;
    }
    resolveWebviewView(webviewView, _context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                // Handle Jina-related messages first
                if (message.command === 'checkJinaEnabled') {
                    const config = vscode.workspace.getConfiguration('kornelius');
                    const enabled = config.get('enableJinaIntegration') || false;
                    webviewView.webview.postMessage({
                        command: 'jinaStatus',
                        enabled: enabled
                    });
                    return;
                }
                else if (message.command === 'fetchJina') {
                    if (this._jinaMessageHandler) {
                        await this._jinaMessageHandler(message, webviewView);
                    }
                    else {
                        debugLogger_1.DebugLogger.error('No Jina message handler registered, but received a Jina message');
                        webviewView.webview.postMessage({
                            command: 'fetchJinaError',
                            error: 'Jina integration is not properly configured'
                        });
                    }
                    return;
                }
                else if (message.command === 'runCat') {
                    try {
                        await vscode.commands.executeCommand('kornelius.catFiles');
                    }
                    catch (error) {
                        debugLogger_1.DebugLogger.error('Error running cat files:', error);
                        vscode.window.showErrorMessage(`Error running cat files: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    return;
                }
                // Handle other messages (step navigation, prompt generation, etc.)
                switch (message.command) {
                    case 'stepChange':
                        debugLogger_1.DebugLogger.log(`Changed to step: ${message.step}`);
                        break;
                    case 'generatePrompt':
                        try {
                            debugLogger_1.DebugLogger.log(`Sidebar: Received generatePrompt request for step ${message.step} with data:`, message.data);
                            const generatedPrompt = await vscode.commands.executeCommand('kornelius.generatePrompt', message.step, message.data);
                            debugLogger_1.DebugLogger.log(`Sidebar: Successfully generated prompt for step ${message.step}, sending back to webview`);
                            webviewView.webview.postMessage({
                                command: 'promptGenerated',
                                step: message.step,
                                content: generatedPrompt
                            });
                        }
                        catch (error) {
                            debugLogger_1.DebugLogger.error(`Sidebar: Error generating prompt for step ${message.step}:`, error);
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
                        debugLogger_1.DebugLogger.error(`Error in webview: ${message.message}`);
                        if (message.message.startsWith('Error posting message') ||
                            message.message.startsWith('Error preparing inputs')) {
                            vscode.window.showErrorMessage(`Webview error: ${message.message}`);
                        }
                        break;
                    case 'log':
                        debugLogger_1.DebugLogger.log(`Webview log: ${message.message}`);
                        break;
                    default:
                        debugLogger_1.DebugLogger.log(`Unknown message command: ${message.command}`);
                }
            }
            catch (error) {
                debugLogger_1.DebugLogger.error('Error handling webview message:', error);
                vscode.window.showErrorMessage(`Error in extension: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    _getHtmlForWebview(webview) {
        // Get URIs for CSS resources
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
        const nonce = getNonce();
        // Read the HTML template file
        try {
            const templatePath = path.join(this._extensionUri.fsPath, 'src', 'views', 'templates', 'sidebar.html');
            let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
            // Replace template variables
            htmlTemplate = htmlTemplate
                .replace(/\${webview\.cspSource}/g, webview.cspSource)
                .replace(/\${nonce}/g, nonce)
                .replace(/\${styleResetUri}/g, styleResetUri.toString())
                .replace(/\${styleVSCodeUri}/g, styleVSCodeUri.toString())
                .replace(/\${styleMainUri}/g, styleMainUri.toString());
            return htmlTemplate;
        }
        catch (error) {
            debugLogger_1.DebugLogger.error('Error loading sidebar template:', error);
            return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
exports.SidebarViewProvider = SidebarViewProvider;
SidebarViewProvider.viewType = 'kornelius-sidebar';
SidebarViewProvider.viewId = 'kornelius-sidebar';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=sidebarViewProvider.js.map