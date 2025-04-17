import vscode from './vscodeApi.js';

/**
 * Sends a log message to the VS Code extension host.
 * @param {string | object} message - The message to log. Can be a string or an object.
 * @param {'log' | 'warn' | 'error'} level - The log level ('log', 'warn', or 'error'). Defaults to 'log'.
 */
export function logToExtension(message, level = 'log') {
    try {
        // Support both 'log' and 'logMessage' commands for backward compatibility
        // But primarily use 'logMessage' as it's more specific
        vscode.postMessage({
            command: 'logMessage', // Dedicated command
            level: level,          // Pass level as data
            message: typeof message === 'object' ? JSON.stringify(message) : message // Ensure objects are stringified
        });
    } catch (error) {
        // Fallback to console if postMessage fails
        console.error('Error sending log to extension:', error);
        console[level](message);
    }
}
