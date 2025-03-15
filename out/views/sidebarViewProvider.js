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
class SidebarViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        webviewView.webview.options = {
            // Enable JavaScript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the extension's directory
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                switch (message.command) {
                    case 'stepChange':
                        // Handle step change
                        debugLogger_1.DebugLogger.log(`Changed to step: ${message.step}`);
                        break;
                    case 'generatePrompt':
                        // Handle prompt generation based on the step
                        try {
                            debugLogger_1.DebugLogger.log(`Sidebar: Received generatePrompt request for step ${message.step} with data:`, message.data);
                            // Call the command to generate the prompt
                            const generatedPrompt = await vscode.commands.executeCommand('kornelius.generatePrompt', message.step, message.data);
                            debugLogger_1.DebugLogger.log(`Sidebar: Successfully generated prompt for step ${message.step}, sending back to webview`);
                            // Send the generated prompt back to the webview
                            webviewView.webview.postMessage({
                                command: 'promptGenerated',
                                step: message.step,
                                content: generatedPrompt
                            });
                        }
                        catch (error) {
                            debugLogger_1.DebugLogger.error(`Sidebar: Error generating prompt for step ${message.step}:`, error);
                            vscode.window.showErrorMessage(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
                            // Send error back to webview
                            webviewView.webview.postMessage({
                                command: 'promptError',
                                step: message.step,
                                error: error instanceof Error ? error.message : String(error)
                            });
                        }
                        break;
                    case 'copyToClipboard':
                        // Handle copy to clipboard
                        vscode.env.clipboard.writeText(message.text);
                        // vscode.window.showInformationMessage('Prompt copied to clipboard!');
                        break;
                    case 'logError':
                        // Handle error logging from webview
                        debugLogger_1.DebugLogger.error(`Error in webview: ${message.message}`);
                        // Only show error message for actual errors, not debug messages
                        if (message.message.startsWith('Error posting message') ||
                            message.message.startsWith('Error preparing inputs')) {
                            vscode.window.showErrorMessage(`Webview error: ${message.message}`);
                        }
                        break;
                    case 'log':
                        // Handle regular logging from webview
                        debugLogger_1.DebugLogger.log(`Webview log: ${message.message}`);
                        break;
                }
            }
            catch (error) {
                debugLogger_1.DebugLogger.error('Error handling webview message:', error);
                vscode.window.showErrorMessage(`Error in extension: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    _getHtmlForWebview(webview) {
        // Get the local path to script and css resources
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
        // Keep reference to script URI for future external script support
        // @ts-ignore
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        // Use a nonce to only allow a specific script to be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <!-- Use a content security policy to only allow specific script execution -->
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kornelius</title>
      <link href="${styleResetUri}" rel="stylesheet">
      <link href="${styleVSCodeUri}" rel="stylesheet">
      <link href="${styleMainUri}" rel="stylesheet">
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>Ko<span class="reversed">Я</span>nelius</h1>
        </div>
        <p class="tagline">Your nu-code companion</p>

        <div class="step-navigation">
          <button id="prev-step" disabled>◀ PREV</button>
          <button id="next-step">NEXT ▶</button>
        </div>

        <!-- Step 1: Request -->
        <div class="step" id="step-request" data-step="1">
          <h2>REQUEST</h2>
          <div class="multi-input-container">
            <div class="input-group">
              <label for="request-idea">Your idea or request:</label>
              <textarea id="request-idea" class="main-input" rows="8" placeholder="Enter your request here..."></textarea>
            </div>
          </div>
          <div class="button-group">
            <button id="generate-copy-request" class="generate-copy-btn">GET PROMPT</button>
          </div>
          <div class="munky-tip">
            <p>Use a <span class="model-badge reasoning-model">reasoning model</span> like <strong>o1</strong> or <strong>R3</strong> for best results with this prompt.</p>
          </div>
        </div>

        <!-- Step 2: Spec -->
        <div class="step" id="step-spec" data-step="2" style="display: none;">
          <h2>SPEC</h2>
          <div class="multi-input-container">
            <div class="input-group">
              <label for="spec-request">Project Request:</label>
              <textarea id="spec-request" rows="3" placeholder="Paste the results from the previous step..."></textarea>
            </div>
            <div class="input-group">
              <label for="spec-rules">Project Rules (optional):</label>
              <textarea id="spec-rules" rows="3" placeholder="Enter any project rules..."></textarea>
            </div>
            <div class="input-group">
              <label for="spec-template">Starter Template (optional):</label>
              <textarea id="spec-template" rows="3" placeholder="Enter any starter template..."></textarea>
            </div>
          </div>
          <div class="button-group">
            <button id="generate-copy-spec" class="generate-copy-btn">GET PROMPT</button>
          </div>
          <div class="munky-tip">
            <p>Use a <span class="model-badge reasoning-model">reasoning model</span> like <strong>o1</strong> or <strong>R3</strong> for best results with this prompt.</p>
          </div>
        </div>

        <!-- Step 3: Planner -->
        <div class="step" id="step-planner" data-step="3" style="display: none;">
          <h2>PLANNER</h2>
          <div class="multi-input-container">
            <div class="input-group">
              <label for="planner-request">Project Request:</label>
              <textarea id="planner-request" rows="3" placeholder="Paste the project request..."></textarea>
            </div>
            <div class="input-group">
              <label for="planner-rules">Project Rules (optional):</label>
              <textarea id="planner-rules" rows="3" placeholder="Enter project rules..."></textarea>
            </div>
            <div class="input-group">
              <label for="planner-spec">Technical Specification:</label>
              <textarea id="planner-spec" rows="3" placeholder="Paste the results from the spec step..."></textarea>
            </div>
            <div class="input-group">
              <label for="planner-template">Starter Template (optional):</label>
              <textarea id="planner-template" rows="3" placeholder="Enter starter template..."></textarea>
            </div>
          </div>
          <div class="button-group">
            <button id="generate-copy-planner" class="generate-copy-btn">GET PROMPT</button>
          </div>
          <div class="munky-tip">
            <p>Use a <span class="model-badge reasoning-model">reasoning model</span> like <strong>o1</strong> or <strong>R3</strong> for best results with this prompt.</p>
          </div>
        </div>

        <!-- Step 4: Codegen -->
        <div class="step" id="step-codegen" data-step="4" style="display: none;">
          <h2>CODEGEN</h2>
          <div class="multi-input-container">
            <div class="input-group">
              <label for="codegen-request">Project Request:</label>
              <textarea id="codegen-request" rows="3" placeholder="Paste the project request..."></textarea>
            </div>
            <div class="input-group">
              <label for="codegen-rules">Project Rules (optional):</label>
              <textarea id="codegen-rules" rows="3" placeholder="Enter project rules..."></textarea>
            </div>
            <div class="input-group">
              <label for="codegen-spec">Technical Specification:</label>
              <textarea id="codegen-spec" rows="3" placeholder="Paste the specification..."></textarea>
            </div>
            <div class="input-group">
              <label for="codegen-plan">Implementation Plan:</label>
              <textarea id="codegen-plan" rows="3" placeholder="Paste the implementation plan..."></textarea>
            </div>
            <div class="input-group">
              <label for="codegen-code">Your Code (optional):</label>
              <textarea id="codegen-code" rows="3" placeholder="Enter existing code..."></textarea>
            </div>
          </div>
          <div class="button-group">
            <button id="generate-copy-codegen" class="generate-copy-btn">GET PROMPT</button>
          </div>
          <div class="munky-tip">
            <p>Use a <span class="model-badge coding-model">coding model</span> like <strong>Sonnet</strong> or <strong>o3-mini</strong> for best results with this prompt.</p>
          </div>
        </div>

        <!-- Step 5: Review -->
        <div class="step" id="step-review" data-step="5" style="display: none;">
          <h2>REVIEW</h2>
          <div class="multi-input-container">
            <div class="input-group">
              <label for="review-request">Project Request:</label>
              <textarea id="review-request" rows="3" placeholder="Paste the project request..."></textarea>
            </div>
            <div class="input-group">
              <label for="review-rules">Project Rules (optional):</label>
              <textarea id="review-rules" rows="3" placeholder="Enter project rules..."></textarea>
            </div>
            <div class="input-group">
              <label for="review-spec">Technical Specification:</label>
              <textarea id="review-spec" rows="3" placeholder="Paste the specification..."></textarea>
            </div>
            <div class="input-group">
              <label for="review-plan">Implementation Plan:</label>
              <textarea id="review-plan" rows="3" placeholder="Paste the implementation plan..."></textarea>
            </div>
            <div class="input-group">
              <label for="review-code">Existing Code:</label>
              <textarea id="review-code" rows="3" placeholder="Paste the code to review..."></textarea>
            </div>
          </div>
          <div class="button-group">
            <button id="generate-copy-review" class="generate-copy-btn">GET PROMPT</button>
          </div>
          <div class="munky-tip">
            <p>Use a <span class="model-badge coding-model">coding model</span> like <strong>Sonnet</strong> or <strong>o3-mini</strong> for best results with this prompt.</p>
          </div>
        </div>
      </div>

      <script nonce="${nonce}">
        // Initialize VS Code API once and store the reference
        const vscode = acquireVsCodeApi();

        // Function to log messages to extension with level
        function logToExtension(message, level = 'log') {
          vscode.postMessage({
            command: level,
            message: typeof message === 'object' ? JSON.stringify(message) : String(message)
          });
        }

        // Set global error handler
        window.onerror = function(message, source, lineno, colno, error) {
          logToExtension(message + ' at ' + source + ':' + lineno + ':' + colno, 'error');
          return true;
        };

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', event => {
          logToExtension('Unhandled Promise rejection: ' + event.reason, 'error');
        });

        // Message handler for extension responses
        window.addEventListener('message', event => {
          const message = event.data;

          // Log message receipt at debug level
          console.log('Received message:', message);

          switch (message.command) {
            case 'promptGenerated':
              const { step, content } = message;
              if (!content) {
                logToExtension('Received empty content in promptGenerated message');
                return;
              }

              console.log('Successfully generated prompt for ' + step);
              const generateButton = document.getElementById('generate-copy-' + step);
              if (generateButton) {
                // Copy content to clipboard
                vscode.postMessage({
                  command: 'copyToClipboard',
                  text: content
                });

                generateButton.textContent = "COPIED TO CLIPBOARD!";
                generateButton.classList.add('pulse');

                // Use a flag to prevent regeneration during the disabled state
                let isResetting = false;

                setTimeout(() => {
                  if (!isResetting) {
                    isResetting = true;
                    generateButton.textContent = "GET PROMPT";
                    generateButton.disabled = false;
                    generateButton.classList.remove('pulse');
                    isResetting = false;
                  }
                }, 2000);
              }
              break;

            case 'promptError':
              logToExtension('Error generating prompt: ' + message.error, 'error');
              const errorButton = document.getElementById('generate-copy-' + message.step);
              if (errorButton) {
                errorButton.textContent = "ERROR - TRY AGAIN";
                setTimeout(() => {
                  errorButton.textContent = "GET PROMPT";
                  errorButton.disabled = false;
                }, 2000);
              }
              break;

            default:
              console.log('Received unknown message type:', message.command);
          }
        });

        // Current step tracking
        let currentStep = 1;
        const totalSteps = 5;
        const stepTypes = ['request', 'spec', 'planner', 'codegen', 'review'];

        // Get UI elements
        const prevButton = document.getElementById('prev-step');
        const nextButton = document.getElementById('next-step');
        const steps = document.querySelectorAll('.step');

        // Function to update the visible step
        function updateStep(newStep) {
          try {
            steps.forEach(step => step.style.display = 'none');
            document.querySelector('[data-step="' + newStep + '"]').style.display = 'block';

            prevButton.disabled = newStep === 1;
            nextButton.disabled = newStep === totalSteps;

            currentStep = newStep;

            // Notify extension of step change
            vscode.postMessage({
              command: 'stepChange',
              step: currentStep
            });
          } catch (error) {
            logToExtension('Error initializing first step: ' + error, 'error');
          }
        }

        // Event listeners for navigation
        prevButton.addEventListener('click', () => {
          if (currentStep > 1) {
            updateStep(currentStep - 1);
          }
        });

        nextButton.addEventListener('click', () => {
          if (currentStep < totalSteps) {
            updateStep(currentStep + 1);
          }
        });

        // Setup generate-and-copy buttons for each step
        stepTypes.forEach((stepType) => {
          const generateCopyButton = document.getElementById('generate-copy-' + stepType);
          if (generateCopyButton) {
            // Add a processing flag to prevent duplicate operations
            let isProcessing = false;

            generateCopyButton.addEventListener('click', async () => {
              // Prevent multiple clicks and duplicate processing
              if (generateCopyButton.disabled || isProcessing) {
                return;
              }

              const inputData = {};
              isProcessing = true;

              // Show loading state
              generateCopyButton.textContent = "GENERATING...";
              generateCopyButton.disabled = true;

              try {
                // Each step has different input fields
                switch(stepType) {
                  case 'request':
                    const requestIdeaEl = document.getElementById('request-idea');
                    if (!requestIdeaEl?.value.trim()) {
                      throw new Error('Please enter your request or idea first.');
                    }
                    inputData.PROJECT_REQUEST = requestIdeaEl.value.trim();
                    break;

                  case 'spec':
                    const specRequestEl = document.getElementById('spec-request');
                    if (!specRequestEl?.value.trim()) {
                      throw new Error('Please paste in the project request first.');
                    }
                    inputData.PROJECT_REQUEST = specRequestEl.value.trim();
                    inputData.PROJECT_RULES = document.getElementById('spec-rules')?.value.trim() || '';
                    inputData.STARTER_TEMPLATE = document.getElementById('spec-template')?.value.trim() || '';
                    break;

                  case 'planner':
                    const plannerRequestEl = document.getElementById('planner-request');
                    const plannerSpecEl = document.getElementById('planner-spec');
                    if (!plannerRequestEl?.value.trim() || !plannerSpecEl?.value.trim()) {
                      throw new Error('Please fill in both the request and specification fields.');
                    }
                    inputData.PROJECT_REQUEST = plannerRequestEl.value.trim();
                    inputData.PROJECT_RULES = document.getElementById('planner-rules')?.value.trim() || '';
                    inputData.TECHNICAL_SPECIFICATION = plannerSpecEl.value.trim();
                    inputData.STARTER_TEMPLATE = document.getElementById('planner-template')?.value.trim() || '';
                    break;

                  case 'codegen':
                    const codegenRequestEl = document.getElementById('codegen-request');
                    const codegenSpecEl = document.getElementById('codegen-spec');
                    const codegenPlanEl = document.getElementById('codegen-plan');
                    if (!codegenRequestEl?.value.trim() || !codegenSpecEl?.value.trim() || !codegenPlanEl?.value.trim()) {
                      throw new Error('Please fill in the request, specification, and implementation plan fields.');
                    }
                    inputData.PROJECT_REQUEST = codegenRequestEl.value.trim();
                    inputData.PROJECT_RULES = document.getElementById('codegen-rules')?.value.trim() || '';
                    inputData.TECHNICAL_SPECIFICATION = codegenSpecEl.value.trim();
                    inputData.IMPLEMENTATION_PLAN = codegenPlanEl.value.trim();
                    inputData.YOUR_CODE = document.getElementById('codegen-code')?.value.trim() || '';
                    break;

                  case 'review':
                    const reviewRequestEl = document.getElementById('review-request');
                    const reviewSpecEl = document.getElementById('review-spec');
                    const reviewPlanEl = document.getElementById('review-plan');
                    const reviewCodeEl = document.getElementById('review-code');
                    if (!reviewRequestEl?.value.trim() || !reviewSpecEl?.value.trim() ||
                        !reviewPlanEl?.value.trim() || !reviewCodeEl?.value.trim()) {
                      throw new Error('Please fill in all required fields.');
                    }
                    inputData.PROJECT_REQUEST = reviewRequestEl.value.trim();
                    inputData.PROJECT_RULES = document.getElementById('review-rules')?.value.trim() || '';
                    inputData.TECHNICAL_SPECIFICATION = reviewSpecEl.value.trim();
                    inputData.IMPLEMENTATION_PLAN = reviewPlanEl.value.trim();
                    inputData.EXISTING_CODE = reviewCodeEl.value.trim();
                    break;

                  default:
                    throw new Error('Unknown step type');
                }

                logToExtension('Generating prompt for ' + stepType);

                // Send message to extension
                vscode.postMessage({
                  command: 'generatePrompt',
                  step: stepType,
                  data: inputData
                });

              } catch (error) {
                logToExtension('Error preparing inputs: ' + (error.message || String(error)), 'error');
                alert(error.message || 'Failed to prepare inputs');
                generateCopyButton.textContent = "ERROR - TRY AGAIN";
                generateCopyButton.disabled = false;
              } finally {
                // Reset the processing flag after a short delay
                setTimeout(() => {
                  isProcessing = false;
                }, 2100); // Slightly longer than the button reset timeout
              }
            });
          }
        });

        // Initialize first step
        try {
          updateStep(1);
        } catch (error) {
          logToExtension('Error initializing first step: ' + error, 'error');
        }
      </script>
    </body>
    </html>`;
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