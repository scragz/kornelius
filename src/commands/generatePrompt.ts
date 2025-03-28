import * as vscode from 'vscode';
import { PromptManager } from '../utils/promptManager';
import { DebugLogger } from '../utils/debugLogger';

/**
 * Interface representing user input data for prompt generation
 */
export interface PromptUserInputs {
  initialIdea?: string;
  projectRequest?: string;
  projectRules?: string;
  technicalSpecification?: string;
  implementationPlan?: string;
  referenceCode?: string;
  existingCode?: string;
  codeToAudit?: string; // Added for security/a11y audit steps
  [key: string]: string | undefined; // Add index signature to allow dynamic access
}

/**
 * Command to generate a prompt for a specific step and mode from a template and user inputs
 */
export async function generatePrompt(
  step: string, // e.g., 'request', 'spec', 'observe', 'security', 'a11y'
  mode: 'create' | 'debug' | 'audit' | 'unknown', // The current mode
  userInputs: PromptUserInputs
): Promise<string> {
  try {
    // Enhanced logging with file output
    DebugLogger.log('*******************************************');
    DebugLogger.log(`generatePrompt called for step: ${step}`);
    DebugLogger.log('User inputs:', userInputs);

    // Show message to user for debugging
    // vscode.window.showInformationMessage(`Generating prompt for: ${step}`);

    // Create prompt manager
    const promptManager = new PromptManager();

    // Get all templates (now includes mode)
    const templates = await promptManager.getPromptTemplates();

    // Find the template matching both the step type and the current mode
    DebugLogger.log(`Searching for template with type: ${step} and mode: ${mode}`);
    const matchingTemplate = templates.find(template => template.type === step && template.mode === mode);

    if (!matchingTemplate) {
      // Log available templates for debugging
      const availableTemplatesInfo = templates.map(t => `(${t.mode}/${t.type})`).join(', ');
      DebugLogger.error(`No template found for step: ${step} in mode: ${mode}. Available: ${availableTemplatesInfo}`);
      // Provide a more informative error message
      throw new Error(`No template found for step '${step}' in mode '${mode}'. Available templates: ${availableTemplatesInfo}`);
    }

    DebugLogger.log(`Found matching template: ${matchingTemplate.name} (mode: ${matchingTemplate.mode}) at ${matchingTemplate.fullPath}`);

    // Get the template content
    const templateContent = await promptManager.getPromptContent(matchingTemplate.fullPath);
    DebugLogger.log(`Loaded template content, length: ${templateContent.length} characters`);

    // Process the prompt with the appropriate placeholders
    return processPromptWithPlaceholders(step, templateContent, userInputs);
  } catch (error) {
    DebugLogger.error(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);
    vscode.window.showErrorMessage(`Failed to generate prompt: ${error instanceof Error ? error.message : String(error)}`);

    // Rethrow the error to ensure the webview gets the error message
    throw error;
  }
}

/**
 * Process the template content with the appropriate placeholders based on the step
 */
function processPromptWithPlaceholders(
  step: string,
  templateContent: string,
  userInputs: PromptUserInputs
): string {
  // Convert the structured user inputs to a flat record of key-value pairs
  const placeholderMap: Record<string, string> = {};

  DebugLogger.log(`Processing template for step: ${step}`);

  // Map appropriate values based on the current step
  switch (step) {
    case 'request':
      // For request step, use initialIdea
      placeholderMap['PROJECT_REQUEST'] = userInputs.initialIdea || '';
      break;

    case 'spec':
      // For spec step, use projectRequest, projectRules, referenceCode
      placeholderMap['PROJECT_REQUEST'] = userInputs.projectRequest || '';
      placeholderMap['PROJECT_RULES'] = userInputs.projectRules || '';
      placeholderMap['REFERENCE_CODE'] = userInputs.referenceCode || '';
      break;

    case 'planner':
      // For planner step, use projectRequest, projectRules, technicalSpecification, referenceCode
      placeholderMap['PROJECT_REQUEST'] = userInputs.projectRequest || '';
      placeholderMap['PROJECT_RULES'] = userInputs.projectRules || '';
      placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.technicalSpecification || '';
      placeholderMap['REFERENCE_CODE'] = userInputs.referenceCode || '';
      break;

    case 'codegen':
      // For codegen step, use projectRequest, projectRules, technicalSpecification, implementationPlan, existingCode
      placeholderMap['PROJECT_REQUEST'] = userInputs.projectRequest || '';
      placeholderMap['PROJECT_RULES'] = userInputs.projectRules || '';
      placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.technicalSpecification || '';
      placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.implementationPlan || '';
      placeholderMap['EXISTING_CODE'] = userInputs.existingCode || '';
      break;

    case 'review':
      // For review step, use projectRequest, projectRules, technicalSpecification, implementationPlan, existingCode
      placeholderMap['PROJECT_REQUEST'] = userInputs.projectRequest || '';
      placeholderMap['PROJECT_RULES'] = userInputs.projectRules || '';
      placeholderMap['TECHNICAL_SPECIFICATION'] = userInputs.technicalSpecification || '';
      placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.implementationPlan || '';
      placeholderMap['EXISTING_CODE'] = userInputs.existingCode || '';
      break;

    // Handle specific audit steps which might have different placeholder needs
    case 'security': // Assuming step is 'security' when mode is 'audit'
      // Placeholder for security audit - adjust if needed
      placeholderMap['CODE_TO_AUDIT'] = userInputs.codeToAudit || ''; // Example placeholder
      break;
    case 'a11y': // Assuming step is 'a11y' when mode is 'audit'
      // Placeholder for accessibility audit - adjust if needed
      placeholderMap['CODE_TO_AUDIT'] = userInputs.codeToAudit || ''; // Example placeholder
      break;

    // Debug mode steps
    case 'observe':
      placeholderMap['BUG_DESCRIPTION'] = userInputs.bugDescription || '';
      placeholderMap['ERROR_MESSAGES'] = userInputs.errorMessages || '';
      placeholderMap['REPRO_STEPS'] = userInputs.reproSteps || '';
      placeholderMap['ENV_DETAILS'] = userInputs.envDetails || '';
      placeholderMap['USER_FEEDBACK'] = userInputs.userFeedback || '';
      placeholderMap['ADDITIONAL_EVIDENCE'] = userInputs.additionalEvidence || '';
      break;
    case 'orient':
      placeholderMap['ANALYSIS_SUMMARY'] = userInputs.analysisSummary || '';
      placeholderMap['UPDATED_CLARIFICATIONS'] = userInputs.updatedClarifications || '';
      break;
    case 'decide':
      placeholderMap['ANALYSIS_SUMMARY'] = userInputs.analysisSummary || '';
      placeholderMap['CONSTRAINTS_OR_RISKS'] = userInputs.constraintsOrRisks || '';
      break;
    case 'act':
      placeholderMap['CHOSEN_ACTIONS'] = userInputs.chosenActions || '';
      placeholderMap['IMPLEMENTATION_PLAN'] = userInputs.implementationPlan || '';
      placeholderMap['SUCCESS_CRITERIA'] = userInputs.successCriteria || '';
      break;

    default:
      // Fallback for any steps not explicitly handled
      DebugLogger.log(`[Warning] Unhandled step in processPromptWithPlaceholders: ${step}. Attempting direct input mapping.`);
      // Attempt to map camelCase keys from userInputs to SCREAMING_SNAKE_CASE
      Object.keys(userInputs).forEach(key => {
        // Convert camelCase key to SCREAMING_SNAKE_CASE for the placeholder map
        const placeholderKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
        placeholderMap[placeholderKey] = userInputs[key] || '';
      });
  }

  DebugLogger.log('Placeholder map:', placeholderMap);

  // Create a new prompt manager to generate the prompt
  const promptManager = new PromptManager();
  const generatedPrompt = promptManager.generatePrompt(templateContent, placeholderMap);

  DebugLogger.log(`Generated prompt for step ${step}, length: ${generatedPrompt.length} characters`);

  return generatedPrompt;
}
