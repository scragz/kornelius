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
        // Set the initial mode property, but don't call switchMode here yet.
        this.currentMode = savedMode;
        this.currentStep = 1; // Always start at step 1

        // Initialize properties based on the determined mode (needed for step counts etc.)
        this.updateModeProperties(this.currentMode);


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
            // IDs needed for validation logic even if fields aren't required for enabling
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
            // Audit buttons have NO required input fields from the sidebar for enabling
            'generate-copy-audit-security': [],
            'generate-copy-audit-a11y': []
        };


        // Initialize after setting up properties
        this.initializeModeToggle(); // Sets up listeners and initial mode determination
        // initializeNavigation is called within switchMode if needed
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
                this.totalSteps = this.auditStepTypes.length; // Should be 1
                break;
            default:
                logToExtension('Unknown mode in updateModeProperties: ' + mode, 'error');
                this.stepTypes = [];
                this.totalSteps = 0;
        }
        // Don't set this.currentMode here, let switchMode handle it
        // this.currentMode = mode;
        logToExtension(`Mode properties updated for ${mode}: ${this.totalSteps} steps.`);
    }


    // Validates if a specific button should be enabled based on its required fields
    validateButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) {
             // logToExtension(`Button ${buttonId} not found during validation.`);
             return; // Exit if button doesn't exist
        }

        // --- Special handling for Audit buttons ---
        // Check this *before* checking textContent, as textContent might be irrelevant or inconsistent.
        // Enable them immediately if Audit mode is active, as they don't need sidebar input.
        if (this.currentMode === 'audit' && (buttonId === 'generate-copy-audit-security' || buttonId === 'generate-copy-audit-a11y')) {
             button.disabled = false; // Always enable audit buttons in audit mode
             // logToExtension(`Audit button ${buttonId} explicitly enabled.`);
             return; // Skip standard validation below for audit buttons
        }
        // --- End special handling ---

        // Now check textContent for non-audit buttons
        const buttonText = button.textContent.trim(); // Trim whitespace
        if (buttonText !== 'GET PROMPT' && buttonText !== 'GET SECURITY PROMPT' && buttonText !== 'GET A11Y PROMPT') {
            // logToExtension(`Skipping validation for button ${buttonId} (not in GET state: "${buttonText}")`);
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
        // If Audit mode is active, this function should ideally not be called for step changes (as there's only 1 step).
        // However, it IS called by switchMode and DOMContentLoaded to set the initial view.
        if (this.currentMode === 'audit') {
            logToExtension('updateStep called in Audit mode (likely for initial view). Ensuring step 1 is visible.');
            const stepsContainer = document.getElementById('audit-mode-steps');
            if (stepsContainer) {
                const auditStep = stepsContainer.querySelector('.step[data-step="1"]'); // Target step 1 specifically
                if (auditStep) {
                    // Hide any other potentially visible steps (though there shouldn't be any)
                    stepsContainer.querySelectorAll('.step').forEach(step => {
                        if (step !== auditStep) {
                            step.style.display = 'none';
                            step.classList.remove('step-visible');
                        }
                    });
                    // Ensure the target step is visible
                    auditStep.style.display = 'block';
                    auditStep.classList.add('step-visible');
                    logToExtension('Ensured single audit step is visible.');
                } else {
                     logToExtension('Audit step element (data-step="1") not found inside container.', 'error');
                }
            } else {
                 logToExtension('Audit steps container not found.', 'error');
            }
            this.validateAllButtons(); // Validate buttons for audit mode
            return; // Prevent further execution for audit mode
        }

        // Logic for Create and Debug modes
        try {
            logToExtension('Updating step to: ' + newStep + ' in mode: ' + this.currentMode);

            // Get the correct step container based on current mode
            const stepsContainer = document.getElementById(this.currentMode + '-mode-steps');
            if (!stepsContainer) {
                logToExtension('Steps container not found for mode: ' + this.currentMode + ' in updateStep', 'error');
                return;
            }

            // Remove the 'step-visible' class from all steps in the current container
            // Also ensure display is none
            stepsContainer.querySelectorAll('.step').forEach(step => {
                step.classList.remove('step-visible');
                step.style.display = 'none';
            });

            // Add the 'step-visible' class to the target step and set display block
            const targetStepElement = stepsContainer.querySelector('[data-step="' + newStep + '"]');
            if (targetStepElement) {
                // Set display: block directly
                targetStepElement.style.display = 'block';
                // Add the animation class directly
                targetStepElement.classList.add('step-visible');
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

            // Only proceed if the mode is actually changing
            // This prevents issues if called multiple times during init with the same mode
            if (mode === this.currentMode && document.getElementById(mode + '-mode-steps')?.style.display === 'block') {
                 logToExtension(`Already in mode ${mode}. No switch needed.`);
                 return;
            }

            // Update the internal currentMode state *first*
            this.currentMode = mode;
            logToExtension(`Internal currentMode set to: ${this.currentMode}`);


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
                logToExtension(`Container ${mode}-mode-steps displayed.`);
            } else {
                logToExtension('Could not find container for mode: ' + mode, 'error');
            }


            // Update mode-specific properties (like step count)
            this.updateModeProperties(mode);

            // Reset to step 1 of the new mode
            this.currentStep = 1;

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

            // Explicitly update to step 1 (or the only step for audit) to make it visible after mode switch
            // No delay needed here, as the container is already visible.
            this.updateStep(1); // For create/debug, this shows step 1. For audit, it ensures the single step is shown.
            logToExtension(`Explicitly updated to step 1 after switching to mode: ${mode}`);

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

            // Determine initial mode but DO NOT call switchMode here.
            // Let DOMContentLoaded handle the initial setup.
            const savedMode = localStorage.getItem(MODE_STORAGE_KEY) || 'create';
            this.currentMode = savedMode;
            logToExtension(`Initial mode from storage/default: ${this.currentMode}`);
            // Update properties based on this initial mode determination
            this.updateModeProperties(this.currentMode);


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
                // Don't log warning if the field is one of the intentionally removed audit fields
                // UPDATE: Keep logging for now, but adjust validation logic
                // if (fieldId !== 'audit-security-code' && fieldId !== 'audit-a11y-code') {
                    logToExtension(`Validation init: Field element not found: ${fieldId}`, 'warn');
                // }
            }
        }
        // Initial validation run for all buttons (will be called again in DOMContentLoaded)
        // this.validateAllButtons();
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
        // Call switchMode with the determined initial mode AFTER the DOM is fully loaded.
        // This ensures all elements are available and avoids race conditions.
        logToExtension(`DOMContentLoaded: Setting initial mode to ${formManager.currentMode}`);
        formManager.switchMode(formManager.currentMode);

        // Initial validation run after potential state loading and mode setup
        formManager.validateAllButtons();
        logToExtension(`Initial button validation complete for mode: ${formManager.currentMode}`);

        // No need for the extra updateStep(1) here, switchMode handles it.

        logToExtension('Initialization complete via DOMContentLoaded.');
    } catch (error) {
        logToExtension('Error during DOMContentLoaded initialization: ' + error, 'error');
        console.error('Error during DOMContentLoaded initialization:', error);
    }
});
