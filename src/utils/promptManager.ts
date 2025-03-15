// Remove unused import - we'll re-add this if we need vscode APIs
import * as fs from 'fs';
import * as path from 'path';

export interface PromptTemplate {
  name: string;
  fullPath: string;
  type: string; // 'request', 'spec', 'planner', 'codegen', 'review'
}

export class PromptManager {
  private _promptsDirectory: string;

  constructor() {
    this._promptsDirectory = 'c:\\Src\\kornelius\\prompts';
  }

  /**
   * Get all available prompt templates from the prompts directory
   */
  public async getPromptTemplates(): Promise<PromptTemplate[]> {
    try {
      const files = await fs.promises.readdir(this._promptsDirectory);

      return files
        .filter(file =>
          file.endsWith('.prompt') ||
          file.endsWith('.md') ||
          file.endsWith('.txt')
        )
        .map(file => {
          const fullPath = path.join(this._promptsDirectory, file);
          // Extract the "type" from the filename (e.g., "request.prompt" => "request")
          const type = path.basename(file, path.extname(file));

          return {
            name: file,
            fullPath,
            type
          };
        });
    } catch (error) {
      console.error('Error reading prompts directory:', error);
      throw new Error(`Failed to read prompts directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the content of a specific prompt template
   */
  public async getPromptContent(templatePath: string): Promise<string> {
    try {
      return await fs.promises.readFile(templatePath, 'utf-8');
    } catch (error) {
      console.error('Error reading prompt file:', error);
      throw new Error(`Failed to read prompt file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a final prompt by combining template with user inputs
   */
  public generatePrompt(templateContent: string, userInputs: Record<string, string>): string {
    let result = templateContent;

    // Replace placeholders in the format {{key}} with user input values
    for (const [key, value] of Object.entries(userInputs)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(placeholder, value);
    }

    return result;
  }

  /**
   * Save the generated prompt to a file
   */
  public async saveGeneratedPrompt(content: string, fileName: string): Promise<string> {
    try {
      const savePath = path.join(this._promptsDirectory, 'generated', fileName);

      // Ensure the 'generated' directory exists
      await fs.promises.mkdir(path.dirname(savePath), { recursive: true });

      // Write the file
      await fs.promises.writeFile(savePath, content, 'utf-8');

      return savePath;
    } catch (error) {
      console.error('Error saving generated prompt:', error);
      throw new Error(`Failed to save generated prompt: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
