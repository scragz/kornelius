import vscode from './vscodeApi.js';
import { logToExtension } from './sidebarUtils.js';

// Removed MODE_STORAGE_KEY as mode will be saved in workspaceState

export class FormManager {
    constructor() {
        this.createStepTypes = ['request', 'spec', 'planner', 'codegen', 'review'];
        this.debugStepTypes = ['observe', 'orient', 'decide', 'act'];
        this.auditStepTypes = ['audit']; // Single step type for audit mode

        // Default values, will be potentially overwritten by loaded state
        this.currentMode = 'create';
        this.currentStep = 1;

        // Initialize properties based on the default mode initially
        this.updateModeProperties(this.currentMode);


        this.stepValidation = {
            // Create mode validations (field ID -> button ID to enable)
            'create-request-idea': 'generate-copy-create-request',
            'create-spec-request': 'generate-copy-create-spec',
            'create-planner-request': 'generate-copy-create-planner',
            'create-planner-spec': 'generate-copy-create-planner',
            'create-codegen-request': 'generate-copy-create-codegen',
            'create-codegen-spec': 'generate-copy-create-codegen',
            'create-codegen-plan': 'generate-copy-create-codegen',
            'create-review-request': 'generate-copy-create-review',
            'create-review-spec': 'generate-copy-create-review',
            'create-review-plan': 'generate-copy-create-review',
            'create-review-code': 'generate-copy-create-review',
            // Debug mode validations (field ID -> button ID to enable)
            'debug-observe-bug': 'generate-copy-debug-observe',
            'debug-observe-error': 'generate-copy-debug-observe',
            'debug-observe-repro': 'generate-copy-debug-observe',
            'debug-observe-env': 'generate-copy-debug-observe',
            'debug-orient-summary': 'generate-copy-debug-orient',
            'debug-decide-analysis': 'generate-copy-debug-decide',
            'debug-act-actions': 'generate-copy-debug-act',
            'debug-act-implementation': 'generate-copy-debug-act',
            'debug-act-success': 'generate-copy-debug-act',
            // Audit mode validations (field ID -> button ID to enable)
            // No input fields for audit, but keep button IDs for reference
            // 'audit-security-code': 'generate-copy-audit-security', // Field removed
            // 'audit-a11y-code': 'generate-copy-audit-a11y' // Field removed
        };

        // Define required fields for each *button*
        this.buttonRequirements = {
            'generate-copy-create-request': ['create-request-idea'],
            'generate-copy-create-spec': ['create-spec-request'],
            'generate-copy-create-planner': ['create-planner-request', 'create-planner-spec'],
            'generate-copy-create-codegen': ['create-codegen-request', 'create-codegen-spec', 'create-codegen-plan'],
            'generate-copy-create-review': ['create-review-request', 'create-review-spec', 'create-review-plan', 'create-review-code'],
            'generate-copy-debug-observe': ['debug-observe-bug', 'debug-observe-error', 'debug-observe-repro', 'debug-observe-env'],
            'generate-copy-debug-orient': ['debug-orient-summary'],
            'generate-copy-debug-decide': ['debug-decide-analysis'],
            'generate-copy-debug-act': ['debug-act-actions', 'debug-act-implementation', 'debug-act-success'],
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
        // Enable them immediately if Audit mode is active, as they don't need sidebar input.
        if (this.currentMode === 'audit' && (buttonId === 'generate-copy-audit-security' || buttonId === 'generate-copy-audit-a11y')) {
            button.disabled = false; // Always enable audit buttons in audit mode
            // logToExtension(`Audit button ${buttonId} explicitly enabled.`);
            return; // Skip standard validation below for audit buttons
        }
        // --- End special handling ---

        // --- Special handling for Cat/Jina buttons ---
        // These should always be enabled, regardless of form input
        if (buttonId === 'catFilesBtn' || buttonId === 'fetchJinaBtn') {
            button.disabled = false;
            // logToExtension(`Button ${buttonId} explicitly enabled (Cat/Jina).`);
            return; // Skip standard validation below
        }
        // --- End special handling ---


        // Now check textContent for the button
        const buttonText = button.textContent.trim(); // Trim whitespace
        // Only validate if the button is in the initial 'GET PROMPT' state
        if (buttonText !== 'GET PROMPT') {
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

            // Save mode preference - REMOVED localStorage
            // localStorage.setItem(MODE_STORAGE_KEY, mode);

            // Notify extension of mode change
            vscode.postMessage({ command: 'modeChange', mode: this.currentMode });

            // Save the updated state (including the new mode and reset step)
            this.saveStateToExtensionHost();

            // Validate buttons in the new mode
            this.validateAllButtons();

            // Explicitly update to step 1 (or the only step for audit) to make it visible after mode switch
            // No delay needed here, as the container is already visible.
            // updateStep will trigger its own saveStateToExtensionHost call
            this.updateStep(1); // For create/debug, this shows step 1. For audit, it ensures the single step is shown.
            logToExtension(`Explicitly updated to step 1 after switching to mode: ${mode}`);


        } catch (error) {
            logToExtension('Error switching mode: ' + error, 'error');
        }
    }

    // Overload updateStep to also save state
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
            // Save state even for audit mode initial view setting
            this.saveStateToExtensionHost();
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

            // Save the updated state (including the new step)
            this.saveStateToExtensionHost();

        } catch (error) { // This catch corresponds to the try block starting around line 133
            logToExtension('Error updating step: ' + error, 'error');
        }
    } // End of updateStep method - Confirmed brace is present

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
            // Mode is now loaded via loadStateFromExtensionHost, so no need to check localStorage here.
            // this.currentMode is initialized to 'create' by default in the constructor.
            logToExtension(`Initial mode before potential load: ${this.currentMode}`);
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
        // Explicitly ensure Cat and Jina are enabled after any validation run
        const catBtn = document.getElementById('catFilesBtn');
        const jinaBtn = document.getElementById('fetchJinaBtn');
        if (catBtn) catBtn.disabled = false;
        if (jinaBtn) jinaBtn.disabled = false;
    }

    initializeSync() {
        // Create mode sync fields
        this.syncValueAcrossSteps('create-spec-request', ['create-planner-request', 'create-codegen-request', 'create-review-request']);
        this.syncValueAcrossSteps('create-spec-rules', ['create-planner-rules', 'create-codegen-rules', 'create-review-rules']);
        this.syncValueAcrossSteps('create-spec-template', ['create-planner-template']);
        this.syncValueAcrossSteps('create-planner-spec', ['create-codegen-spec', 'create-review-spec']);
        this.syncValueAcrossSteps('create-codegen-plan', ['create-review-plan']);

        // Debug mode sync fields
        this.syncValueAcrossSteps('debug-observe-bug', ['debug-orient-summary']); // Note: orient-summary is now debug-orient-summary
        this.syncValueAcrossSteps('debug-orient-summary', ['debug-decide-analysis']); // Note: decide-analysis is now debug-decide-analysis
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
                    // Reset text and disabled state based on button ID
                    if (btn.id === 'catFilesBtn') {
                        btn.textContent = 'CAT FILES';
                        btn.disabled = false; // Keep enabled
                    } else if (btn.id === 'fetchJinaBtn') {
                        btn.textContent = 'FETCH MARKDOWN';
                        btn.disabled = false; // Keep enabled
                    } else {
                        // All other generate buttons
                        btn.textContent = 'GET PROMPT';
                        btn.disabled = true; // Disable initially
                    }
                    btn.classList.remove('pulse');
                });

                // Revalidate all buttons after clearing
                // This will correctly disable 'GET PROMPT' buttons if fields are empty
                // and ensure Cat/Jina remain enabled via the logic in validateAllButtons
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

        // Restore saved mode - Handled by loadStateFromExtensionHost now
    }

    saveStateToExtensionHost(state = null) {
        try {
            let stateToSave = {};
            if (state !== null) {
                // If state is explicitly provided (like {} from reset), use it directly for textareas
                stateToSave = { ...state };
            } else {
                // Collect current textarea values if state is not explicitly provided
                document.querySelectorAll('textarea').forEach(textarea => {
                    if (textarea.id) {
                        stateToSave[textarea.id] = textarea.value;
                    }
                });
            }

            // Always include currentMode and currentStep
            stateToSave['__currentMode__'] = this.currentMode;
            stateToSave['__currentStep__'] = this.currentStep;

            // Use VS Code's built-in state API first
            // This ensures state is preserved even if webview is destroyed and recreated
            vscode.setState(stateToSave);

            // Wait a tiny bit before sending the message to the extension host
            // This separates the setState and postMessage operations to prevent interference
            setTimeout(() => {
                try {
                    // Send to extension host for cross-session persistence
                    // Ensure we send a proper command structure, not just an object
                    const message = {
                        command: 'saveState',
                        state: stateToSave
                    };

                    vscode.postMessage(message);

                    // Use logToExtension but don't send notifications about state updates to reduce noise
                    // This was causing a malformed message error in the logs
                    console.log('[WebView] State saved to extension host');
                } catch (error) {
                    logToExtension('[WebView] Error sending state to extension host: ' + error, 'error');
                }
            }, 5); // 5ms delay should be enough to prevent race conditions
        } catch (error) {
            logToExtension('Error sending state to extension host: ' + error, 'error');
        }
    }

    loadStateFromExtensionHost(state) {
        try {
            // First try to use the state passed in from the extension host
            let stateToLoad = state;

            // If no valid state received from extension host, try the built-in webview state API
            if (!stateToLoad || typeof stateToLoad !== 'object') {
                const vsCodeState = vscode.getState();
                if (vsCodeState && typeof vsCodeState === 'object') {
                    logToExtension('No valid state from extension host, using VS Code webview state instead');
                    stateToLoad = vsCodeState;
                }
            }

            if (stateToLoad && typeof stateToLoad === 'object') {
                // Use direct console.log to avoid generating more notification messages
                console.log('Loading state from extension host:', stateToLoad);

                // Load mode and step first
                const loadedMode = stateToLoad['__currentMode__'] || 'create'; // Default to create if not found
                const loadedStep = stateToLoad['__currentStep__'] || 1;       // Default to 1 if not found

                // Update internal state BEFORE updating UI
                this.currentMode = loadedMode;
                this.currentStep = loadedStep;
                logToExtension(`Internal state updated: mode=${this.currentMode}, step=${this.currentStep}`);

                // Load textarea values
                for (const [id, value] of Object.entries(stateToLoad)) {
                    // Skip our internal keys
                    if (id === '__currentMode__' || id === '__currentStep__') continue;

                    const element = document.getElementById(id);
                    if (element && element.tagName === 'TEXTAREA') {
                        element.value = value;
                    }
                }
                logToExtension('Restored form values from extension host state');

                // --- Update UI based on loaded state ---
                // 1. Update mode properties (step count etc.) based on loaded mode
                this.updateModeProperties(this.currentMode);

                // 2. Visually switch the mode in the UI (hides/shows containers, updates buttons)
                // This will also call updateStep(1) internally, which is fine, we'll correct it next.
                this.switchMode(this.currentMode); // Use the loaded mode

                // 3. Explicitly set the correct step *after* switchMode has potentially reset it to 1
                // Ensure the step is valid for the loaded mode
                const validStep = Math.max(1, Math.min(loadedStep, this.totalSteps || 1));
                if (validStep !== this.currentStep) {
                     logToExtension(`Correcting step after mode switch. Loaded: ${loadedStep}, Validated/Final: ${validStep}`);
                     this.currentStep = validStep; // Update internal state again if corrected
                }
                this.updateStep(this.currentStep); // Update UI to the correct loaded/validated step

                // 4. Validate all buttons after loading state and setting mode/step
                this.validateAllButtons();
                logToExtension('UI updated and buttons validated after loading state.');

            } else {
                 logToExtension('No valid state received from extension host or state is not an object.');
                 // Ensure initial UI setup happens even without saved state
                 this.switchMode(this.currentMode); // Use default mode
                 this.updateStep(this.currentStep); // Use default step
                 this.validateAllButtons();
            }
        } catch (error) {
            logToExtension('Error loading state from extension host: ' + error, 'error');
        }
    }
} // End of FormManager class
