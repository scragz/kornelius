import vscode from './vscodeApi.js';
import { logToExtension } from './sidebarUtils.js';

export class MessageHandler {
    constructor(formManager) {
        this.formManager = formManager;
        this.initializeMessageHandling();
        this.initializeGenerateButtons();
        this.initializeJina();
        this.initializeCatFiles();
        this.setupErrorHandling();
    }

    initializeMessageHandling() {
        window.addEventListener('message', event => {
            const message = event.data;
            // console.log('Received message:', message); // Replaced with logToExtension or removed if redundant
            logToExtension('Received message from extension host: ' + JSON.stringify(message));
            this.handleMessage(message);
        });
    }

    handleMessage(message) {
        switch (message.command) {
            case 'loadState': // Handle receiving initial state
                this.formManager.loadStateFromExtensionHost(message.state);
                break;
            case 'promptGenerated':
                this.handlePromptGenerated(message);
                break;
            case 'promptError':
                this.handlePromptError(message);
                break;
            case 'jinaStatus':
                this.handleJinaStatus(message);
                break;
            case 'fetchJinaSuccess':
                this.handleJinaSuccess(message);
                break;
            case 'fetchJinaError':
                this.handleJinaError(message);
                break;
            default:
                logToExtension('Unknown message command received: ' + message.command);
        }
    }

    handlePromptGenerated({ step, content }) { // 'step' here refers to the button/action type like 'request', 'audit-security'
        if (!content) {
            logToExtension('Received empty content in promptGenerated message');
            return;
        }
        const generateButton = document.getElementById('generate-copy-' + step);
        if (generateButton) {
            vscode.postMessage({ command: 'copyToClipboard', text: content });
            generateButton.textContent = 'COPIED!'; // Use consistent success text
            generateButton.classList.add('pulse');
            setTimeout(() => {
                // Reset text consistently
                generateButton.textContent = 'GET PROMPT';
                generateButton.disabled = false;
                this.formManager.validateButton(generateButton.id); // Re-validate this specific button
                generateButton.classList.remove('pulse');
            }, 2000);
        }
    }

    handlePromptError({ step, error }) {
        logToExtension('Error generating prompt: ' + error, 'error');
        const errorButton = document.getElementById('generate-copy-' + step);
        if (errorButton) {
            errorButton.textContent = 'ERROR! FAILURE!'; // Use requested error text
            setTimeout(() => {
                 // Reset text consistently
                errorButton.textContent = 'GET PROMPT';
                this.formManager.validateButton(errorButton.id); // Re-validate
            }, 2000);
        }
    }

    initializeGenerateButtons() {
        // Use the buttonRequirements keys to find all generate buttons
        Object.keys(this.formManager.buttonRequirements).forEach((buttonId) => {
            const generateCopyButton = document.getElementById(buttonId);
            if (generateCopyButton) {
                let isProcessing = false;
                generateCopyButton.addEventListener('click', async () => {
                    if (generateCopyButton.disabled || isProcessing) return;
                    isProcessing = true;
                    generateCopyButton.textContent = 'GENERATING...';
                    generateCopyButton.disabled = true;

                    // Extract the step/action type from the button ID (e.g., 'request', 'audit-security')
                    const stepType = buttonId.replace('generate-copy-', '');

                    try {
                        const inputData = this.collectInputData(stepType);
                        logToExtension('Generating prompt for ' + stepType);
                        vscode.postMessage({ command: 'generatePrompt', step: stepType, data: inputData });
                    } catch (error) {
                        logToExtension('Error preparing inputs: ' + (error.message || String(error)), 'error');
                        // alert(error.message || 'Failed to prepare inputs'); // Removed alert
                        generateCopyButton.textContent = 'ERROR!'; // Use requested error text
                        // Reset text consistently after a delay
                        setTimeout(() => {
                            generateCopyButton.textContent = 'GET PROMPT';
                            generateCopyButton.disabled = false; // Re-enable on error
                            this.formManager.validateButton(buttonId); // Re-validate
                        }, 2000); // Keep the delay consistent
                    } finally {
                        // Use timeout to prevent immediate re-click after success/error message resets
                        setTimeout(() => { isProcessing = false; }, 2100);
                    }
                });
            }
        });
    }

    collectInputData(stepType) { // stepType is now like 'request', 'audit-security', etc.
        const inputData = {};
        const requiredFields = this.formManager.buttonRequirements['generate-copy-' + stepType] || [];

        switch(stepType) {
            // Create mode steps
            case 'request':
                this.validateAndCollect(inputData, { 'request-idea': 'INITIAL_IDEA' }, requiredFields);
                break;
            case 'spec':
                this.validateAndCollect(inputData, {
                    'spec-request': 'PROJECT_REQUEST',
                    'spec-rules': 'PROJECT_RULES',
                    'spec-template': 'REFERENCE_CODE'
                }, requiredFields);
                break;
            case 'planner':
                this.validateAndCollect(inputData, {
                    'planner-request': 'PROJECT_REQUEST',
                    'planner-spec': 'TECHNICAL_SPECIFICATION',
                    'planner-rules': 'PROJECT_RULES',
                    'planner-template': 'REFERENCE_CODE'
                }, requiredFields);
                break;
            case 'codegen':
                this.validateAndCollect(inputData, {
                    'codegen-request': 'PROJECT_REQUEST',
                    'codegen-spec': 'TECHNICAL_SPECIFICATION',
                    'codegen-plan': 'IMPLEMENTATION_PLAN',
                    'codegen-rules': 'PROJECT_RULES',
                    'codegen-code': 'EXISTING_CODE'
                }, requiredFields);
                break;
            case 'review':
                this.validateAndCollect(inputData, {
                    'review-request': 'PROJECT_REQUEST',
                    'review-spec': 'TECHNICAL_SPECIFICATION',
                    'review-plan': 'IMPLEMENTATION_PLAN',
                    'review-code': 'EXISTING_CODE',
                    'review-rules': 'PROJECT_RULES'
                }, requiredFields);
                break;

            // Debug mode steps
            case 'observe':
                this.validateAndCollect(inputData, {
                    'observe-bug': 'BUG_DESCRIPTION',
                    'observe-error': 'ERROR_MESSAGES',
                    'observe-repro': 'REPRO_STEPS',
                    'observe-env': 'ENV_DETAILS',
                    'observe-feedback': 'USER_FEEDBACK',
                    'observe-evidence': 'ADDITIONAL_EVIDENCE'
                }, requiredFields);
                break;
            case 'orient':
                this.validateAndCollect(inputData, {
                    'orient-summary': 'ANALYSIS_SUMMARY',
                    'orient-clarifications': 'UPDATED_CLARIFICATIONS'
                }, requiredFields);
                break;
            case 'decide':
                this.validateAndCollect(inputData, {
                    'decide-analysis': 'ANALYSIS_SUMMARY',
                    'decide-constraints': 'CONSTRAINTS_OR_RISKS'
                }, requiredFields);
                break;
            case 'act':
                this.validateAndCollect(inputData, {
                    'act-actions': 'CHOSEN_ACTIONS',
                    'act-implementation': 'IMPLEMENTATION_PLAN',
                    'act-success': 'SUCCESS_CRITERIA'
                }, requiredFields);
                break;

            // Audit mode steps
            case 'audit-security':
                 // No specific sidebar input needed, but check requiredFields just in case (should be empty)
                this.validateAndCollect(inputData, {}, requiredFields);
                break;
            case 'audit-a11y':
                 // No specific sidebar input needed, but check requiredFields just in case (should be empty)
                this.validateAndCollect(inputData, {}, requiredFields);
                break;

            default:
                throw new Error(`Unknown step type for data collection: ${stepType}`);
        }
        return inputData;
    }

    validateAndCollect(inputData, fields, required) {
        // Check required fields first
        for (const fieldId of required) {
            const element = document.getElementById(fieldId);
            // For audit mode, requiredFields is empty, so this loop won't run, which is correct.
            if (!element?.value.trim()) {
                throw new Error(`Please fill in the required field: ${element?.labels?.[0]?.textContent || fieldId}`);
            }
        }
        // Collect all fields defined for this step type
        for (const [elementId, dataKey] of Object.entries(fields)) {
            const element = document.getElementById(elementId);
            // Only include if element exists, even if not required (allows optional fields)
            if (element) {
                // Use the dataKey (e.g., 'INITIAL_IDEA') for the inputData object
                inputData[dataKey] = element.value.trim() || '';
            }
        }
    }


    initializeJina() {
        vscode.postMessage({ command: 'checkJinaEnabled' });
    }

    handleJinaStatus(message) {
        const jinaSection = document.getElementById('jina-section');
        if (jinaSection) {
            jinaSection.style.display = message.enabled ? 'block' : 'none';
            if (message.enabled) {
                const fetchJinaBtn = document.getElementById('fetchJinaBtn');
                if (fetchJinaBtn) {
                    fetchJinaBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'fetchJina' });
                    });
                }
            }
        }
    }

    handleJinaSuccess(message) {
        const fetchJinaBtn = document.getElementById('fetchJinaBtn');
        if (fetchJinaBtn) {
            fetchJinaBtn.textContent = 'FETCH MARKDOWN';
            fetchJinaBtn.disabled = false;
        }
        if (message.results?.length > 0) {
            const successCount = message.results.filter(r => !r.error).length;
            const failCount = message.results.length - successCount;
            let statusMessage = `Fetched ${successCount} out of ${message.results.length} URLs successfully.`;
            if (failCount > 0) {
                statusMessage += ` ${failCount} URLs failed.`;
            }
            alert(statusMessage);
        }
    }

    handleJinaError(message) {
        const errorBtn = document.getElementById('fetchJinaBtn');
        if (errorBtn) {
            errorBtn.textContent = 'FETCH MARKDOWN';
            errorBtn.disabled = false;
        }
        alert('Error fetching from Jina: ' + message.error);
    }

    initializeCatFiles() {
        const catFilesBtn = document.getElementById('catFilesBtn');
        if (catFilesBtn) {
            catFilesBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'runCat' });
            });
        }
    }

    setupErrorHandling() {
        window.onerror = function(message, source, lineno, colno, _error) { // Prefix unused 'error' with underscore
            logToExtension(message + ' at ' + source + ':' + lineno + ':' + colno, 'error');
            return true;
        };

        window.addEventListener('unhandledrejection', event => {
            logToExtension('Unhandled Promise rejection: ' + event.reason, 'error');
        });
    }
} // End of MessageHandler class
