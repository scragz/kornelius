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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const debugLogger_1 = require("./debugLogger");
class PromptManager {
    constructor() {
        // Get extension context using the publisher.name format from package.json
        const extensionId = 'scragz.kornelius';
        debugLogger_1.DebugLogger.log(`Looking for extension with ID: ${extensionId}`);
        const extension = vscode.extensions.getExtension(extensionId);
        if (!extension) {
            const availableExtensions = vscode.extensions.all.map(ext => ext.id).join(', ');
            debugLogger_1.DebugLogger.error(`Could not find extension ${extensionId}. Available extensions: ${availableExtensions}`);
            throw new Error(`Could not find extension ${extensionId}`);
        }
        this._promptsDirectory = path.join(extension.extensionPath, 'prompts');
        debugLogger_1.DebugLogger.log('PromptManager initialized');
        debugLogger_1.DebugLogger.log('Extension path:', extension.extensionPath);
        debugLogger_1.DebugLogger.log('Prompt directory set to:', this._promptsDirectory);
        // Additional logging to help diagnose path issues
        try {
            if (fs.existsSync(this._promptsDirectory)) {
                debugLogger_1.DebugLogger.log('✓ Prompts directory exists');
                const promptFiles = fs.readdirSync(this._promptsDirectory);
                debugLogger_1.DebugLogger.log(`Found ${promptFiles.length} files in prompts directory:`, promptFiles);
            }
            else {
                debugLogger_1.DebugLogger.error('✗ Prompts directory does not exist at:', this._promptsDirectory);
                // Try to list parent directory to aid in debugging
                const parentDir = path.dirname(this._promptsDirectory);
                if (fs.existsSync(parentDir)) {
                    debugLogger_1.DebugLogger.log('Parent directory exists, contents:', fs.readdirSync(parentDir));
                }
            }
        }
        catch (error) {
            debugLogger_1.DebugLogger.error('Error checking prompts directory:', error);
        }
    }
    /**
     * Get all available prompt templates from the prompts directory
     */
    async getPromptTemplates() {
        debugLogger_1.DebugLogger.log('PromptManager.getPromptTemplates - Reading from filesystem');
        try {
            // Check if the prompts directory exists
            if (!fs.existsSync(this._promptsDirectory)) {
                debugLogger_1.DebugLogger.error(`Prompts directory does not exist: ${this._promptsDirectory}`);
                return [];
            }
            // Read all files in the prompts directory
            const files = fs.readdirSync(this._promptsDirectory);
            debugLogger_1.DebugLogger.log(`Found ${files.length} files in prompts directory:`, files);
            // Filter for .prompt files and create template objects
            const templates = [];
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
            debugLogger_1.DebugLogger.log(`Returning ${templates.length} prompt templates`);
            return templates;
        }
        catch (error) {
            debugLogger_1.DebugLogger.error('Error reading prompt templates:', error);
            return [];
        }
    }
    /**
     * Get the content of a specific prompt template
     */
    async getPromptContent(templatePath) {
        debugLogger_1.DebugLogger.log(`PromptManager.getPromptContent - Reading template from: ${templatePath}`);
        try {
            // Check if the template file exists
            if (!fs.existsSync(templatePath)) {
                debugLogger_1.DebugLogger.error(`Template file does not exist: ${templatePath}`);
                throw new Error(`Template file not found: ${templatePath}`);
            }
            // Read the template file
            const content = fs.readFileSync(templatePath, 'utf-8');
            debugLogger_1.DebugLogger.log(`Read template content, length: ${content.length} characters`);
            return content;
        }
        catch (error) {
            debugLogger_1.DebugLogger.error('Error reading template content:', error);
            throw error;
        }
    }
    /**
     * Generate a final prompt by combining template with user inputs
     */
    generatePrompt(templateContent, userInputs) {
        debugLogger_1.DebugLogger.log('PromptManager.generatePrompt - Replacing placeholders with user inputs');
        debugLogger_1.DebugLogger.log('PromptManager.generatePrompt - User inputs:', userInputs);
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
    _escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}
exports.PromptManager = PromptManager;
//# sourceMappingURL=promptManager.js.map