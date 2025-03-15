<brainstorming>

1. **Identify Key Requirements**
   - The project is a VS Code extension named “Kornelius,” which provides a guided flow for AI-based prompt creation.
   - We need to manage prompt templates from `c:\Src\kornelius\prompts`, generate prompts, optionally fetch markdown from Jina.ai, and provide a multi-step workflow (request → spec → planner → codegen → review).

2. **Outline Logical Development Stages**
   - **Stage A**: Create the basic scaffolding and configuration files (package.json, tsconfig, ESLint, Prettier, extension entry point).
   - **Stage B**: Implement the sidebar with a multi-step flow UI (request → spec → planner → codegen → review).
   - **Stage C**: Implement core prompt management (browse templates, generate prompts, copy to clipboard).
   - **Stage D**: Integrate Jina.ai (optional) for fetching external markdown content.
   - **Stage E**: Implement tests (unit tests and basic integration tests).
   - **Stage F**: Prepare for packaging and publishing.

3. **Constraints**
   - Each step should be small enough to be implemented without changing more than ~20 files.
   - Each step should have a clear title, dependencies, and user instructions if additional manual action is needed (e.g., installing packages).

4. **High-Level Considerations**
   - We’ll keep the extension’s main code in `src/`.
   - We’ll store large or session-based data in local file storage (`ExtensionContext.storageUri`) or just in memory if ephemeral usage is fine.
   - We’ll create a separate module for Jina.ai integration so it remains optional.
   - We’ll handle errors gracefully, especially for file I/O and network calls.

5. **Detailed Plan**
   - Each step will incrementally add or modify functionality.
   - The user can proceed step by step, ensuring the extension is testable at each phase.

</brainstorming>

# Implementation Plan

Below is a step-by-step plan for creating the Kornelius VS Code extension, as described. Each step is atomic and can be completed in a single iteration. Where necessary, additional user instructions are included.

---

## **1. Project Initialization & Configuration**

- [ ] **Step 1: Initialize the VS Code Extension Project**
  - **Task**:
    1. Create a new folder `kornelius` (if not already present).
    2. Initialize a `package.json` with the essential metadata.
    3. Add a `tsconfig.json` for TypeScript compilation.
    4. Add ESLint and Prettier configs to ensure code quality.
    5. Create a basic `README.md`, `CHANGELOG.md`, and `LICENSE`.
  - **Files** (fewer than 20, example listing):
    1. `kornelius/package.json`: Define `name`, `version`, `description`, `activationEvents`, and a sample command (`extension.helloWorld`).
    2. `kornelius/tsconfig.json`: Set `strict: true`, `outDir: "./out"`, and `rootDir: "./src"`.
    3. `kornelius/.eslintrc.js`: Include recommended rules for TypeScript.
    4. `kornelius/.prettierrc`: Define formatting preferences.
    5. `kornelius/README.md`: Placeholder readme.
    6. `kornelius/CHANGELOG.md`: Start versioning.
    7. `kornelius/LICENSE`: Project license file.
  - **Step Dependencies**: _None_ (first step).
  - **User Instructions**:
    - After creating these files, run `npm install` to install dependencies (e.g., `npm install --save-dev typescript @typescript-eslint/parser eslint prettier vsce vscode`).

---

## **2. Basic Extension Setup**

- [ ] **Step 2: Create Main Entry Points**
  - **Task**:
    1. Create the main entry file `extension.ts` that implements `activate()` and `deactivate()`.
    2. Register a basic “Hello World” command to confirm the extension loads.
    3. Configure the `.vscode/` folder with launch tasks for debugging.
  - **Files**:
    1. `src/extension.ts`
       - Initialize and export `activate`/`deactivate` functions.
       - Register command `kornelius.helloWorld`.
    2. `src/activate.ts` (optional if you keep all activation logic in `extension.ts`).
    3. `src/deactivate.ts` (optional if you prefer a separate cleanup file).
    4. `.vscode/launch.json`: Add configuration for debugging the extension (F5).
    5. `.vscode/tasks.json`: Add build tasks for TypeScript.
  - **Step Dependencies**: Step 1 (we need the project scaffolding first).
  - **User Instructions**:
    - Press `F5` in VS Code to run the extension in a new window.
    - Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run “Kornelius: Hello World” to verify it works.

---

## **3. Sidebar & Multi-Step Workflow Skeleton**

- [ ] **Step 3: Implement SidebarViewProvider**
  - **Task**:
    1. Create a `SidebarViewProvider` class in `src/views/sidebarViewProvider.ts`.
    2. Implement `resolveWebviewView()` to render a basic HTML skeleton.
    3. Register the sidebar in `package.json` under `contributes.views`, referencing an identifier like `"kornelius-sidebar"`.
    4. Provide minimal placeholders for the steps: request, spec, planner, codegen, review.
  - **Files**:
    1. `src/views/sidebarViewProvider.ts`:
       - Export a class extending `vscode.WebviewViewProvider`.
       - Render HTML with placeholders for the multi-step UI.
    2. `package.json`:
       - Add `"views"` contribution pointing to `"kornelius-sidebar"`.
    3. `src/extension.ts`:
       - Register the `SidebarViewProvider` in `activate()`.
  - **Step Dependencies**: Steps 1 & 2.
  - **User Instructions**:
    - Reload the extension and check the “Kornelius” sidebar in VS Code. You should see a minimal HTML interface.

- [ ] **Step 4: Add Basic Multi-Step Navigation**
  - **Task**:
    1. Within the sidebar HTML, create distinct sections or `div` containers for each workflow step.
    2. Add placeholder headings: “Request,” “Spec,” “Planner,” “Codegen,” “Review.”
    3. Include simple “Next Step” and “Previous Step” buttons to simulate navigation (client-side only for now).
  - **Files**:
    1. `src/views/sidebarViewProvider.ts`:
       - Update the `getHtmlForWebview()` (or equivalent method) to include mock HTML for the steps.
       - Add basic JavaScript to toggle visible sections.
  - **Step Dependencies**: Step 3.
  - **User Instructions**:
    - Reload the extension. Use the sidebar’s “Next Step” and “Previous Step” to confirm the basic multi-step flow is toggling sections.

---

## **4. Prompt Management**

- [ ] **Step 5: Implement Prompt Directory Browsing**
  - **Task**:
    1. Create logic to browse and read files from `c:\Src\kornelius\prompts`.
    2. Provide a dropdown or list in the sidebar to select a prompt template.
    3. Handle edge cases (no files, directory not found, etc.).
  - **Files**:
    1. `src/commands/browsePrompts.ts`:
       - Use Node’s `fs` or `fs/promises` to read directory contents.
       - Filter valid `.txt` or `.md` files if needed.
    2. `src/views/sidebarViewProvider.ts`:
       - Add UI elements for listing the available prompt templates.
       - Update the webview to display the list of file names.
    3. `src/utils/fileHelpers.ts` (optional):
       - Helper function for reading folder contents.
  - **Step Dependencies**: Steps 3 & 4 (we need the sidebar in place).
  - **User Instructions**:
    - If `c:\Src\kornelius\prompts` is not correct for your system, update the path.
    - Reload the extension; check if prompt templates are listed in the sidebar.

- [ ] **Step 6: Generate Prompt with User Input**
  - **Task**:
    1. Add text areas or input fields in each step of the workflow for collecting user data.
    2. When the user clicks “Generate,” merge the selected template with the provided inputs.
    3. Store the resulting prompt content in a variable or temporary storage.
  - **Files**:
    1. `src/commands/generatePrompt.ts`:
       - Logic to parse placeholders in the template and replace them with user inputs.
    2. `src/views/sidebarViewProvider.ts`:
       - HTML/JS to collect user input in text areas.
       - A “Generate” button that calls into `generatePrompt.ts`.
  - **Step Dependencies**: Step 5 (we need the selected prompt before we generate).
  - **User Instructions**:
    - Reload the extension, fill in sample data, click “Generate.”
    - Confirm a final prompt is created (log to console or show in the UI).

- [ ] **Step 7: Copy to Clipboard**
  - **Task**:
    1. Implement a “Copy to Clipboard” button to let users copy the generated prompt text.
    2. Use VS Code’s `env.clipboard.writeText()` API.
  - **Files**:
    1. `src/commands/copyPrompt.ts`:
       - Command that writes the generated prompt to the clipboard.
    2. `src/views/sidebarViewProvider.ts`:
       - HTML button that invokes `copyPrompt.ts`.
  - **Step Dependencies**: Step 6.
  - **User Instructions**:
    - Test the “Copy” button; verify that the prompt text is copied to your system clipboard.

---

## **5. Optional Jina.ai Integration**

- [ ] **Step 8: Implement Jina.ai Reader**
  - **Task**:
    1. Create a module `src/utils/jinaReader.ts` that sends a request to the Jina.ai endpoint to fetch markdown.
    2. Load the user’s API key from VS Code settings or environment variables.
    3. If the user has no valid API key, hide or disable the “Jina.ai Fetch” feature in the sidebar.
  - **Files**:
    1. `src/utils/jinaReader.ts`:
       - `fetchMarkdown(urls: string[]): Promise<string[]>` (example method signature).
    2. `src/views/sidebarViewProvider.ts`:
       - Add a “Fetch Markdown” button for each step or global usage if desired.
       - Show errors if requests fail.
  - **Step Dependencies**: Steps 1–7.
  - **User Instructions**:
    - Add your Jina.ai API key in the extension settings (`settings.json` or via `vscode.workspace.getConfiguration("kornelius")`).
    - Test by providing a URL. If successful, you’ll see fetched markdown.

---

## **6. Testing**

- [ ] **Step 9: Add Unit Tests**
  - **Task**:
    1. Install Mocha + Chai (or Jest) for testing.
    2. Create test files for core components:
       - `browsePrompts.ts`
       - `generatePrompt.ts`
       - `jinaReader.ts` (mocks for external calls)
    3. Validate that each function handles edge cases (e.g., no prompts, invalid placeholders, failed network calls).
  - **Files**:
    1. `src/tests/extension.test.ts`:
       - Basic test verifying extension activation.
    2. `src/tests/generatePrompt.test.ts`:
       - Unit tests for template generation logic.
    3. `src/tests/jinaReader.test.ts`:
       - Mocks network calls, checks error handling.
    4. `package.json`:
       - Add a `"test"` script, e.g. `"test": "mocha --require ts-node/register src/tests/**/*.test.ts"`.
  - **Step Dependencies**: Steps 1–8.
  - **User Instructions**:
    - Run `npm run test` in the extension’s root folder.
    - Confirm that all tests pass.

- [ ] **Step 10: Add Integration Tests**
  - **Task**:
    1. Write simple tests that simulate user flows (select prompt, fill data, generate, copy).
    2. Use the VS Code test runner or a headless approach if desired.
  - **Files**:
    1. `src/tests/integration.test.ts`
       - Mock user flows with test environment or minimal UI automation.
  - **Step Dependencies**: Step 9.
  - **User Instructions**:
    - Ensure you have the test runner properly configured in `.vscode/launch.json`.
    - Observe test logs to confirm the multi-step flow is stable.

---

## **7. Finalizing & Publishing**

- [ ] **Step 11: Prepare for Packaging**
  - **Task**:
    1. Review `package.json` for correct name, publisher, version, and `activationEvents`.
    2. Add or refine any needed icons or promotional metadata.
    3. Update `.vscodeignore` to exclude unwanted files from the final package.
  - **Files**:
    1. `package.json`:
       - Update fields for distribution.
    2. `.vscodeignore`:
       - Ensure test files, node_modules (except production dependencies), etc. are excluded.
  - **Step Dependencies**: Steps 1–10.
  - **User Instructions**:
    - Decide on versioning (e.g., `0.1.0` for alpha).

- [ ] **Step 12: Package & Publish**
  - **Task**:
    1. Use `vsce` to package the extension into a `.vsix`.
    2. Optionally publish to the VS Code Marketplace (requires a Publisher ID).
  - **Files**:
    1. **No new files**—just packaging the existing code.
  - **Step Dependencies**: Step 11.
  - **User Instructions**:
    - Ensure you have an account on the VS Code Marketplace.
    - Run `npx vsce package` to create `kornelius-x.x.x.vsix`.
    - Install locally using `code --install-extension kornelius-x.x.x.vsix`, or run `npx vsce publish` to publish globally.

---

## **Summary of the Overall Approach**

1. **Project Setup**: Start by creating a standard VS Code extension structure with TypeScript, ESLint, Prettier, and minimal scaffolding.
2. **Core Extension**: Implement the main entry point (`extension.ts`), set up commands, and enable debugging with `.vscode/` tasks and launch configs.
3. **Sidebar & Flow**: Develop a custom `SidebarViewProvider` that renders HTML for a multi-step UI (request → spec → planner → codegen → review).
4. **Prompt Management**: Let users browse and select templates from a local folder, fill data, generate prompts, and copy them.
5. **Optional Integrations**: Add Jina.ai markdown fetching if the user has an API key. Handle errors gracefully.
6. **Testing**: Introduce unit tests for commands and utilities, then add integration tests to simulate real user flows.
7. **Packaging & Publishing**: Finalize versioning, metadata, `.vscodeignore`, and either install locally or publish to the VS Code Marketplace.

By following these steps, you’ll achieve a well-structured, maintainable extension that covers the entire feature set: multi-step guided workflows, prompt template management, optional external integrations, and thorough testing.
