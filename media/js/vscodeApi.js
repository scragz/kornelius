// This file isolates the VS Code API acquisition.
// Standard module behavior ensures this code runs only once.

// Declare vscode variable to hold the API
let vscode;

try {
    // Use the global acquireVsCodeApi function with a try-catch for safety
    // @ts-ignore - This suppresses TypeScript errors about the function not being recognized
    vscode = typeof acquireVsCodeApi === 'function' ? window['acquireVsCodeApi']() : null;

    // If we didn't get the API through direct call, try window object
    if (!vscode && typeof window !== 'undefined') {
        // @ts-ignore - This suppresses TypeScript errors
        vscode = typeof window.acquireVsCodeApi === 'function' ? window.acquireVsCodeApi() : null;
    }

    // If we still don't have it, throw an error to trigger the catch block
    if (!vscode) {
        throw new Error('Could not acquire VS Code API');
    }

    console.log('VS Code API acquired successfully');
} catch (error) {
    console.error('Failed to acquire VS Code API:', error);
    // Provide a mock API for testing/development outside of VS Code
    vscode = {
        postMessage: (msg) => console.log('[MOCK] postMessage:', msg),
        setState: (state) => console.log('[MOCK] setState:', state),
        getState: () => {
            console.log('[MOCK] getState called');
            return {};
        }
    };
    console.log('Using mock VS Code API.');
}

// Export the acquired or mock API object
export default vscode;
