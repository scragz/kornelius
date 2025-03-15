import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { DebugLogger } from './debugLogger';

export interface PromptTemplate {
  name: string;
  fullPath: string;
  type: string; // 'request', 'spec', 'planner', 'codegen', 'review'
}

export class PromptManager {
  private _promptsDirectory: string;

  constructor() {
    // Get extension context using the publisher.name format from package.json
    const extensionId = 'kornelius.kornelius';
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
          DebugLogger.log(`Parent directory exists, contents:`, fs.readdirSync(parentDir));
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

      // Read all files in the prompts directory
      const files = fs.readdirSync(this._promptsDirectory);
      DebugLogger.log(`Found ${files.length} files in prompts directory:`, files);

      // Filter for .prompt files and create template objects
      const templates: PromptTemplate[] = [];
      for (const file of files) {
        if (file.endsWith('.prompt')) {
          const fullPath = path.join(this._promptsDirectory, file);
          const type = file.split('.')[0]; // Assuming filename format is 'type.prompt'
          templates.push({
            name: file,
            fullPath,
            type
          });
        }
      }

      DebugLogger.log(`Returning ${templates.length} prompt templates`);
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
      DebugLogger.error(`Error reading template content:`, error);
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
      result = result.replace(new RegExp(this.escapeRegExp(doubleBracePlaceholder), 'g'), value || '');
    }

    return result;
  }

  /**
   * Escape special characters in string for use in RegExp
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
}
