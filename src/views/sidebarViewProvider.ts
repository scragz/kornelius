import * as vscode from 'vscode';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kornelius-sidebar';

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
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'stepChange':
          // Handle step change
          console.log(`Changed to step: ${message.step}`);
          break;
        case 'generatePrompt':
          // Handle prompt generation
          console.log('Generating prompt with data:', message.data);
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
        </div>

        <!-- Step 2: Spec -->
        <div class="step" id="step-spec" data-step="2" style="display: none;">
          <h2>SPEC</h2>
          <p>Define the specifications for your request:</p>
          <textarea id="spec-input" rows="10" placeholder="Enter specifications here..."></textarea>
        </div>

        <!-- Step 3: Planner -->
        <div class="step" id="step-planner" data-step="3" style="display: none;">
          <h2>PLANNER</h2>
          <p>Map out the implementation approach:</p>
          <textarea id="planner-input" rows="10" placeholder="Enter planning details here..."></textarea>
        </div>

        <!-- Step 4: Codegen -->
        <div class="step" id="step-codegen" data-step="4" style="display: none;">
          <h2>CODEGEN</h2>
          <p>Specify coding requirements or samples:</p>
          <textarea id="codegen-input" rows="10" placeholder="Enter code generation requirements here..."></textarea>
        </div>

        <!-- Step 5: Review -->
        <div class="step" id="step-review" data-step="5" style="display: none;">
          <h2>REVIEW</h2>
          <p>Review and drop the final prompt:</p>
          <div id="prompt-preview" class="preview-box">
            <p class="placeholder">Hit all the steps to see your prompt take shape...</p>
          </div>
          <div class="button-group">
            <button id="generate-prompt">GENERATE PROMPT</button>
            <button id="copy-prompt" disabled>COPY TO CLIPBOARD</button>
          </div>
        </div>
      </div>

      <script nonce="${nonce}">
        // Current step tracking
        let currentStep = 1;
        const totalSteps = 5;

        // Get UI elements
        const prevButton = document.getElementById('prev-step');
        const nextButton = document.getElementById('next-step');
        const stepIndicator = document.getElementById('step-indicator');
        const generateButton = document.getElementById('generate-prompt');
        const copyButton = document.getElementById('copy-prompt');

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

        // Generate prompt
        generateButton.addEventListener('click', () => {
          const data = {
            request: document.getElementById('request-input').value,
            spec: document.getElementById('spec-input').value,
            planner: document.getElementById('planner-input').value,
            codegen: document.getElementById('codegen-input').value
          };

          // Simple validation
          if (!data.request) {
            alert('Oops, you dropped your pick! Request step is required.');
            updateStep(1);
            return;
          }

          // Generate a preview prompt
          const promptPreview = document.getElementById('prompt-preview');
          promptPreview.innerHTML = \`
            <h3>Your Generated Prompt</h3>
            <div class="barbed-divider"></div>
            <div class="prompt-section">
              <h4>Request:</h4>
              <p>\${data.request || 'N/A'}</p>
            </div>
            <div class="prompt-section">
              <h4>Specifications:</h4>
              <p>\${data.spec || 'N/A'}</p>
            </div>
            <div class="prompt-section">
              <h4>Planning:</h4>
              <p>\${data.planner || 'N/A'}</p>
            </div>
            <div class="prompt-section">
              <h4>Code Generation:</h4>
              <p>\${data.codegen || 'N/A'}</p>
            </div>
          \`;

          // Add pulse animation
          promptPreview.classList.add('pulse');
          setTimeout(() => {
            promptPreview.classList.remove('pulse');
          }, 300);

          // Enable copy button
          copyButton.disabled = false;

          // Send message to extension
          const vscode = acquireVsCodeApi();
          vscode.postMessage({
            command: 'generatePrompt',
            data: data
          });
        });

        // Copy to clipboard
        copyButton.addEventListener('click', () => {
          const promptText = [
            'Request:',
            document.getElementById('request-input').value,
            '',
            'Specifications:',
            document.getElementById('spec-input').value,
            '',
            'Planning:',
            document.getElementById('planner-input').value,
            '',
            'Code Generation:',
            document.getElementById('codegen-input').value
          ].join('\\n');

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
