import * as vscode from 'vscode';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kornelius-sidebar';
  public static readonly viewId = 'kornelius-sidebar';

  // Keep this reference for potential future updates
  // @ts-ignore
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
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
            const generatedPrompt = await vscode.commands.executeCommand(
              'kornelius.generatePrompt',
              message.step,
              message.data
            );

            // Send the generated prompt back to the webview
            webviewView.webview.postMessage({
              command: 'promptGenerated',
              step: message.step,
              content: generatedPrompt
            });
          } catch (error) {
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

        <div class="barbed-divider"></div>

        <div class="step-navigation">
          <button id="prev-step" disabled>◀ PREV</button>
          <span id="step-indicator">STEP 1 OF 5</span>
          <button id="next-step">NEXT ▶</button>
        </div>

        <!-- Step 1: Request -->
        <div class="step" id="step-request" data-step="1">
          <h2>REQUEST</h2>
          <p>Drop your initial request or idea:</p>
          <textarea id="request-input" rows="10" placeholder="Enter your request here..."></textarea>
          <div class="prompt-preview" id="request-preview" style="display: none;">
            <h3>Generated Prompt</h3>
            <div class="preview-content"></div>
          </div>
          <div class="button-group">
            <button id="generate-request">GENERATE PROMPT</button>
            <button id="copy-request" disabled>COPY TO CLIPBOARD</button>
          </div>
        </div>

        <!-- Step 2: Spec -->
        <div class="step" id="step-spec" data-step="2" style="display: none;">
          <h2>SPEC</h2>
          <p>Define the specifications for your request:</p>
          <textarea id="spec-input" rows="10" placeholder="Enter specifications here..."></textarea>
          <div class="prompt-preview" id="spec-preview" style="display: none;">
            <h3>Generated Prompt</h3>
            <div class="preview-content"></div>
          </div>
          <div class="button-group">
            <button id="generate-spec">GENERATE PROMPT</button>
            <button id="copy-spec" disabled>COPY TO CLIPBOARD</button>
          </div>
        </div>

        <!-- Step 3: Planner -->
        <div class="step" id="step-planner" data-step="3" style="display: none;">
          <h2>PLANNER</h2>
          <p>Map out the implementation approach:</p>
          <textarea id="planner-input" rows="10" placeholder="Enter planning details here..."></textarea>
          <div class="prompt-preview" id="planner-preview" style="display: none;">
            <h3>Generated Prompt</h3>
            <div class="preview-content"></div>
          </div>
          <div class="button-group">
            <button id="generate-planner">GENERATE PROMPT</button>
            <button id="copy-planner" disabled>COPY TO CLIPBOARD</button>
          </div>
        </div>

        <!-- Step 4: Codegen -->
        <div class="step" id="step-codegen" data-step="4" style="display: none;">
          <h2>CODEGEN</h2>
          <p>Specify coding requirements or samples:</p>
          <textarea id="codegen-input" rows="10" placeholder="Enter code generation requirements here..."></textarea>
          <div class="prompt-preview" id="codegen-preview" style="display: none;">
            <h3>Generated Prompt</h3>
            <div class="preview-content"></div>
          </div>
          <div class="button-group">
            <button id="generate-codegen">GENERATE PROMPT</button>
            <button id="copy-codegen" disabled>COPY TO CLIPBOARD</button>
          </div>
        </div>

        <!-- Step 5: Review -->
        <div class="step" id="step-review" data-step="5" style="display: none;">
          <h2>REVIEW</h2>
          <p>Review the implementation and provide feedback:</p>
          <textarea id="review-input" rows="10" placeholder="Enter review feedback here..."></textarea>
          <div class="prompt-preview" id="review-preview" style="display: none;">
            <h3>Generated Prompt</h3>
            <div class="preview-content"></div>
          </div>
          <div class="button-group">
            <button id="generate-review">GENERATE PROMPT</button>
            <button id="copy-review" disabled>COPY TO CLIPBOARD</button>
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

        // Setup generate and copy buttons for each step
        stepTypes.forEach((stepType, index) => {
          const generateButton = document.getElementById(\`generate-\${stepType}\`);
          const copyButton = document.getElementById(\`copy-\${stepType}\`);
          const previewDiv = document.getElementById(\`\${stepType}-preview\`);

          if (generateButton && copyButton && previewDiv) {
            // Generate prompt for this step
            generateButton.addEventListener('click', () => {
              // Get the current data (focusing just on the current step's input)
              const inputData = {};

              // For each step, we'll collect the inputs from previous steps
              for (let i = 0; i <= index; i++) {
                const prevStepType = stepTypes[i];
                const inputElement = document.getElementById(\`\${prevStepType}-input\`);
                if (inputElement) {
                  inputData[prevStepType] = inputElement.value || '';
                }
              }

              // Simple validation for the current step
              if (!inputData[stepType]) {
                alert(\`Oops, you need to fill in the \${stepType.charAt(0).toUpperCase() + stepType.slice(1)} field!\`);
                return;
              }

              // Show preview container
              previewDiv.style.display = 'block';

              // Send message to extension to generate prompt for this specific step
              const vscode = acquireVsCodeApi();
              vscode.postMessage({
                command: 'generatePrompt',
                step: stepType,
                data: inputData
              });

              // Enable copy button
              copyButton.disabled = false;
            });

            // Copy to clipboard for this step
            copyButton.addEventListener('click', () => {
              // Get the generated prompt text from the preview
              const previewContent = previewDiv.querySelector('.preview-content');
              if (previewContent) {
                const promptText = previewContent.textContent || '';

                // Send message to extension
                const vscode = acquireVsCodeApi();
                vscode.postMessage({
                  command: 'copyToClipboard',
                  text: promptText
                });

                // Add pulse animation to button
                copyButton.classList.add('pulse');
                setTimeout(() => {
                  copyButton.classList.remove('pulse');
                }, 300);
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

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
