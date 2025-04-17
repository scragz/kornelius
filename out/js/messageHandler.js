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

            if (!message || typeof message !== 'object') {
                logToExtension('Received invalid message from extension host', 'error');
                return;
            }

            try {
                const messageString = typeof message === 'object' ?
                    JSON.stringify(message, (k, v) => v && typeof v === 'object' && Object.keys(v).length > 10 ? '[Object]' : v) :
                    String(message);

                logToExtension('Received message from extension host: ' + messageString);
                this.handleMessage(message);
            } catch (error) {
                logToExtension('Error processing message: ' + error, 'error');
            }
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
                    // Map HTML element ID to the camelCase key expected by PromptUserInputs
                    fieldMapping = { 'create-request-idea': 'initialIdea' };
                    break;
                case 'spec':
                    fieldMapping = {
                        'create-spec-request': 'projectRequest',
                        'create-spec-rules': 'projectRules',
                        'create-spec-template': 'referenceCode'
                    };
                    break;
                case 'planner':
                    fieldMapping = {
                        'create-planner-request': 'projectRequest',
                        'create-planner-spec': 'technicalSpecification',
                        'create-planner-rules': 'projectRules',
                        'create-planner-template': 'referenceCode'
                    };
                    break;
                case 'codegen':
                    fieldMapping = {
                        'create-codegen-request': 'projectRequest',
                        'create-codegen-spec': 'technicalSpecification',
                        'create-codegen-plan': 'implementationPlan',
                        'create-codegen-rules': 'projectRules',
                        'create-codegen-code': 'existingCode'
                    };
                    break;
                case 'review':
                    fieldMapping = {
                        'create-review-request': 'projectRequest',
                        'create-review-spec': 'technicalSpecification',
                        'create-review-plan': 'implementationPlan',
                        'create-review-code': 'existingCode',
                        'create-review-rules': 'projectRules'
                    };
                    break;
            }
        } else if (mode === 'debug') {
            switch(stepType) {
                case 'observe':
                    fieldMapping = {
                        'debug-observe-bug': 'bugDescription',
                        'debug-observe-error': 'errorMessages',
                        'debug-observe-repro': 'reproSteps',
                        'debug-observe-env': 'envDetails',
                        'debug-observe-feedback': 'userFeedback',
                        'debug-observe-evidence': 'additionalEvidence'
                    };
                    break;
                case 'orient':
                    fieldMapping = {
                        'debug-orient-summary': 'analysisSummary',
                        'debug-orient-clarifications': 'updatedClarifications'
                    };
                    break;
                case 'decide':
                    fieldMapping = {
                        'debug-decide-analysis': 'analysisSummary',
                        'debug-decide-constraints': 'constraintsOrRisks'
                    };
                    break;
                case 'act':
                    fieldMapping = {
                        'debug-act-actions': 'chosenActions',
                        'debug-act-implementation': 'implementationPlan',
                        'debug-act-success': 'successCriteria'
                    };
                    break;
            }
        } else if (mode === 'audit') {
            // Audit mode mapping - ensure these match PromptUserInputs if fields are added
            switch(stepType) {
                case 'security':
                    fieldMapping = { 'audit-security-code': 'codeToAudit' }; // Example if an input exists
                    break;
                case 'a11y':
                    fieldMapping = { 'audit-a11y-code': 'codeToAudit' }; // Example if an input exists
                    break;
                default:
                    fieldMapping = {}; // Default to empty if no specific audit step fields
            }
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
