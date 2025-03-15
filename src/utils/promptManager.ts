import * as fs from 'fs';
import * as path from 'path';
import { DebugLogger } from './debugLogger';

export interface PromptTemplate {
  name: string;
  fullPath: string;
  type: string; // 'request', 'spec', 'planner', 'codegen', 'review'
}

export class PromptManager {
  private _promptsDirectory: string;

  constructor() {
    // Get the extension's directory path
    // In production builds, __dirname would be something like:
    // c:\Users\username\.vscode\extensions\extension-name\dist
    const extensionRoot = path.resolve(path.dirname(require.main?.filename || ''), '../../..');
    this._promptsDirectory = path.join(extensionRoot, 'prompts');

    DebugLogger.log('PromptManager initialized');
    DebugLogger.log('Extension root directory determined as:', extensionRoot);
    DebugLogger.log('Prompt directory set to:', this._promptsDirectory);

    // Additional logging to help diagnose path issues
    try {
      if (fs.existsSync(this._promptsDirectory)) {
        console.log('✓ Prompts directory exists');
        const promptFiles = fs.readdirSync(this._promptsDirectory);
        console.log(`Found ${promptFiles.length} files in prompts directory:`, promptFiles);
      } else {
        console.error('✗ Prompts directory does not exist at:', this._promptsDirectory);

        // Try to list parent directory to aid in debugging
        const parentDir = path.dirname(this._promptsDirectory);
        if (fs.existsSync(parentDir)) {
          console.log(`Parent directory exists, contents:`, fs.readdirSync(parentDir));
        }
      }
    } catch (error) {
      console.error('Error checking prompts directory:', error);
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
    for (const [key, value] of Object.entries(userInputs)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    }

    return result;
  }
}
