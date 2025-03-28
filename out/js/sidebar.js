import { FormManager } from './formManager.js';
import { MessageHandler } from './messageHandler.js';
import { logToExtension } from './sidebarUtils.js';

// Initialize everything as soon as document is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        logToExtension('DOMContentLoaded event fired.');
        const formManager = new FormManager(); // Creates instance, determines initial mode via constructor logic
        new MessageHandler(formManager); // Sets up message handling

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
