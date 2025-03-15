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
class SidebarViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Enable JavaScript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the extension's directory
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'stepChange':
                    // Handle step change
                    console.log(`Changed to step: ${message.step}`);
                    break;
                case 'generatePrompt':
                    // Handle prompt generation based on the step
                    try {
                        console.log(`Generating prompt for step ${message.step} with data:`, message.data);
                        // Call the command to generate the prompt
                        const generatedPrompt = await vscode.commands.executeCommand('kornelius.generatePrompt', message.step, message.data);
                        // Send the generated prompt back to the webview
                        webviewView.webview.postMessage({
                            command: 'promptGenerated',
                            step: message.step,
                            content: generatedPrompt
                        });
                    }
                    catch (error) {
                        console.error('Error generating prompt:', error);
                        vscode.window.showErrorMessage(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    break;
                case 'copyToClipboard':
                    // Handle copy to clipboard
                    vscode.env.clipboard.writeText(message.text);
                    vscode.window.showInformationMessage('Prompt copied to clipboard!');
                    break;
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

        <div class="barbed-divider"></div>

        <div class="step-navigation">
          <button id="prev-step" disabled>◀ PREV</button>
          <span id="step-indicator">STEP 1 OF 5</span>
          <button id="next-step">NEXT ▶</button>
        </div>

        <!-- Step 1: Request -->
        <div class="step" id="step-request" data-step="1">
          <h2>REQUEST</h2>
          <div class="input-group">
            <label for="request-idea">Your idea or request:</label>
            <textarea id="request-idea" class="main-input" rows="8" placeholder="Enter your request here..."></textarea>
          </div>
          <div class="button-group">
            <button id="generate-copy-request" class="generate-copy-btn">GENERATE & COPY PROMPT</button>
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
            <button id="generate-copy-spec" class="generate-copy-btn">GENERATE & COPY PROMPT</button>
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
            <button id="generate-copy-planner" class="generate-copy-btn">GENERATE & COPY PROMPT</button>
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
            <button id="generate-copy-codegen" class="generate-copy-btn">GENERATE & COPY PROMPT</button>
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
            <button id="generate-copy-review" class="generate-copy-btn">GENERATE & COPY PROMPT</button>
          </div>
          <div class="munky-tip">
            <p>Use a <span class="model-badge coding-model">coding model</span> like <strong>Sonnet</strong> or <strong>o3-mini</strong> for best results with this prompt.</p>
          </div>
        </div>
      </div>

      <script nonce="${nonce}">
        // Current step tracking
        let currentStep = 1;
        const totalSteps = 5;
        const stepTypes = ['request', 'spec', 'planner', 'codegen', 'review'];

        // Get UI elements
        const prevButton = document.getElementById('prev-step');
        const nextButton = document.getElementById('next-step');
        const stepIndicator = document.getElementById('step-indicator');

        // Step elements
        const steps = document.querySelectorAll('.step');

        // Function to update the visible step
        function updateStep(newStep) {
          // Hide all steps
          steps.forEach(step => step.style.display = 'none');

          // Show the current step
          document.querySelector(\`[data-step="\${newStep}"]\`).style.display = 'block';

          // Update step indicator
          stepIndicator.textContent = \`STEP \${newStep} OF \${totalSteps}\`;

          // Update button states
          prevButton.disabled = newStep === 1;
          nextButton.disabled = newStep === totalSteps;

          // Track current step
          currentStep = newStep;

          // Send message to extension
          const vscode = acquireVsCodeApi();
          vscode.postMessage({
            command: 'stepChange',
            step: currentStep
          });
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
        stepTypes.forEach((stepType, index) => {
          const generateCopyButton = document.getElementById(\`generate-copy-\${stepType}\`);

          if (generateCopyButton) {
            // Handle generate and copy in one click
            generateCopyButton.addEventListener('click', async () => {
              // Get the current data from all the input fields for this step
              const inputData = {};

              // Show loading state
              generateCopyButton.textContent = "GENERATING...";
              generateCopyButton.disabled = true;

              try {
                // Each step has different input fields
                switch(stepType) {
                case 'request':
                  const requestIdeaEl = document.getElementById('request-idea');
                  if (!requestIdeaEl || !requestIdeaEl.value.trim()) {
                    alert('Please enter your request or idea first.');
                    return;
                  }
                  inputData['request'] = requestIdeaEl.value.trim();
                  break;

                case 'spec':
                  const specRequestEl = document.getElementById('spec-request');
                  const specRulesEl = document.getElementById('spec-rules');
                  const specTemplateEl = document.getElementById('spec-template');

                  if (!specRequestEl || !specRequestEl.value.trim()) {
                    alert('Please paste in the project request first.');
                    return;
                  }

                  inputData['request'] = specRequestEl.value.trim();
                  inputData['insert_rules_here'] = specRulesEl ? specRulesEl.value.trim() : '';
                  inputData['insert_template_here'] = specTemplateEl ? specTemplateEl.value.trim() : '';
                  break;

                case 'planner':
                  const plannerRequestEl = document.getElementById('planner-request');
                  const plannerRulesEl = document.getElementById('planner-rules');
                  const plannerSpecEl = document.getElementById('planner-spec');
                  const plannerTemplateEl = document.getElementById('planner-template');

                  if (!plannerRequestEl || !plannerRequestEl.value.trim() ||
                      !plannerSpecEl || !plannerSpecEl.value.trim()) {
                    alert('Please fill in both the request and specification fields.');
                    return;
                  }

                  inputData['request'] = plannerRequestEl.value.trim();
                  inputData['PROJECT_RULES'] = plannerRulesEl ? plannerRulesEl.value.trim() : '';
                  inputData['spec'] = plannerSpecEl.value.trim();
                  inputData['STARTER_TEMPLATE'] = plannerTemplateEl ? plannerTemplateEl.value.trim() : '';
                  break;

                case 'codegen':
                  const codegenRequestEl = document.getElementById('codegen-request');
                  const codegenRulesEl = document.getElementById('codegen-rules');
                  const codegenSpecEl = document.getElementById('codegen-spec');
                  const codegenPlanEl = document.getElementById('codegen-plan');
                  const codegenCodeEl = document.getElementById('codegen-code');

                  if (!codegenRequestEl || !codegenRequestEl.value.trim() ||
                      !codegenSpecEl || !codegenSpecEl.value.trim() ||
                      !codegenPlanEl || !codegenPlanEl.value.trim()) {
                    alert('Please fill in the request, specification, and implementation plan fields.');
                    return;
                  }

                  inputData['request'] = codegenRequestEl.value.trim();
                  inputData['PROJECT_RULES'] = codegenRulesEl ? codegenRulesEl.value.trim() : '';
                  inputData['spec'] = codegenSpecEl.value.trim();
                  inputData['planner'] = codegenPlanEl.value.trim();
                  inputData['YOUR_CODE'] = codegenCodeEl ? codegenCodeEl.value.trim() : '';
                  break;

                case 'review':
                  const reviewRequestEl = document.getElementById('review-request');
                  const reviewRulesEl = document.getElementById('review-rules');
                  const reviewSpecEl = document.getElementById('review-spec');
                  const reviewPlanEl = document.getElementById('review-plan');
                  const reviewCodeEl = document.getElementById('review-code');

                  if (!reviewRequestEl || !reviewRequestEl.value.trim() ||
                      !reviewSpecEl || !reviewSpecEl.value.trim() ||
                      !reviewPlanEl || !reviewPlanEl.value.trim() ||
                      !reviewCodeEl || !reviewCodeEl.value.trim()) {
                    alert('Please fill in all required fields.');
                    return;
                  }

                  inputData['request'] = reviewRequestEl.value.trim();
                  inputData['PROJECT_RULES'] = reviewRulesEl ? reviewRulesEl.value.trim() : '';
                  inputData['spec'] = reviewSpecEl.value.trim();
                  inputData['planner'] = reviewPlanEl.value.trim();
                  inputData['EXISTING_CODE'] = reviewCodeEl.value.trim();
                  break;

                default:
                  alert('Unknown step type');
                  return;
              }

                // Send message to extension to generate prompt for this specific step
                const vscode = acquireVsCodeApi();

                // Generate the prompt
                console.log("Generating prompt for " + stepType);

                // Use a local variable to store the generated prompt
                const generatedPromptResponse = await new Promise((resolve) => {
                  // Set up a one-time listener for the response
                  const messageHandler = (event) => {
                    const msg = event.data;
                    if (msg.command === 'promptGenerated' && msg.step === stepType) {
                      // Remove the listener once we get our response
                      window.removeEventListener('message', messageHandler);
                      resolve(msg.content);
                    }
                  };

                  // Add the listener
                  window.addEventListener('message', messageHandler);

                  // Send the request
                  vscode.postMessage({
                    command: 'generatePrompt',
                    step: stepType,
                    data: inputData
                  });
                });

                // Now copy the generated prompt to clipboard
                if (generatedPromptResponse) {
                  vscode.postMessage({
                    command: 'copyToClipboard',
                    text: generatedPromptResponse
                  });

                  // Show success state
                  generateCopyButton.textContent = "COPIED TO CLIPBOARD!";
                  generateCopyButton.classList.add('pulse');

                  // Reset button after a delay
                  setTimeout(() => {
                    generateCopyButton.textContent = "GENERATE & COPY PROMPT";
                    generateCopyButton.disabled = false;
                    generateCopyButton.classList.remove('pulse');
                  }, 2000);
                }
              } catch (error) {
                // Handle errors
                console.error("Error generating or copying prompt:", error);
                generateCopyButton.textContent = "ERROR - TRY AGAIN";

                // Reset button after a delay
                setTimeout(() => {
                  generateCopyButton.textContent = "GENERATE & COPY PROMPT";
                  generateCopyButton.disabled = false;
                }, 2000);
              }
            });
          }
        });

        // Handle messages from the extension
        window.addEventListener('message', event => {
          const message = event.data;

          // Handle prompt generation response
          if (message.command === 'promptGenerated') {
            const { step, content } = message;
            const previewDiv = document.getElementById(\`\${step}-preview\`);

            if (previewDiv) {
              const contentDiv = previewDiv.querySelector('.preview-content');
              if (contentDiv) {
                contentDiv.textContent = content;

                // Add pulse animation
                previewDiv.classList.add('pulse');
                setTimeout(() => {
                  previewDiv.classList.remove('pulse');
                }, 300);
              }
            }
          }
        });

        // Initialize first step
        updateStep(1);
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