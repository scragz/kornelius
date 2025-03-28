import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { DebugLogger } from './debugLogger';

export interface PromptTemplate {
  name: string; // e.g., 'request.prompt'
  fullPath: string; // Full path to the prompt file
  type: string; // e.g., 'request', 'spec', 'observe', 'security', 'a11y'
  mode: 'create' | 'debug' | 'audit' | 'unknown'; // Mode associated with the prompt
}

export class PromptManager {
  private _promptsDirectory: string;

  constructor() {
    // Get extension context using the publisher.name format from package.json
    const extensionId = 'scragz.kornelius';
    DebugLogger.log(`Looking for extension with ID: ${extensionId}`);

    const extension = vscode.extensions.getExtension(extensionId);
    if (!extension) {
      const availableExtensions = vscode.extensions.all.map(ext => ext.id).join(', ');
      DebugLogger.error(`Could not find extension ${extensionId}. Available extensions: ${availableExtensions}`);
      throw new Error(`Could not find extension ${extensionId}`);
    }

    this._promptsDirectory = path.join(extension.extensionPath, 'prompts');

    DebugLogger.log('PromptManager initialized');
    DebugLogger.log('Extension path:', extension.extensionPath);
    DebugLogger.log('Prompt directory set to:', this._promptsDirectory);

    // Additional logging to help diagnose path issues
    try {
      if (fs.existsSync(this._promptsDirectory)) {
        DebugLogger.log('✓ Prompts directory exists');
        const promptFiles = fs.readdirSync(this._promptsDirectory);
        DebugLogger.log(`Found ${promptFiles.length} files in prompts directory:`, promptFiles);
      } else {
        DebugLogger.error('✗ Prompts directory does not exist at:', this._promptsDirectory);
        // Try to list parent directory to aid in debugging
        const parentDir = path.dirname(this._promptsDirectory);
        if (fs.existsSync(parentDir)) {
          DebugLogger.log('Parent directory exists, contents:', fs.readdirSync(parentDir));
        }
      }
    } catch (error) {
      DebugLogger.error('Error checking prompts directory:', error);
    }
  }

  /**
   * Get all available prompt templates from the prompts directory
   */
  public async getPromptTemplates(): Promise<PromptTemplate[]> {
    DebugLogger.log('PromptManager.getPromptTemplates - Reading from filesystem');

    try {
      // Check if the prompts directory exists
      if (!fs.existsSync(this._promptsDirectory)) {
        DebugLogger.error(`Prompts directory does not exist: ${this._promptsDirectory}`);
        return [];
      }

      // Define the mode subdirectories
      const modes: Array<'create' | 'debug' | 'audit'> = ['create', 'debug', 'audit'];
      const templates: PromptTemplate[] = [];

      // Iterate through each mode subdirectory
      for (const mode of modes) {
        const modeDirectory = path.join(this._promptsDirectory, mode);
        DebugLogger.log(`Checking mode directory: ${modeDirectory}`);

        if (fs.existsSync(modeDirectory)) {
          try {
            const files = fs.readdirSync(modeDirectory);
            DebugLogger.log(`Found ${files.length} files in ${mode} directory:`, files);

            // Filter for .prompt files and create template objects
            for (const file of files) {
              if (file.endsWith('.prompt')) {
                const fullPath = path.join(modeDirectory, file);
                const type = file.replace('.prompt', ''); // Get type from filename without extension
                templates.push({
                  name: file, // Keep original filename
                  fullPath,
                  type,
                  mode // Add the mode
                });
              }
            }
          } catch (modeError) {
            DebugLogger.error(`Error reading mode directory ${modeDirectory}:`, modeError);
          }
        } else {
          DebugLogger.log(`Mode directory does not exist: ${modeDirectory}`); // Changed warn to log
        }
      }

      // Also check the root prompts directory for any files that weren't moved (optional, for robustness)
      try {
        const rootFiles = fs.readdirSync(this._promptsDirectory);
        for (const file of rootFiles) {
            // Check if it's a file and ends with .prompt, and hasn't already been added
            const fullPath = path.join(this._promptsDirectory, file);
            if (fs.statSync(fullPath).isFile() && file.endsWith('.prompt') && !templates.some(t => t.fullPath === fullPath)) {
                const type = file.replace('.prompt', '');
                DebugLogger.log(`Found prompt file in root directory: ${file}. Adding with mode 'unknown'.`); // Changed warn to log
                templates.push({
                    name: file,
                    fullPath,
                    type,
                    mode: 'unknown' // Assign 'unknown' mode if found in root
                });
            }
        }
      } catch (rootError) {
         DebugLogger.error(`Error reading root prompts directory ${this._promptsDirectory}:`, rootError);
      }


      DebugLogger.log(`Returning ${templates.length} prompt templates from all scanned directories.`);
      return templates;
    } catch (error) {
      DebugLogger.error('Error reading prompt templates:', error);
      return [];
    }
  }

  /**
   * Get the content of a specific prompt template
   */
  public async getPromptContent(templatePath: string): Promise<string> {
    DebugLogger.log(`PromptManager.getPromptContent - Reading template from: ${templatePath}`);

    try {
      // Check if the template file exists
      if (!fs.existsSync(templatePath)) {
        DebugLogger.error(`Template file does not exist: ${templatePath}`);
        throw new Error(`Template file not found: ${templatePath}`);
      }

      // Read the template file
      const content = fs.readFileSync(templatePath, 'utf-8');
      DebugLogger.log(`Read template content, length: ${content.length} characters`);

      return content;
    } catch (error) {
      DebugLogger.error('Error reading template content:', error);
      throw error;
    }
  }

  /**
   * Generate a final prompt by combining template with user inputs
   */
  public generatePrompt(templateContent: string, userInputs: Record<string, string>): string {
    DebugLogger.log('PromptManager.generatePrompt - Replacing placeholders with user inputs');
    DebugLogger.log('PromptManager.generatePrompt - User inputs:', userInputs);

    let result = templateContent;

    // Replace all placeholders in the template with user inputs
    // Handle both single and double curly brace formats
    for (const [key, value] of Object.entries(userInputs)) {
      const doubleBracePlaceholder = `{{${key}}}`;

      // Replace double curly brace format
      result = result.replace(new RegExp(this._escapeRegExp(doubleBracePlaceholder), 'g'), value || '');
    }

    return result;
  }

  /**
   * Escape special characters in string for use in RegExp
   */
  private _escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
}
