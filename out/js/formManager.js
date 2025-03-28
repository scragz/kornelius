import vscode from './vscodeApi.js';
import { logToExtension } from './sidebarUtils.js';

const MODE_STORAGE_KEY = 'kornelius_mode'; // Keep for global mode preference

export class FormManager {
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
