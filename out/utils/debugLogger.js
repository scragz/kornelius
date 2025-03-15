"use strict";
/**
 * Debug logging utility for more detailed logs during development
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugLogger = void 0;
class DebugLogger {
    /**
     * Initialize the logger with default settings
     */
    static initialize() {
        this.logEnabled = true;
        this.logToFile = true; // Changed to true to ensure file logging is on after initialization
        this.logQueue = [];
        this.log('DebugLogger initialized');
    }
    /**
     * Log messages with optional data objects
     */
    static log(message, ...data) {
        if (!this.logEnabled) {
            return;
        }
        const formattedMessage = this.formatLogMessage('LOG', message);
        // Write to console
        console.log(formattedMessage);
        if (data.length > 0) {
            console.log(...data);
        }
        // Store in log queue for file output
        this.logQueue.push(formattedMessage + (data.length > 0 ? ' ' + JSON.stringify(data) : ''));
        // Optionally write to file
        if (this.logToFile) {
            this.writeLogsToFile();
        }
    }
    /**
     * Log error messages with optional data objects
     */
    static error(message, ...data) {
        if (!this.logEnabled) {
            return;
        }
        const formattedMessage = this.formatLogMessage('ERROR', message);
        // Write to console
        console.error(formattedMessage);
        if (data.length > 0) {
            console.error(...data);
        }
        // Store in log queue for file output
        this.logQueue.push(formattedMessage + (data.length > 0 ? ' ' + JSON.stringify(data) : ''));
        // Optionally write to file
        if (this.logToFile) {
            this.writeLogsToFile();
        }
    }
    /**
     * Format a log message with timestamp and type
     */
    static formatLogMessage(type, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${type}] ${message}`;
    }
    /**
     * Write the current log queue to a file
     */
    static writeLogsToFile() {
        // This function would normally write logs to a file
        // But for simplicity, we'll just keep the logs in memory
        // and not actually write to a file
        // console.log('Would write logs to file:', this.logQueue.length, 'entries');
    }
    /**
     * Enable or disable logging
     */
    static setLogEnabled(enabled) {
        this.logEnabled = enabled;
    }
    /**
     * Enable or disable logging to file
     */
    static setLogToFile(enabled) {
        this.logToFile = enabled;
    }
    /**
     * Get the current log queue
     */
    static getLogQueue() {
        return [...this.logQueue];
    }
    /**
     * Clear the log queue
     */
    static clearLogQueue() {
        this.logQueue = [];
    }
}
exports.DebugLogger = DebugLogger;
DebugLogger.logEnabled = true;
DebugLogger.logToFile = true; // Changed to true to enable file logging by default
DebugLogger.logQueue = [];
//# sourceMappingURL=debugLogger.js.map