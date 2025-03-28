import vscode from './vscodeApi.js';

/**
 * Sends a log message to the VS Code extension host.
 * @param {string | object} message - The message to log. Can be a string or an object (will be stringified).
 * @param {'log' | 'warn' | 'error'} level - The log level ('log', 'warn', or 'error'). Defaults to 'log'.
 */
export function logToExtension(message, level = 'log') {
    vscode.postMessage({
        command: level,
        message: typeof message === 'object' ? JSON.stringify(message) : String(message)
    });
}
