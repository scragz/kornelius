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

    // handlePromptGenerated({ step, content }) { // 'step' here refers to the button/action type like 'request', 'audit-security'
    handlePromptGenerated({ buttonId, content }) { // Use buttonId to find the correct button
        if (!content) {
            logToExtension('Received empty content in promptGenerated message');
            return;
        }
        // const generateButton = document.getElementById('generate-copy-' + step);
        const generateButton = document.getElementById(buttonId); // Find button using the full ID passed back
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

    // handlePromptError({ step, error }) {
    handlePromptError({ buttonId, error }) { // Use buttonId to find the correct button
        logToExtension('Error generating prompt: ' + error, 'error');
        // const errorButton = document.getElementById('generate-copy-' + step);
        const errorButton = document.getElementById(buttonId); // Find button using the full ID passed back
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

                    // Extract the mode and step type from the button ID
                    // e.g., "generate-copy-create-request" -> mode: "create", stepType: "request"
                    // e.g., "generate-copy-audit-security" -> mode: "audit", stepType: "security"
                    const buttonIdParts = buttonId.replace('generate-copy-', '').split('-');
                    const mode = buttonIdParts[0]; // 'create', 'debug', or 'audit'
                    const stepType = buttonIdParts.slice(1).join('-'); // 'request', 'spec', 'observe', 'security', 'a11y' etc.

                    // Validate extracted mode
                    if (!['create', 'debug', 'audit'].includes(mode)) {
                         logToExtension(`Invalid mode extracted from button ID: ${buttonId}`, 'error');
                         // Handle error state for the button
                         generateCopyButton.textContent = 'ID ERROR!';
                         setTimeout(() => {
                              generateCopyButton.textContent = 'GET PROMPT';
                              generateCopyButton.disabled = false; // Re-enable
                              this.formManager.validateButton(buttonId); // Re-validate
                         }, 2000);
                         isProcessing = false; // Reset processing flag
                         return; // Stop further execution
                    }


                    try {
                        // Pass the simple stepType (e.g., 'request') and mode to collectInputData
                        const inputData = this.collectInputData(stepType, mode);
                        logToExtension(`Generating prompt for step: ${stepType} in mode: ${mode}`);
                        // Pass stepType, mode, data, and buttonId to the extension host
                        vscode.postMessage({ command: 'generatePrompt', step: stepType, mode: mode, data: inputData, buttonId: buttonId });
                    } catch (error) {
                        logToExtension('Error preparing inputs: ' + (error.message || String(error)), 'error');
                        generateCopyButton.textContent = 'ERROR!'; // Use consistent error text
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

    // collectInputData(stepType) { // stepType is now like 'request', 'audit-security', etc.
    collectInputData(stepType, mode) { // stepType is simple ('request', 'observe'), mode is ('create', 'debug', 'audit')
        const inputData = {};
        // Construct the full button ID to look up requirements
        const buttonId = `generate-copy-${mode}-${stepType}`;
        const requiredFields = this.formManager.buttonRequirements[buttonId] || [];
        logToExtension(`Collecting data for ${mode}-${stepType}. Required fields: ${requiredFields.join(', ')}`);

        // Define field mappings based on mode and stepType
        let fieldMapping = {};
        if (mode === 'create') {
            switch(stepType) {
                case 'request':
                    fieldMapping = { 'create-request-idea': 'INITIAL_IDEA' };
                    break;
                case 'spec':
                    fieldMapping = {
                        'create-spec-request': 'PROJECT_REQUEST',
                        'create-spec-rules': 'PROJECT_RULES',
                        'create-spec-template': 'REFERENCE_CODE'
                    };
                    break;
                case 'planner':
                    fieldMapping = {
                        'create-planner-request': 'PROJECT_REQUEST',
                        'create-planner-spec': 'TECHNICAL_SPECIFICATION',
                        'create-planner-rules': 'PROJECT_RULES',
                        'create-planner-template': 'REFERENCE_CODE'
                    };
                    break;
                case 'codegen':
                    fieldMapping = {
                        'create-codegen-request': 'PROJECT_REQUEST',
                        'create-codegen-spec': 'TECHNICAL_SPECIFICATION',
                        'create-codegen-plan': 'IMPLEMENTATION_PLAN',
                        'create-codegen-rules': 'PROJECT_RULES',
                        'create-codegen-code': 'EXISTING_CODE'
                    };
                    break;
                case 'review':
                    fieldMapping = {
                        'create-review-request': 'PROJECT_REQUEST',
                        'create-review-spec': 'TECHNICAL_SPECIFICATION',
                        'create-review-plan': 'IMPLEMENTATION_PLAN',
                        'create-review-code': 'EXISTING_CODE',
                        'create-review-rules': 'PROJECT_RULES'
                    };
                    break;
            }
        } else if (mode === 'debug') {
            switch(stepType) {
                case 'observe':
                    fieldMapping = {
                        'debug-observe-bug': 'BUG_DESCRIPTION',
                        'debug-observe-error': 'ERROR_MESSAGES',
                        'debug-observe-repro': 'REPRO_STEPS',
                        'debug-observe-env': 'ENV_DETAILS',
                        'debug-observe-feedback': 'USER_FEEDBACK',
                        'debug-observe-evidence': 'ADDITIONAL_EVIDENCE'
                    };
                    break;
                case 'orient':
                    fieldMapping = {
                        'debug-orient-summary': 'ANALYSIS_SUMMARY',
                        'debug-orient-clarifications': 'UPDATED_CLARIFICATIONS'
                    };
                    break;
                case 'decide':
                    fieldMapping = {
                        'debug-decide-analysis': 'ANALYSIS_SUMMARY',
                        'debug-decide-constraints': 'CONSTRAINTS_OR_RISKS'
                    };
                    break;
                case 'act':
                    fieldMapping = {
                        'debug-act-actions': 'CHOSEN_ACTIONS',
                        'debug-act-implementation': 'IMPLEMENTATION_PLAN',
                        'debug-act-success': 'SUCCESS_CRITERIA'
                    };
                    break;
            }
        } else if (mode === 'audit') {
            // Audit mode currently has no specific input fields mapped here
            // If they were added, they'd go here. Example:
            // case 'security': fieldMapping = { 'audit-security-code': 'CODE_TO_AUDIT' }; break;
            fieldMapping = {}; // Explicitly empty for now
        } else {
             throw new Error(`Unknown mode for data collection: ${mode}`);
        }

        // Validate required fields and collect data using the determined mapping
        this.validateAndCollect(inputData, fieldMapping, requiredFields);

        logToExtension(`Collected data for ${mode}-${stepType}:`, inputData);
        return inputData;
    }

    validateAndCollect(inputData, fields, required) {
        // Check required fields first (using the prefixed IDs from buttonRequirements)
        for (const fieldId of required) {
            const element = document.getElementById(fieldId);
            if (!element?.value.trim()) {
                 logToExtension(`Validation failed: Required field ${fieldId} is empty.`);
                // Attempt to find a label for a better error message
                const label = document.querySelector(`label[for="${fieldId}"]`);
                throw new Error(`Please fill in the required field: ${label?.textContent || fieldId}`);
            }
        }
        // Collect all fields defined in the mapping for this step type and mode
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
