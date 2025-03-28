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
    constructor(_extensionUri, _context // Re-add context
    ) {
        this._extensionUri = _extensionUri;
        this._context = _context;
    }
    resolveWebviewView(webviewView, _context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            // Allow loading resources from the extension root AND the 'out' directory
            localResourceRoots: [
                this._extensionUri,
                vscode.Uri.joinPath(this._extensionUri, 'out')
            ], // Removed duplicate property
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Send initial state to the webview using workspaceState
        const stateKey = `${SidebarViewProvider.viewType}.state`;
        const initialState = this._context.workspaceState.get(stateKey) || {};
        debugLogger_1.DebugLogger.log('Sending initial state to webview:', initialState);
        webviewView.webview.postMessage({ command: 'loadState', state: initialState });
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                // Handle state saving using workspaceState
                if (message.command === 'saveState') {
                    debugLogger_1.DebugLogger.log('Received state update from webview:', message.state);
                    await this._context.workspaceState.update(stateKey, message.state);
                    return; // State saved, no further action needed for this message
                }
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
                    // Execute the registered command which handles UI and fetching
                    debugLogger_1.DebugLogger.log('Sidebar received fetchJina message, executing kornelius.fetchJina command.');
                    try {
                        await vscode.commands.executeCommand('kornelius.fetchJina');
                        // The command itself handles success/error messages/UI
                    }
                    catch (error) {
                        debugLogger_1.DebugLogger.error('Error executing kornelius.fetchJina command:', error);
                        vscode.window.showErrorMessage(`Error running Jina fetch: ${error instanceof Error ? error.message : String(error)}`);
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
                            // Log the received message including mode and buttonId
                            debugLogger_1.DebugLogger.log(`Sidebar: Received generatePrompt request for step ${message.step} in mode ${message.mode} (buttonId: ${message.buttonId}) with data:`, message.data);
                            const generatedPrompt = await vscode.commands.executeCommand('kornelius.generatePrompt', message.step, // e.g., 'request', 'observe'
                            message.mode, // e.g., 'create', 'debug'
                            message.data);
                            debugLogger_1.DebugLogger.log(`Sidebar: Successfully generated prompt for step ${message.step} (mode: ${message.mode}), sending back to webview`);
                            // Send back the buttonId so the webview knows which button to update
                            webviewView.webview.postMessage({
                                command: 'promptGenerated',
                                buttonId: message.buttonId,
                                content: generatedPrompt
                            });
                        }
                        catch (error) {
                            debugLogger_1.DebugLogger.error(`Sidebar: Error generating prompt for step ${message.step} (mode: ${message.mode}):`, error);
                            vscode.window.showErrorMessage(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
                            // Send back the buttonId so the webview knows which button to update
                            webviewView.webview.postMessage({
                                command: 'promptError',
                                buttonId: message.buttonId,
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
                .replace(/\${nonce}/g, nonce) // Then nonce
                .replace(/\${styleResetUri}/g, styleResetUri.toString()) // Then URIs
                .replace(/\${styleVSCodeUri}/g, styleVSCodeUri.toString())
                .replace(/\${styleMainUri}/g, styleMainUri.toString())
                .replace(/\${jsUri}/g, jsUri.toString()); // <-- Add JS URI replacement
            return htmlTemplate;
        }
        catch (error) {
            debugLogger_1.DebugLogger.error('Error loading sidebar template:', error);
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