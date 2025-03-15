/**
 * Debug logging utility for more detailed logs during development
 */

export class DebugLogger {
  private static logEnabled = true;
  private static logToFile = false;
  private static logQueue: string[] = [];

  /**
   * Initialize the logger with default settings
   */
  public static initialize(): void {
    this.logEnabled = true;
    this.logToFile = false;
    this.logQueue = [];
    this.log('DebugLogger initialized');
  }

  /**
   * Log messages with optional data objects
   */
  public static log(message: string, ...data: any[]): void {
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
  public static error(message: string, ...data: any[]): void {
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
  private static formatLogMessage(type: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${type}] ${message}`;
  }

  /**
   * Write the current log queue to a file
   */
  private static writeLogsToFile(): void {
    // This function would normally write logs to a file
    // But for simplicity, we'll just keep the logs in memory
    // and not actually write to a file
    console.log('Would write logs to file:', this.logQueue.length, 'entries');
  }

  /**
   * Enable or disable logging
   */
  public static setLogEnabled(enabled: boolean): void {
    this.logEnabled = enabled;
  }

  /**
   * Enable or disable logging to file
   */
  public static setLogToFile(enabled: boolean): void {
    this.logToFile = enabled;
  }

  /**
   * Get the current log queue
   */
  public static getLogQueue(): string[] {
    return [...this.logQueue];
  }

  /**
   * Clear the log queue
   */
  public static clearLogQueue(): void {
    this.logQueue = [];
  }
}
