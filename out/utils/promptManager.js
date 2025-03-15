"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptManager = void 0;
// Remove unused import - we'll re-add this if we need vscode APIs
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PromptManager {
    constructor() {
        this._promptsDirectory = 'c:\\Src\\kornelius\\prompts';
    }
    /**
     * Get all available prompt templates from the prompts directory
     */
    async getPromptTemplates() {
        try {
            const files = await fs.promises.readdir(this._promptsDirectory);
            return files
                .filter(file => file.endsWith('.prompt') ||
                file.endsWith('.md') ||
                file.endsWith('.txt'))
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
        }
        catch (error) {
            console.error('Error reading prompts directory:', error);
            throw new Error(`Failed to read prompts directory: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get the content of a specific prompt template
     */
    async getPromptContent(templatePath) {
        try {
            return await fs.promises.readFile(templatePath, 'utf-8');
        }
        catch (error) {
            console.error('Error reading prompt file:', error);
            throw new Error(`Failed to read prompt file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Generate a final prompt by combining template with user inputs
     */
    generatePrompt(templateContent, userInputs) {
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
    async saveGeneratedPrompt(content, fileName) {
        try {
            const savePath = path.join(this._promptsDirectory, 'generated', fileName);
            // Ensure the 'generated' directory exists
            await fs.promises.mkdir(path.dirname(savePath), { recursive: true });
            // Write the file
            await fs.promises.writeFile(savePath, content, 'utf-8');
            return savePath;
        }
        catch (error) {
            console.error('Error saving generated prompt:', error);
            throw new Error(`Failed to save generated prompt: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.PromptManager = PromptManager;
//# sourceMappingURL=promptManager.js.map