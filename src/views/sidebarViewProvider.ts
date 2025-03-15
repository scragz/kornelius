import * as vscode from 'vscode';
import { DebugLogger } from '../utils/debugLogger';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kornelius-sidebar';
  public static readonly viewId = 'kornelius-sidebar';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
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
            DebugLogger.log(`Changed to step: ${message.step}`);
            break;
          case 'generatePrompt':
            // Handle prompt generation based on the step
            try {
              DebugLogger.log(`Sidebar: Received generatePrompt request for step ${message.step} with data:`, message.data);

              // Call the command to generate the prompt
              const generatedPrompt = await vscode.commands.executeCommand(
                'kornelius.generatePrompt',
                message.step,
                message.data
              );

              DebugLogger.log(`Sidebar: Successfully generated prompt for step ${message.step}, sending back to webview`);

              // Send the generated prompt back to the webview
              webviewView.webview.postMessage({
                command: 'promptGenerated',
                step: message.step,
                content: generatedPrompt
              });
            } catch (error) {
              DebugLogger.error(`Sidebar: Error generating prompt for step ${message.step}:`, error);
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
            vscode.window.showInformationMessage('Prompt copied to clipboard!');
            break;
          case 'logError':
            // Handle error logging from webview
            DebugLogger.error(`Error in webview: ${message.error}`);
            vscode.window.showErrorMessage(`Webview error: ${message.error}`);
            break;
        }
      } catch (error) {
        DebugLogger.error('Error handling webview message:', error);
        vscode.window.showErrorMessage(`Error in extension: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get the local path to script and css resources
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
    );

    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
    );

    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    );

    // Keep reference to script URI for future external script support
    // @ts-ignore
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );

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

        // Function to log errors to extension
        function logToExtension(error) {
          vscode.postMessage({
            command: 'logError',
            error: typeof error === 'object' ? JSON.stringify(error) : String(error)
          });
        }

        // Set global error handler
        window.onerror = function(message, source, lineno, colno, error) {
          logToExtension(\`\${message} at \${source}:\${lineno}:\${colno}\`);
          return true;
        };

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', event => {
          logToExtension(\`Unhandled Promise rejection: \${event.reason}\`);
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

              console.log(\`Successfully generated prompt for \${step}\`);
              const generateButton = document.getElementById(\`generate-copy-\${step}\`);
              if (generateButton) {
                // Copy content to clipboard
                vscode.postMessage({
                  command: 'copyToClipboard',
                  text: content
                });

                generateButton.textContent = "COPIED TO CLIPBOARD!";
                generateButton.classList.add('pulse');

                setTimeout(() => {
                  generateButton.textContent = "GET PROMPT";
                  generateButton.disabled = false;
                  generateButton.classList.remove('pulse');
                }, 2000);
              }
              break;

            case 'promptError':
              logToExtension(\`Error generating prompt: \${message.error}\`);
              const errorButton = document.getElementById(\`generate-copy-\${message.step}\`);
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
            document.querySelector(\`[data-step="\${newStep}"]\`).style.display = 'block';

            prevButton.disabled = newStep === 1;
            nextButton.disabled = newStep === totalSteps;

            currentStep = newStep;

            // Notify extension of step change
            vscode.postMessage({
              command: 'stepChange',
              step: currentStep
            });
          } catch (error) {
            logToExtension(error);
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
          const generateCopyButton = document.getElementById(\`generate-copy-\${stepType}\`);
          if (generateCopyButton) {
            generateCopyButton.addEventListener('click', async () => {
              const inputData = {};

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

                logToExtension(\`Sending generatePrompt request for \${stepType}\`);

                // Send message to extension
                vscode.postMessage({
                  command: 'generatePrompt',
                  step: stepType,
                  data: inputData
                });

              } catch (error) {
                logToExtension(\`Error preparing inputs: \${error.message || String(error)}\`);
                alert(error.message || 'Failed to prepare inputs');
                generateCopyButton.textContent = "ERROR - TRY AGAIN";
                generateCopyButton.disabled = false;
              }
            });
          }
        });

        // Initialize first step
        try {
          updateStep(1);
        } catch (error) {
          logToExtension(\`Error initializing first step: \${error}\`);
        }
      </script>
    </body>
    </html>`;
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
