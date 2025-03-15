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
exports.JinaReader = void 0;
const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
const url_1 = require("url");
/**
 * Class to handle Jina.ai markdown fetching
 */
class JinaReader {
    constructor() {
        // Get the API key from VS Code settings
        this._apiKey = vscode.workspace.getConfiguration('kornelius').get('jinaApiKey');
    }
    /**
     * Check if the Jina.ai integration is enabled and configured
     */
    isEnabled() {
        // Check if the feature is enabled in settings
        const enabled = vscode.workspace.getConfiguration('kornelius').get('enableJinaIntegration');
        // Ensure we have an API key
        return Boolean(enabled && this._apiKey);
    }
    /**
     * Fetch markdown content from a URL using Jina.ai
     */
    async fetchMarkdown(url) {
        if (!this.isEnabled()) {
            throw new Error('Jina.ai integration is not enabled or missing API key. Configure it in settings.');
        }
        return new Promise((resolve, reject) => {
            try {
                // Validate URL
                const parsedUrl = new url_1.URL(url);
                // Prepare request options
                const options = {
                    hostname: 'api.jina.ai',
                    path: '/v1/fetch-markdown',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this._apiKey}`
                    }
                };
                // Make the request
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            try {
                                const response = JSON.parse(data);
                                if (response.markdown) {
                                    resolve(response.markdown);
                                }
                                else {
                                    reject(new Error('No markdown content found in response'));
                                }
                            }
                            catch (error) {
                                reject(new Error(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`));
                            }
                        }
                        else {
                            reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
                        }
                    });
                });
                req.on('error', (error) => {
                    reject(new Error(`Request error: ${error.message}`));
                });
                // Write request body
                req.write(JSON.stringify({ url: parsedUrl.toString() }));
                req.end();
            }
            catch (error) {
                reject(new Error(`Failed to fetch markdown: ${error instanceof Error ? error.message : String(error)}`));
            }
        });
    }
    /**
     * Register Jina.ai related commands
     */
    static registerCommands(context) {
        // Register command to fetch markdown
        const fetchMarkdownCmd = vscode.commands.registerCommand('kornelius.fetchMarkdown', async () => {
            try {
                const reader = new JinaReader();
                if (!reader.isEnabled()) {
                    const configureAction = 'Configure Settings';
                    const result = await vscode.window.showErrorMessage('Jina.ai integration is not enabled or missing API key.', configureAction);
                    if (result === configureAction) {
                        await vscode.commands.executeCommand('workbench.action.openSettings', 'kornelius');
                    }
                    return;
                }
                const url = await vscode.window.showInputBox({
                    prompt: 'Enter URL to fetch markdown content from',
                    placeHolder: 'https://example.com/article'
                });
                if (!url)
                    return;
                // Show progress indicator
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Fetching markdown content...',
                    cancellable: false
                }, async () => {
                    const markdown = await reader.fetchMarkdown(url);
                    // Create a new untitled document with the fetched markdown
                    const document = await vscode.workspace.openTextDocument({
                        content: markdown,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(document);
                });
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error fetching markdown: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        context.subscriptions.push(fetchMarkdownCmd);
    }
}
exports.JinaReader = JinaReader;
//# sourceMappingURL=jinaReader.js.map