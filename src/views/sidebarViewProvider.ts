import * as vscode from 'vscode';
import { DebugLogger } from '../utils/debugLogger';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kornelius-sidebar';
  public static readonly viewId = 'kornelius-sidebar';

  private _jinaMessageHandler?: (message: any, webviewView: vscode.WebviewView) => Promise<void>;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  /**
   * Set a handler for Jina-related messages from the webview.
   */
  public setJinaMessageHandler(
    handler: (message: any, webviewView: vscode.WebviewView) => Promise<void>
  ): void {
    this._jinaMessageHandler = handler;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
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
          const enabled = config.get<boolean>('enableJinaIntegration') || false;
          webviewView.webview.postMessage({
            command: 'jinaStatus',
            enabled: enabled
          });
          return;
        } else if (message.command === 'fetchJina') {
          if (this._jinaMessageHandler) {
            await this._jinaMessageHandler(message, webviewView);
          } else {
            DebugLogger.error('No Jina message handler registered, but received a Jina message');
            webviewView.webview.postMessage({
              command: 'fetchJinaError',
              error: 'Jina integration is not properly configured'
            });
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
    // Get URIs for CSS resources
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

    const nonce = getNonce();

    // The HTML includes:
    // • Five step sections (only the first is visible)
    // • A dedicated Jina integration section below the steps
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- CSP: allow styles from the extension and scripts with the matching nonce -->
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
    <p class="tagline">Your vibe coding companion</p>

    <div class="step-navigation">
      <button id="prev-step" disabled>◀ PREV</button>
      <button id="next-step">NEXT ▶</button>
    </div>

    <!-- Step 1: Request -->
    <div class="step" id="step-request" data-step="1">
      <h2>REQUEST</h2>
      <div class="multi-input-container">
        <div class="input-group">
          <label for="request-idea">Your initial idea:</label>
          <textarea id="request-idea" class="main-input" rows="8" placeholder="Enter your initial idea here..."></textarea>
        </div>
      </div>
      <div class="button-group">
        <button id="generate-copy-request" class="generate-copy-btn" disabled>GET PROMPT</button>
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
        <button id="generate-copy-spec" class="generate-copy-btn" disabled>GET PROMPT</button>
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
          <label for="planner-spec">Technical Specification:</label>
          <textarea id="planner-spec" rows="3" placeholder="Paste the results from the spec step..."></textarea>
        </div>
        <div class="input-group">
          <label for="planner-request">Project Request:</label>
          <textarea id="planner-request" rows="3" placeholder="Paste the project request..."></textarea>
        </div>
        <div class="input-group">
          <label for="planner-rules">Project Rules (optional):</label>
          <textarea id="planner-rules" rows="3" placeholder="Enter project rules..."></textarea>
        </div>
        <div class="input-group">
          <label for="planner-template">Starter Template (optional):</label>
          <textarea id="planner-template" rows="3" placeholder="Enter starter template..."></textarea>
        </div>
      </div>
      <div class="button-group">
        <button id="generate-copy-planner" class="generate-copy-btn" disabled>GET PROMPT</button>
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
          <label for="codegen-plan">Implementation Plan:</label>
          <textarea id="codegen-plan" rows="3" placeholder="Paste the implementation plan..."></textarea>
        </div>
        <div class="input-group">
          <label for="codegen-code">Your Code (optional):</label>
          <textarea id="codegen-code" rows="3" placeholder="Enter existing code..."></textarea>
        </div>
        <div class="input-group">
          <label for="codegen-request">Project Request:</label>
          <textarea id="codegen-request" rows="3" placeholder="Paste the project request..."></textarea>
        </div>
        <div class="input-group">
          <label for="codegen-spec">Technical Specification:</label>
          <textarea id="codegen-spec" rows="3" placeholder="Paste the specification..."></textarea>
        </div>
        <div class="input-group">
          <label for="codegen-rules">Project Rules (optional):</label>
          <textarea id="codegen-rules" rows="3" placeholder="Enter project rules..."></textarea>
        </div>
      </div>
      <div class="button-group">
        <button id="generate-copy-codegen" class="generate-copy-btn" disabled>GET PROMPT</button>
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
          <label for="review-code">Existing Code:</label>
          <textarea id="review-code" rows="3" placeholder="Paste the code to review..."></textarea>
        </div>
        <div class="input-group">
          <label for="review-request">Project Request:</label>
          <textarea id="review-request" rows="3" placeholder="Paste the project request..."></textarea>
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
          <label for="review-rules">Project Rules (optional):</label>
          <textarea id="review-rules" rows="3" placeholder="Enter project rules..."></textarea>
        </div>
      </div>
      <div class="button-group">
        <button id="generate-copy-review" class="generate-copy-btn" disabled>GET PROMPT</button>
      </div>
      <div class="munky-tip">
        <p>Use a <span class="model-badge coding-model">coding model</span> like <strong>Sonnet</strong> or <strong>o3-mini</strong> for best results with this prompt.</p>
      </div>
    </div>

    <!-- Jina Integration Section -->
    <div id="jina-section" class="jina-section" style="display: none; margin-top: 20px;">
      <div class="button-group">
        <button id="fetchJinaBtn" class="generate-copy-btn">FETCH MARKDOWN</button>
      </div>
    </div>

    <!-- Cat Section -->
    <div id="cat-section" class="jina-section" style="margin-top: 20px;">
      <div class="button-group">
        <button id="catFilesBtn" class="generate-copy-btn">CAT FILES</button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const LOCAL_STORAGE_KEY = 'kornelius_sidebar_values';

    // Function to save all textarea values to localStorage
    function saveToLocalStorage() {
      try {
        const allInputs = {};
        document.querySelectorAll('textarea').forEach(textarea => {
          if (textarea.id) {
            allInputs[textarea.id] = textarea.value;
          }
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allInputs));
        logToExtension('Saved form values to localStorage');
      } catch (error) {
        logToExtension('Error saving to localStorage: ' + error, 'error');
      }
    }

    // Function to load values from localStorage
    function loadFromLocalStorage() {
      try {
        const savedValues = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedValues) {
          const parsedValues = JSON.parse(savedValues);
          for (const [id, value] of Object.entries(parsedValues)) {
            const element = document.getElementById(id);
            if (element && element.tagName === 'TEXTAREA') {
              element.value = value;
            }
          }
          logToExtension('Restored form values from localStorage');

          // Validate all steps after loading data
          stepTypes.forEach(stepType => {
            validateStep(stepType);
          });
        }
      } catch (error) {
        logToExtension('Error loading from localStorage: ' + error, 'error');
      }
    }

    function logToExtension(message, level = 'log') {
      vscode.postMessage({
        command: level,
        message: typeof message === 'object' ? JSON.stringify(message) : String(message)
      });
    }

    window.onerror = function(message, source, lineno, colno, error) {
      logToExtension(message + ' at ' + source + ':' + lineno + ':' + colno, 'error');
      return true;
    };

    window.addEventListener('unhandledrejection', event => {
      logToExtension('Unhandled Promise rejection: ' + event.reason, 'error');
    });

    window.addEventListener('message', event => {
      const message = event.data;
      console.log('Received message:', message);
      switch (message.command) {
        case 'promptGenerated': {
          const { step, content } = message;
          if (!content) {
            logToExtension('Received empty content in promptGenerated message');
            return;
          }
          const generateButton = document.getElementById('generate-copy-' + step);
          if (generateButton) {
            vscode.postMessage({ command: 'copyToClipboard', text: content });
            generateButton.textContent = "COPIED TO CLIPBOARD!";
            generateButton.classList.add('pulse');
            setTimeout(() => {
              generateButton.textContent = "GET PROMPT";
              generateButton.disabled = false;
              validateStep(step);
              generateButton.classList.remove('pulse');
            }, 2000);
          }
          break;
        }
        case 'promptError': {
          logToExtension('Error generating prompt: ' + message.error, 'error');
          const errorButton = document.getElementById('generate-copy-' + message.step);
          if (errorButton) {
            errorButton.textContent = "ERROR - TRY AGAIN";
            setTimeout(() => {
              errorButton.textContent = "GET PROMPT";
              validateStep(message.step);
            }, 2000);
          }
          break;
        }
        case 'jinaStatus': {
          const jinaSection = document.getElementById('jina-section');
          if (jinaSection) {
            jinaSection.style.display = message.enabled ? 'block' : 'none';
            if (message.enabled) {
              initJinaFunctionality();
            }
          }
          break;
        }
        case 'fetchJinaSuccess': {
          const fetchJinaBtn = document.getElementById('fetchJinaBtn');
          if (fetchJinaBtn) {
            fetchJinaBtn.textContent = 'FETCH';
            fetchJinaBtn.disabled = false;
          }
          if (message.results && message.results.length > 0) {
            const successCount = message.results.filter(r => !r.error).length;
            const failCount = message.results.length - successCount;
            let statusMessage = "Fetched " + successCount + " out of " + message.results.length + " URLs successfully.";
            if (failCount > 0) {
              statusMessage += " " + failCount + " URLs failed.";
            }
            alert(statusMessage);
          }
          break;
        }
        case 'fetchJinaError': {
          const errorBtn = document.getElementById('fetchJinaBtn');
          if (errorBtn) {
            errorBtn.textContent = 'FETCH FROM JINA';
            errorBtn.disabled = false;
          }
          alert('Error fetching from Jina: ' + message.error);
          break;
        }
        default:
          console.log('Received unknown message type:', message.command);
      }
    });

    // Step browsing and validation
    let currentStep = 1;
    const totalSteps = 5;
    const stepTypes = ['request', 'spec', 'planner', 'codegen', 'review'];
    const stepValidation = {
      'request': ['request-idea'],
      'spec': ['spec-request'],
      'planner': ['planner-request', 'planner-spec'],
      'codegen': ['codegen-request', 'codegen-spec', 'codegen-plan'],
      'review': ['review-request', 'review-spec', 'review-plan', 'review-code']
    };

    function validateStep(stepType) {
      const generateButton = document.getElementById('generate-copy-' + stepType);
      if (!generateButton) return;
      if (generateButton.textContent !== "GET PROMPT") return;
      const requiredFields = stepValidation[stepType] || [];
      const isValid = requiredFields.every(fieldId => {
        const field = document.getElementById(fieldId);
        return field && field.value.trim() !== '';
      });
      generateButton.disabled = !isValid;
    }

    function syncValueAcrossSteps(sourceId, targetIds) {
      const sourceElement = document.getElementById(sourceId);
      if (!sourceElement) return;
      sourceElement.addEventListener('input', () => {
        const value = sourceElement.value;
        targetIds.forEach(targetId => {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.value = value;
            for (const stepType in stepValidation) {
              if (stepValidation[stepType].includes(targetId)) {
                validateStep(stepType);
                break;
              }
            }
          }
        });
      });
    }

    for (const stepType in stepValidation) {
      const fields = stepValidation[stepType];
      fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
          field.addEventListener('input', () => {
            validateStep(stepType);
          });
        }
      });
    }

    syncValueAcrossSteps('spec-request', ['planner-request', 'codegen-request', 'review-request']);
    syncValueAcrossSteps('spec-rules', ['planner-rules', 'codegen-rules', 'review-rules']);
    syncValueAcrossSteps('spec-template', ['planner-template']);
    syncValueAcrossSteps('planner-spec', ['codegen-spec', 'review-spec']);
    syncValueAcrossSteps('codegen-plan', ['review-plan']);

    const prevButton = document.getElementById('prev-step');
    const nextButton = document.getElementById('next-step');
    const steps = document.querySelectorAll('.step');

    function updateStep(newStep) {
      try {
        steps.forEach(step => step.style.display = 'none');
        document.querySelector('[data-step="' + newStep + '"]').style.display = 'block';
        prevButton.disabled = newStep === 1;
        nextButton.disabled = newStep === totalSteps;
        currentStep = newStep;
        validateStep(stepTypes[newStep - 1]);
        vscode.postMessage({ command: 'stepChange', step: currentStep });
      } catch (error) {
        logToExtension('Error initializing first step: ' + error, 'error');
      }
    }

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

    stepTypes.forEach((stepType) => {
      const generateCopyButton = document.getElementById('generate-copy-' + stepType);
      if (generateCopyButton) {
        let isProcessing = false;
        generateCopyButton.addEventListener('click', async () => {
          if (generateCopyButton.disabled || isProcessing) {
            return;
          }
          const inputData = {};
          isProcessing = true;
          generateCopyButton.textContent = "GENERATING...";
          generateCopyButton.disabled = true;
          try {
            switch(stepType) {
              case 'request': {
                const requestIdeaEl = document.getElementById('request-idea');
                if (!requestIdeaEl?.value.trim()) {
                  throw new Error('Please enter your initial idea first.');
                }
                inputData.INITIAL_IDEA = requestIdeaEl.value.trim();
                break;
              }
              case 'spec': {
                const specRequestEl = document.getElementById('spec-request');
                if (!specRequestEl?.value.trim()) {
                  throw new Error('Please enter the project request first.');
                }
                inputData.PROJECT_REQUEST = specRequestEl.value.trim();
                inputData.PROJECT_RULES = document.getElementById('spec-rules')?.value.trim() || '';
                inputData.STARTER_TEMPLATE = document.getElementById('spec-template')?.value.trim() || '';
                break;
              }
              case 'planner': {
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
              }
              case 'codegen': {
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
              }
              case 'review': {
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
              }
              default:
                throw new Error('Unknown step type');
            }
            logToExtension('Generating prompt for ' + stepType);
            vscode.postMessage({ command: 'generatePrompt', step: stepType, data: inputData });
          } catch (error) {
            logToExtension('Error preparing inputs: ' + (error.message || String(error)), 'error');
            alert(error.message || 'Failed to prepare inputs');
            generateCopyButton.textContent = "ERROR - TRY AGAIN";
            generateCopyButton.disabled = false;
          } finally {
            setTimeout(() => {
              isProcessing = false;
            }, 2100);
          }
        });
      }
    });

    updateStep(1);

    // Initialize Jina functionality
    function initJinaFunctionality() {
      const fetchJinaBtn = document.getElementById('fetchJinaBtn');
      if (!fetchJinaBtn) return;

      // Handle fetch button click
      fetchJinaBtn.addEventListener('click', () => {
        vscode.postMessage({
          command: 'kornelius.fetchJina'
        });
      });
    }

    // Request Jina integration status on initialization
    vscode.postMessage({ command: 'checkJinaEnabled' });

    // Initialize Cat Files functionality
    const catFilesBtn = document.getElementById('catFilesBtn');
    if (catFilesBtn) {
      catFilesBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'runCat' });
      });
    }

    // Load values from localStorage on initialization
    loadFromLocalStorage();

    // Save values to localStorage on input change
    document.querySelectorAll('textarea').forEach(textarea => {
      textarea.addEventListener('input', saveToLocalStorage);
    });
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
