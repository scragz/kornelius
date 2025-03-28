const vscode = acquireVsCodeApi();
// const LOCAL_STORAGE_KEY = 'kornelius_sidebar_values'; // No longer needed for fields
const MODE_STORAGE_KEY = 'kornelius_mode'; // Keep for global mode preference

class FormManager {
    constructor() {
        this.createStepTypes = ['request', 'spec', 'planner', 'codegen', 'review'];
        this.debugStepTypes = ['observe', 'orient', 'decide', 'act'];
        this.auditStepTypes = ['audit']; // Single step type for audit mode

        // Default to CREATE mode unless saved mode exists
        const savedMode = localStorage.getItem(MODE_STORAGE_KEY) || 'create';
        this.currentMode = savedMode; // Will be properly set by switchMode later if needed

        // Initialize properties based on the determined mode
        this.updateModeProperties(this.currentMode);
        this.currentStep = 1; // Always start at step 1

        this.stepValidation = {
            // Create mode validations (field ID -> button ID to enable)
            'request-idea': 'generate-copy-request',
            'spec-request': 'generate-copy-spec',
            'planner-request': 'generate-copy-planner',
            'planner-spec': 'generate-copy-planner',
            'codegen-request': 'generate-copy-codegen',
            'codegen-spec': 'generate-copy-codegen',
            'codegen-plan': 'generate-copy-codegen',
            'review-request': 'generate-copy-review',
            'review-spec': 'generate-copy-review',
            'review-plan': 'generate-copy-review',
            'review-code': 'generate-copy-review',
            // Debug mode validations (field ID -> button ID to enable)
            'observe-bug': 'generate-copy-observe',
            'observe-error': 'generate-copy-observe',
            'observe-repro': 'generate-copy-observe',
            'observe-env': 'generate-copy-observe',
            'orient-summary': 'generate-copy-orient',
            'decide-analysis': 'generate-copy-decide',
            'act-actions': 'generate-copy-act',
            'act-implementation': 'generate-copy-act',
            'act-success': 'generate-copy-act',
            // Audit mode validations (field ID -> button ID to enable)
            'audit-security-code': 'generate-copy-audit-security',
            'audit-a11y-code': 'generate-copy-audit-a11y'
        };

        // Define required fields for each *button*
        this.buttonRequirements = {
            'generate-copy-request': ['request-idea'],
            'generate-copy-spec': ['spec-request'],
            'generate-copy-planner': ['planner-request', 'planner-spec'],
            'generate-copy-codegen': ['codegen-request', 'codegen-spec', 'codegen-plan'],
            'generate-copy-review': ['review-request', 'review-spec', 'review-plan', 'review-code'],
            'generate-copy-observe': ['observe-bug', 'observe-error', 'observe-repro', 'observe-env'],
            'generate-copy-orient': ['orient-summary'],
            'generate-copy-decide': ['decide-analysis'],
            'generate-copy-act': ['act-actions', 'act-implementation', 'act-success'],
            'generate-copy-audit-security': ['audit-security-code'],
            'generate-copy-audit-a11y': ['audit-a11y-code']
        };


        // Initialize after setting up properties
        this.initializeModeToggle(); // Sets up listeners and initial mode
        this.initializeNavigation(); // Sets up nav listeners for current mode
        this.initializeValidation(); // Sets up validation listeners for all fields
        this.initializeSync(); // Sets up field syncing
        this.initializeResetButtons(); // Sets up reset buttons
        this.initializeStateHandling(); // Sets up state saving/loading via extension host

        // Constructor now primarily sets up state and listeners,
        // DOM manipulation for initial view happens in DOMContentLoaded.

        // Log initial mode determined from storage (or default)
        logToExtension('FormManager constructed. Initial mode determined as: ' + this.currentMode);
    }

    updateModeProperties(mode) {
        switch (mode) {
            case 'create':
                this.stepTypes = this.createStepTypes;
                this.totalSteps = this.createStepTypes.length;
                break;
            case 'debug':
                this.stepTypes = this.debugStepTypes;
                this.totalSteps = this.debugStepTypes.length;
                break;
            case 'audit':
                this.stepTypes = this.auditStepTypes;
                this.totalSteps = this.auditStepTypes.length;
                break;
            default:
                logToExtension('Unknown mode in updateModeProperties: ' + mode, 'error');
                this.stepTypes = [];
                this.totalSteps = 0;
        }
        this.currentMode = mode;
        logToExtension(`Mode properties updated for ${mode}: ${this.totalSteps} steps.`);
    }


    // Validates if a specific button should be enabled based on its required fields
    validateButton(buttonId) {
        const button = document.getElementById(buttonId);
        // Only validate if the button is in the 'GET PROMPT' state
        if (!button || (button.textContent !== 'GET PROMPT' && button.textContent !== 'GET SECURITY PROMPT' && button.textContent !== 'GET A11Y PROMPT')) {
            // logToExtension(`Skipping validation for button ${buttonId} (not in GET PROMPT state or not found)`);
            return;
        }

        const requiredFields = this.buttonRequirements[buttonId] || [];
        // logToExtension(`Validating button ${buttonId}. Required fields: ${requiredFields.join(', ')}`);

        const isValid = requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            const fieldHasValue = field && field.value.trim() !== '';
            // logToExtension(`Field ${fieldId}: ${field ? 'Found' : 'Not Found'}, Value: ${field ? `"${field.value.trim()}"` : 'N/A'}, Has Value: ${fieldHasValue}`);
            return fieldHasValue;
        });

        // logToExtension(`Button ${buttonId} validation result: ${isValid}`);
        button.disabled = !isValid;
    }


    updateStep(newStep) {
        // Audit mode only has one step, no navigation needed within it
        if (this.currentMode === 'audit') {
            logToExtension('Audit mode has only one step, no step update needed.');
            return;
        }

        try {
            logToExtension('Updating step to: ' + newStep + ' in mode: ' + this.currentMode);

            // Get the correct step container based on current mode
            const stepsContainer = document.getElementById(this.currentMode + '-mode-steps');
            if (!stepsContainer) {
                logToExtension('Steps container not found for mode: ' + this.currentMode + ' in updateStep', 'error');
                return;
            }

            // Hide all steps within the *current* mode's container and remove animation class
            stepsContainer.querySelectorAll('.step').forEach(step => {
                step.style.display = 'none';
                step.classList.remove('step-visible'); // Remove animation class
            });

            // Show only the target step in the active mode and add animation class
            const targetStepElement = stepsContainer.querySelector('[data-step="' + newStep + '"]');
            if (targetStepElement) {
                targetStepElement.style.display = 'block';
                // Use requestAnimationFrame to ensure display: block is applied before adding the animation class
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { // Double rAF for better browser compatibility
                      targetStepElement.classList.add('step-visible'); // Add animation class
                    });
                });
            } else {
                logToExtension('Step element not found: ' + newStep + ' in mode: ' + this.currentMode, 'error');
                return; // Added return here
            }

            // Update navigation button states if they exist for this mode
            const prevButton = stepsContainer.querySelector('#prev-step');
            const nextButton = stepsContainer.querySelector('#next-step');
            if (prevButton) prevButton.disabled = newStep === 1;
            if (nextButton) nextButton.disabled = newStep === this.totalSteps;

            this.currentStep = newStep;

            // Validate all potentially relevant buttons for the newly displayed step
            // This is broader but ensures buttons are correctly enabled/disabled on step change
            this.validateAllButtons();


            vscode.postMessage({ command: 'stepChange', step: this.currentStep, mode: this.currentMode });
        } catch (error) { // This catch corresponds to the try block starting around line 133
            logToExtension('Error updating step: ' + error, 'error');
        }
    } // End of updateStep method - Confirmed brace is present

    switchMode(mode) {
        try {
            logToExtension('Switching to mode: ' + mode + ' from: ' + this.currentMode);

            if (mode === this.currentMode) return;

            // Update the mode buttons
            document.getElementById('create-mode').classList.toggle('active', mode === 'create');
            document.getElementById('debug-mode').classList.toggle('active', mode === 'debug');
            document.getElementById('audit-mode').classList.toggle('active', mode === 'audit');

            // First, hide ALL steps from all modes
            document.querySelectorAll('.mode-steps-container').forEach(container => {
                container.style.display = 'none';
            });

            // Show the new mode steps container
            const newModeContainer = document.getElementById(mode + '-mode-steps');
            if (newModeContainer) {
                newModeContainer.style.display = 'block';
            } else {
                logToExtension('Could not find container for mode: ' + mode, 'error');
            }


            // Update mode-specific properties
            this.updateModeProperties(mode);

            // Reset to step 1 of the new mode
            this.currentStep = 1;

            // The updateStep(1) call in DOMContentLoaded or subsequent navigation
            // will handle showing the correct step and applying the animation class.
            // We just need to ensure all steps in the newly shown container are initially hidden.
            const newlyVisibleContainer = document.getElementById(mode + '-mode-steps'); // Renamed variable
            if (newlyVisibleContainer) {
                // Hide all steps within the new container first, remove animation class
                newlyVisibleContainer.querySelectorAll('.step').forEach(step => {
                    step.style.display = 'none';
                    step.classList.remove('step-visible');
                });
            }

            // Update navigation buttons for the new mode
            // Only re-initialize navigation if the new mode actually has navigation
            if (mode === 'create' || mode === 'debug') {
                this.initializeNavigation(); // Re-initialize for the new container
            } else {
                // Ensure nav buttons in other modes are not affected if they were somehow visible
                logToExtension('Audit mode selected, skipping navigation re-initialization.');
            }

            // Save mode preference
            localStorage.setItem(MODE_STORAGE_KEY, mode);

            // Notify extension of mode change
            vscode.postMessage({ command: 'modeChange', mode: this.currentMode });

            // Validate buttons in the new mode
            this.validateAllButtons();
        } catch (error) {
            logToExtension('Error switching mode: ' + error, 'error');
        }
    }

    initializeModeToggle() {
        try {
            const createModeBtn = document.getElementById('create-mode');
            const debugModeBtn = document.getElementById('debug-mode');
            const auditModeBtn = document.getElementById('audit-mode');

            if (!createModeBtn || !debugModeBtn || !auditModeBtn) {
                logToExtension('Mode toggle buttons not found', 'error');
                return;
            }

            createModeBtn.addEventListener('click', () => {
                logToExtension('Create mode button clicked');
                this.switchMode('create');
            });

            debugModeBtn.addEventListener('click', () => {
                logToExtension('Debug mode button clicked');
                this.switchMode('debug');
            });

            auditModeBtn.addEventListener('click', () => {
                logToExtension('Audit mode button clicked');
                this.switchMode('audit');
            });

            // Restore previous mode if available
            const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
            if (savedMode) {
                logToExtension('Restoring saved mode: ' + savedMode);
                // Call switchMode directly here to ensure correct initial setup
                this.switchMode(savedMode); // This will set button states and container visibility
            } else {
                // Ensure the default mode ('create') is visually set if no saved mode
                this.switchMode('create');
            }
        } catch (error) {
            logToExtension('Error initializing mode toggle: ' + error, 'error');
        }
    }

    initializeNavigation() {
        // Only initialize navigation for modes that have it
        if (this.currentMode !== 'create' && this.currentMode !== 'debug') {
            logToExtension(`Skipping navigation initialization for mode: ${this.currentMode}`);
            return;
        }

        const stepsContainer = document.getElementById(this.currentMode + '-mode-steps');
        if (!stepsContainer) {
            logToExtension('Navigation init: Steps container not found for mode: ' + this.currentMode, 'error');
            return;
        }

        const prevButton = stepsContainer.querySelector('#prev-step');
        const nextButton = stepsContainer.querySelector('#next-step');

        if (!prevButton || !nextButton) {
            logToExtension('Navigation buttons not found within container for mode: ' + this.currentMode, 'error');
            return;
        }

        // Use onclick for simplicity in replacing listeners on mode switch
        prevButton.onclick = () => {
            if (this.currentStep > 1) {
                this.updateStep(this.currentStep - 1);
            }
        };

        nextButton.onclick = () => {
            if (this.currentStep < this.totalSteps) {
                this.updateStep(this.currentStep + 1);
            }
        };

        // Initial state update for the buttons in the current container
        prevButton.disabled = this.currentStep === 1;
        nextButton.disabled = this.currentStep === this.totalSteps;
    }


    initializeValidation() {
        // Add input listeners to all relevant textareas
        // When a field changes, find which button(s) it affects and validate them
        for (const fieldId in this.stepValidation) {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('input', () => {
                    const buttonId = this.stepValidation[fieldId];
                    if (buttonId) {
                        this.validateButton(buttonId);
                    }
                    // Also validate other buttons that might depend on multiple fields
                    // This is a bit inefficient but ensures correctness
                    this.validateAllButtons();
                });
            } else {
                logToExtension(`Validation init: Field element not found: ${fieldId}`, 'warn');
            }
        }
        // Initial validation run for all buttons
        this.validateAllButtons();
    }

    // Helper to validate all known buttons
    validateAllButtons() {
        logToExtension('Validating all buttons...');
        Object.keys(this.buttonRequirements).forEach(buttonId => {
            this.validateButton(buttonId);
        });
    }

    initializeSync() {
        // Create mode sync fields
        this.syncValueAcrossSteps('spec-request', ['planner-request', 'codegen-request', 'review-request']);
        this.syncValueAcrossSteps('spec-rules', ['planner-rules', 'codegen-rules', 'review-rules']);
        this.syncValueAcrossSteps('spec-template', ['planner-template']);
        this.syncValueAcrossSteps('planner-spec', ['codegen-spec', 'review-spec']);
        this.syncValueAcrossSteps('codegen-plan', ['review-plan']);

        // Debug mode sync fields
        this.syncValueAcrossSteps('observe-bug', ['orient-summary']);
        this.syncValueAcrossSteps('orient-summary', ['decide-analysis']);
    }

    syncValueAcrossSteps(sourceId, targetIds) {
        const sourceElement = document.getElementById(sourceId);
        if (!sourceElement) return;
        sourceElement.addEventListener('input', () => {
            const value = sourceElement.value;
            targetIds.forEach(targetId => {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.value = value;
                    // After syncing, validate the button associated with the target field
                    const buttonId = this.stepValidation[targetId];
                    if (buttonId) {
                        this.validateButton(buttonId);
                    }
                    // Also re-validate any other potentially affected buttons
                    this.validateAllButtons();
                }
            });
        });
    }

    initializeResetButtons() {
        document.querySelectorAll('.reset-btn-small').forEach(resetBtn => {
            resetBtn.addEventListener('click', () => {
                // Clear all textareas across all modes
                document.querySelectorAll('textarea').forEach(textarea => {
                    textarea.value = '';
                });

                // Send empty state to extension host
                this.saveStateToExtensionHost({});

                // Reset all generate buttons to their initial state
                document.querySelectorAll('.generate-copy-btn').forEach(btn => {
                    // Reset text based on ID or a default
                    if (btn.id === 'generate-copy-audit-security') {
                        btn.textContent = 'GET SECURITY PROMPT';
                    } else if (btn.id === 'generate-copy-audit-a11y') {
                        btn.textContent = 'GET A11Y PROMPT';
                    } else if (btn.id === 'catFilesBtn') {
                        btn.textContent = 'CAT FILES'; // Keep CAT FILES button text
                    } else if (btn.id === 'fetchJinaBtn') {
                        btn.textContent = 'FETCH MARKDOWN'; // Keep Jina button text
                    }
                    else {
                        btn.textContent = 'GET PROMPT';
                    }
                    btn.disabled = true; // Disable all initially
                    btn.classList.remove('pulse');
                });

                // Revalidate all buttons after clearing
                this.validateAllButtons();

                vscode.postMessage({ command: 'resetForm', mode: this.currentMode });
            });
        });
    }

    initializeStateHandling() {
        // Listen for input changes to save state
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', () => this.saveStateToExtensionHost());
        });

        // Restore saved mode (still uses localStorage) - Handled in initializeModeToggle now
        // Note: Field values are loaded via 'loadState' message handled in MessageHandler
    }

    saveStateToExtensionHost(state = null) {
        try {
            if (state === null) {
                // Collect current values if state is not explicitly provided (e.g., on input)
                state = {};
                document.querySelectorAll('textarea').forEach(textarea => {
                    if (textarea.id) {
                        state[textarea.id] = textarea.value;
                    }
                });
            }
            vscode.postMessage({ command: 'saveState', state: state });
            logToExtension('Sent state update to extension host');
        } catch (error) {
            logToExtension('Error sending state to extension host: ' + error, 'error');
        }
    }

    loadStateFromExtensionHost(state) {
        try {
            if (state) {
                for (const [id, value] of Object.entries(state)) {
                    const element = document.getElementById(id);
                    if (element && element.tagName === 'TEXTAREA') {
                        element.value = value;
                    }
                }
                logToExtension('Restored form values from extension host state');

                // Validate all buttons after loading state
                this.validateAllButtons();
            }
        } catch (error) {
            logToExtension('Error loading state from extension host: ' + error, 'error');
        }
    }
} // End of FormManager class

class MessageHandler {
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
            generateButton.textContent = 'COPIED TO CLIPBOARD!';
            generateButton.classList.add('pulse');
            setTimeout(() => {
                // Reset text based on ID
                if (step === 'audit-security') {
                    generateButton.textContent = 'GET SECURITY PROMPT';
                } else if (step === 'audit-a11y') {
                    generateButton.textContent = 'GET A11Y PROMPT';
                } else {
                    generateButton.textContent = 'GET PROMPT';
                }
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
            errorButton.textContent = 'ERROR - TRY AGAIN';
            setTimeout(() => {
                // Reset text based on ID
                if (step === 'audit-security') {
                    errorButton.textContent = 'GET SECURITY PROMPT';
                } else if (step === 'audit-a11y') {
                    errorButton.textContent = 'GET A11Y PROMPT';
                } else {
                    errorButton.textContent = 'GET PROMPT';
                }
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
                        alert(error.message || 'Failed to prepare inputs');
                        // Reset text based on ID
                        if (stepType === 'audit-security') {
                            generateCopyButton.textContent = 'GET SECURITY PROMPT';
                        } else if (stepType === 'audit-a11y') {
                            generateCopyButton.textContent = 'GET A11Y PROMPT';
                        } else {
                            generateCopyButton.textContent = 'GET PROMPT';
                        }
                        generateCopyButton.disabled = false; // Re-enable on error
                        this.formManager.validateButton(buttonId); // Re-validate
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
                this.validateAndCollect(inputData, { 'audit-security-code': 'CODE_TO_AUDIT' }, requiredFields);
                break;
            case 'audit-a11y':
                this.validateAndCollect(inputData, { 'audit-a11y-code': 'CODE_TO_AUDIT' }, requiredFields);
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

function logToExtension(message, level = 'log') {
    vscode.postMessage({
        command: level,
        message: typeof message === 'object' ? JSON.stringify(message) : String(message)
    });
}

// Initialize everything as soon as document is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        logToExtension('DOMContentLoaded event fired.');
        const formManager = new FormManager(); // Creates instance, determines initial mode via constructor logic
        new MessageHandler(formManager); // Sets up message handling - removed unused variable assignment

        // --- Set Initial Visual State ---
        // The FormManager constructor and initializeModeToggle now handle setting the
        // correct initial mode based on localStorage. The switchMode function called
        // within initializeModeToggle handles setting the correct container visibility
        // and button states.

        // The switchMode function called during FormManager construction already handles
        // setting the initial step visibility. We just need to ensure navigation
        // and validation are run for the initial state.

        // Ensure navigation buttons (if applicable) are correctly set for the initial mode
        if (formManager.currentMode === 'create' || formManager.currentMode === 'debug') {
            formManager.initializeNavigation();
            logToExtension(`Navigation initialized for initial mode: ${formManager.currentMode}`);
        }

        // Initial validation run after potential state loading and mode setup
        formManager.validateAllButtons();
        logToExtension(`Initial button validation complete for mode: ${formManager.currentMode}`);

        // Explicitly ensure only the first step is visible after all initialization
        // This addresses the regression where all steps might show briefly on load.
        formManager.updateStep(1);
        logToExtension(`Explicitly set initial view to step 1 for mode: ${formManager.currentMode}`);


        logToExtension('Initialization complete via DOMContentLoaded.');
    } catch (error) {
        logToExtension('Error during DOMContentLoaded initialization: ' + error, 'error');
        console.error('Error during DOMContentLoaded initialization:', error);
    }
});
