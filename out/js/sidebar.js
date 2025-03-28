const vscode = acquireVsCodeApi();
const LOCAL_STORAGE_KEY = 'kornelius_sidebar_values';
const MODE_STORAGE_KEY = 'kornelius_mode';

class FormManager {
    constructor() {
        this.createStepTypes = ['request', 'spec', 'planner', 'codegen', 'review'];
        this.debugStepTypes = ['observe', 'orient', 'decide', 'act'];

        // Default to CREATE mode unless saved mode exists
        const savedMode = localStorage.getItem(MODE_STORAGE_KEY) || 'create';
        this.currentMode = savedMode;

        this.stepTypes = this.currentMode === 'create' ? this.createStepTypes : this.debugStepTypes;
        this.currentStep = 1;
        this.totalSteps = this.currentMode === 'create' ? 5 : 4;

        this.stepValidation = {
            // Create mode validations
            'request': ['request-idea'],
            'spec': ['spec-request'],
            'planner': ['planner-request', 'planner-spec'],
            'codegen': ['codegen-request', 'codegen-spec', 'codegen-plan'],
            'review': ['review-request', 'review-spec', 'review-plan', 'review-code'],
            // Debug mode validations
            'observe': ['observe-bug', 'observe-error', 'observe-repro', 'observe-env'],
            'orient': ['orient-summary'],
            'decide': ['decide-analysis'],
            'act': ['act-actions', 'act-implementation', 'act-success']
        };

        // Initialize after setting up properties
        this.initializeModeToggle();
        this.initializeNavigation();
        this.initializeValidation();
        this.initializeSync();
        this.initializeResetButtons();
        this.initializeStorage(); // Loads saved mode and values

        // Constructor now primarily sets up state and listeners,
        // DOM manipulation for initial view happens in DOMContentLoaded.

        // Log initial mode determined from storage (or default)
        logToExtension('FormManager constructed. Initial mode determined as: ' + this.currentMode);
    }

    validateStep(stepType) {
        const generateButton = document.getElementById('generate-copy-' + stepType);
        if (!generateButton || generateButton.textContent !== 'GET PROMPT') return;
        const requiredFields = this.stepValidation[stepType] || [];
        const isValid = requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });
        generateButton.disabled = !isValid;
    }

    updateStep(newStep) {
        try {
            logToExtension('Updating step to: ' + newStep + ' in mode: ' + this.currentMode);

            // First, hide ALL steps from both modes to ensure no panels are accidentally visible
            document.querySelectorAll('.step').forEach(step => {
                step.style.display = 'none';
            });

            // Get the correct step container based on current mode
            const stepsContainer = document.getElementById(this.currentMode + '-mode-steps');
            if (!stepsContainer) {
                logToExtension('Steps container not found for mode: ' + this.currentMode, 'error');
                return;
            }

            // Show only the current step in the active mode
            const currentStep = stepsContainer.querySelector('[data-step="' + newStep + '"]');
            if (currentStep) {
                currentStep.style.display = 'block';
            } else {
                logToExtension('Step not found: ' + newStep + ' in mode: ' + this.currentMode, 'error');
            }

            document.getElementById('prev-step').disabled = newStep === 1;
            document.getElementById('next-step').disabled = newStep === this.totalSteps;

            this.currentStep = newStep;

            // Validate current step
            const stepType = this.stepTypes[newStep - 1];
            if (stepType) {
                this.validateStep(stepType);
            }

            vscode.postMessage({ command: 'stepChange', step: this.currentStep, mode: this.currentMode });
        } catch (error) {
            logToExtension('Error updating step: ' + error, 'error');
        }
    }

    switchMode(mode) {
        try {
            logToExtension('Switching to mode: ' + mode + ' from: ' + this.currentMode);

            if (mode === this.currentMode) return;

            // Update the mode buttons
            document.getElementById('create-mode').classList.toggle('active', mode === 'create');
            document.getElementById('debug-mode').classList.toggle('active', mode === 'debug');

            // First, hide ALL steps from both modes
            document.querySelectorAll('.step').forEach(step => {
                step.style.display = 'none';
            });

            // Hide the old mode steps and show the new mode steps container
            document.getElementById('create-mode-steps').style.display = mode === 'create' ? 'block' : 'none';
            document.getElementById('debug-mode-steps').style.display = mode === 'debug' ? 'block' : 'none';

            // Update mode-specific properties
            this.currentMode = mode;
            this.stepTypes = mode === 'create' ? this.createStepTypes : this.debugStepTypes;
            this.totalSteps = mode === 'create' ? 5 : 4;

            // Reset to step 1 of the new mode, and make ONLY that step visible
            this.currentStep = 1;

            // Show only the current step in the active mode
            const newStepContainer = document.getElementById(mode + '-mode-steps');
            if (newStepContainer) {
                const firstStep = newStepContainer.querySelector('[data-step="1"]');
                if (firstStep) {
                    firstStep.style.display = 'block';
                }
            }

            // Update navigation buttons for the new mode
            this.initializeNavigation(); // Re-initialize for the new container

            // Save mode preference
            localStorage.setItem(MODE_STORAGE_KEY, mode);

            // Notify extension of mode change
            vscode.postMessage({ command: 'modeChange', mode: this.currentMode });
        } catch (error) {
            logToExtension('Error switching mode: ' + error, 'error');
        }
    }

    initializeModeToggle() {
        try {
            const createModeBtn = document.getElementById('create-mode');
            const debugModeBtn = document.getElementById('debug-mode');

            if (!createModeBtn || !debugModeBtn) {
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

            // Restore previous mode if available
            const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
            if (savedMode) {
                logToExtension('Restoring saved mode: ' + savedMode);
                this.switchMode(savedMode);
            }
        } catch (error) {
            logToExtension('Error initializing mode toggle: ' + error, 'error');
        }
    }

    initializeNavigation() {
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

        // Remove previous listeners if any (to avoid duplicates on mode switch)
        // A simple way is to replace the node, but let's try direct removal if possible
        // Or manage listeners more carefully if needed. For now, let's assume this is the first setup or a clean switch.

        prevButton.onclick = () => { // Use onclick for simplicity in replacing
            if (this.currentStep > 1) {
                this.updateStep(this.currentStep - 1);
            }
        };

        nextButton.onclick = () => { // Use onclick for simplicity in replacing
            if (this.currentStep < this.totalSteps) {
                this.updateStep(this.currentStep + 1);
            }
        };

        // Initial state update for the buttons in the current container
        prevButton.disabled = this.currentStep === 1;
        nextButton.disabled = this.currentStep === this.totalSteps;
    }


    initializeValidation() {
        // Initialize validation for both create and debug modes
        for (const stepType in this.stepValidation) {
            const fields = this.stepValidation[stepType];
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.addEventListener('input', () => this.validateStep(stepType));
                }
            });
        }
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
                    for (const stepType in this.stepValidation) {
                        if (this.stepValidation[stepType].includes(targetId)) {
                            this.validateStep(stepType);
                            break;
                        }
                    }
                }
            });
        });
    }

    initializeResetButtons() {
        document.querySelectorAll('.reset-btn-small').forEach(resetBtn => {
            resetBtn.addEventListener('click', () => {
                const stepsContainer = document.getElementById(this.currentMode + '-mode-steps');
                if (stepsContainer) {
                    stepsContainer.querySelectorAll('textarea').forEach(textarea => {
                        textarea.value = '';
                    });
                }

                // Don't clear localStorage completely, just reset form values for current mode
                this.saveToLocalStorage();

                // Reset generate buttons in current mode
                stepsContainer.querySelectorAll('.generate-copy-btn').forEach(btn => {
                    btn.textContent = 'GET PROMPT';
                    btn.disabled = true;
                });

                // Revalidate all steps in current mode
                this.stepTypes.forEach(stepType => this.validateStep(stepType));

                vscode.postMessage({ command: 'resetForm', mode: this.currentMode });
            });
        });
    }

    initializeStorage() {
        this.loadFromLocalStorage();
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', () => this.saveToLocalStorage());
        });
    }

    saveToLocalStorage() {
        try {
            // Get existing saved values or initialize empty object
            let allInputs = {};
            try {
                const savedValues = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (savedValues) {
                    allInputs = JSON.parse(savedValues);
                }
            } catch (e) {
                // If there's an error parsing saved values, start fresh
                allInputs = {};
            }

            // Update with current textarea values
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

    loadFromLocalStorage() {
        try {
            // Restore saved mode first
            const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
            if (savedMode) {
                this.switchMode(savedMode);
            }

            // Then restore form values
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

                // Validate all steps in both modes
                this.createStepTypes.forEach(stepType => this.validateStep(stepType));
                this.debugStepTypes.forEach(stepType => this.validateStep(stepType));
            }
        } catch (error) {
            logToExtension('Error loading from localStorage: ' + error, 'error');
        }
    }
}

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
            console.log('Received message:', message);
            this.handleMessage(message);
        });
    }

    handleMessage(message) {
        switch (message.command) {
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
                console.log('Unknown message command:', message.command);
        }
    }

    handlePromptGenerated({ step, content }) {
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
                generateButton.textContent = 'GET PROMPT';
                generateButton.disabled = false;
                this.formManager.validateStep(step);
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
                errorButton.textContent = 'GET PROMPT';
                this.formManager.validateStep(step);
            }, 2000);
        }
    }

    initializeGenerateButtons() {
        // Initialize all generate buttons for both create and debug modes
        const allStepTypes = [
            ...this.formManager.createStepTypes,
            ...this.formManager.debugStepTypes
        ];

        allStepTypes.forEach((stepType) => {
            const generateCopyButton = document.getElementById('generate-copy-' + stepType);
            if (generateCopyButton) {
                let isProcessing = false;
                generateCopyButton.addEventListener('click', async () => {
                    if (generateCopyButton.disabled || isProcessing) return;
                    isProcessing = true;
                    generateCopyButton.textContent = 'GENERATING...';
                    generateCopyButton.disabled = true;
                    try {
                        const inputData = this.collectInputData(stepType);
                        logToExtension('Generating prompt for ' + stepType);
                        vscode.postMessage({ command: 'generatePrompt', step: stepType, data: inputData });
                    } catch (error) {
                        logToExtension('Error preparing inputs: ' + (error.message || String(error)), 'error');
                        alert(error.message || 'Failed to prepare inputs');
                        generateCopyButton.textContent = 'ERROR - TRY AGAIN';
                        generateCopyButton.disabled = false;
                    } finally {
                        setTimeout(() => { isProcessing = false; }, 2100);
                    }
                });
            }
        });
    }

    collectInputData(stepType) {
        const inputData = {};
        switch(stepType) {
            // Create mode steps
            case 'request':
                this.validateAndCollect(inputData, {
                    'request-idea': 'INITIAL_IDEA'
                }, ['request-idea']);
                break;
            case 'spec':
                this.validateAndCollect(inputData, {
                    'spec-request': 'PROJECT_REQUEST',
                    'spec-rules': 'PROJECT_RULES',
                    'spec-template': 'REFERENCE_CODE'
                }, ['spec-request']);
                break;
            case 'planner':
                this.validateAndCollect(inputData, {
                    'planner-request': 'PROJECT_REQUEST',
                    'planner-spec': 'TECHNICAL_SPECIFICATION',
                    'planner-rules': 'PROJECT_RULES',
                    'planner-template': 'REFERENCE_CODE'
                }, ['planner-request', 'planner-spec']);
                break;
            case 'codegen':
                this.validateAndCollect(inputData, {
                    'codegen-request': 'PROJECT_REQUEST',
                    'codegen-spec': 'TECHNICAL_SPECIFICATION',
                    'codegen-plan': 'IMPLEMENTATION_PLAN',
                    'codegen-rules': 'PROJECT_RULES',
                    'codegen-code': 'EXISTING_CODE'
                }, ['codegen-request', 'codegen-spec', 'codegen-plan']);
                break;
            case 'review':
                this.validateAndCollect(inputData, {
                    'review-request': 'PROJECT_REQUEST',
                    'review-spec': 'TECHNICAL_SPECIFICATION',
                    'review-plan': 'IMPLEMENTATION_PLAN',
                    'review-code': 'EXISTING_CODE',
                    'review-rules': 'PROJECT_RULES'
                }, ['review-request', 'review-spec', 'review-plan', 'review-code']);
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
                }, ['observe-bug', 'observe-error', 'observe-repro', 'observe-env']);
                break;
            case 'orient':
                this.validateAndCollect(inputData, {
                    'orient-summary': 'ANALYSIS_SUMMARY',
                    'orient-clarifications': 'UPDATED_CLARIFICATIONS'
                }, ['orient-summary']);
                break;
            case 'decide':
                this.validateAndCollect(inputData, {
                    'decide-analysis': 'ANALYSIS_SUMMARY',
                    'decide-constraints': 'CONSTRAINTS_OR_RISKS'
                }, ['decide-analysis']);
                break;
            case 'act':
                this.validateAndCollect(inputData, {
                    'act-actions': 'CHOSEN_ACTIONS',
                    'act-implementation': 'IMPLEMENTATION_PLAN',
                    'act-success': 'SUCCESS_CRITERIA'
                }, ['act-actions', 'act-implementation', 'act-success']);
                break;
            default:
                throw new Error('Unknown step type');
        }
        return inputData;
    }

    validateAndCollect(inputData, fields, required) {
        for (const [elementId, dataKey] of Object.entries(fields)) {
            const element = document.getElementById(elementId);
            if (required.includes(elementId) && (!element?.value.trim())) {
                throw new Error('Please fill in all required fields.');
            }
            if (element) {
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
        window.onerror = function(message, source, lineno, colno, error) {
            logToExtension(message + ' at ' + source + ':' + lineno + ':' + colno, 'error');
            return true;
        };

        window.addEventListener('unhandledrejection', event => {
            logToExtension('Unhandled Promise rejection: ' + event.reason, 'error');
        });
    }
}

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
        const formManager = new FormManager(); // Creates instance, determines initial mode
        const messageHandler = new MessageHandler(formManager); // Sets up message handling

        // --- Set Initial Visual State ---
        logToExtension('Setting initial visual state for mode: ' + formManager.currentMode);

        // 1. Hide both mode containers initially
        const createModeSteps = document.getElementById('create-mode-steps');
        const debugModeSteps = document.getElementById('debug-mode-steps');
        if (createModeSteps) createModeSteps.style.display = 'none';
        if (debugModeSteps) debugModeSteps.style.display = 'none';

        // 2. Show the correct mode container
        const activeContainerId = formManager.currentMode + '-mode-steps';
        const activeContainer = document.getElementById(activeContainerId);
        if (activeContainer) {
            activeContainer.style.display = 'block';

            // 3. Hide all steps within the active container
            activeContainer.querySelectorAll('.step').forEach(step => {
                step.style.display = 'none';
            });

            // 4. Show only the first step within the active container
            const firstStep = activeContainer.querySelector('[data-step="1"]');
            if (firstStep) {
                firstStep.style.display = 'block';
                logToExtension('First step displayed for mode: ' + formManager.currentMode);
            } else {
                 logToExtension('Could not find first step for mode: ' + formManager.currentMode, 'error');
            }
        } else {
             logToExtension('Could not find active container: ' + activeContainerId, 'error');
        }

        // 5. Ensure navigation buttons are correctly initialized for the active mode/step
        formManager.initializeNavigation();

        // 6. Update mode toggle button appearance
        document.getElementById('create-mode').classList.toggle('active', formManager.currentMode === 'create');
        document.getElementById('debug-mode').classList.toggle('active', formManager.currentMode === 'debug');
        // --- End Initial Visual State ---


        logToExtension('Initialization complete via DOMContentLoaded.');
    } catch (error) {
        logToExtension('Error during DOMContentLoaded initialization: ' + error, 'error');
        console.error('Error during DOMContentLoaded initialization:', error);
    }
});
