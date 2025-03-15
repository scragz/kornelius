# Munky Technical Specification

## 1. System Overview
**Core Purpose**:
Munky is a VSCode extension that provides a guided flow (request → specification → planner → codegen → review) for managing AI prompt templates stored in `c:\Src\monkey\prompts`. It supports filling in template variables, generating prompt text, and copying to the clipboard. Optional Jina.ai integration retrieves markdown from user-provided URLs.

**Key Workflows**:
1. **Prompt Selection**: User chooses a file from the `prompts` directory or loads it by default.
2. **Form Completion**: The extension displays text areas for entering prompt variables or extra context.
3. **Generate & Copy**: The extension dynamically compiles the final prompt and allows the user to copy it.
4. **(Optional) Jina.ai Fetch**: If enabled and configured, the user can fetch remote markdown from URLs.

**System Architecture**:
- VSCode Extension using standard APIs for sidebar UI and commands.
- Minimal file-based storage for user data (via `storageUri`).
- Optional external call to Jina.ai Reader to retrieve remote markdown.

## 2. Project Structure
munky/
├── .vscode/                 # Workspace settings
│   ├── extensions.json      # Recommended extensions
│   ├── launch.json          # Debugging configuration
│   └── tasks.json           # Build tasks
├── src/                     # Source code
│   ├── commands/            # Command handlers
│   │   ├── generatePrompt.ts
│   │   ├── copyPrompt.ts
│   │   └── fetchMarkdown.ts
│   ├── utils/               # Helper functions
│   │   └── jinaReader.ts
│   ├── views/               # Webviews & UI
│   │   └── sidebarViewProvider.ts
│   ├── tests/               # Unit tests
│   │   ├── extension.test.ts
│   │   └── jinaReader.test.ts
│   ├── extension.ts         # Main extension entry point
│   ├── activate.ts          # Activation logic
│   └── deactivate.ts        # Cleanup logic
├── out/                     # Compiled output (ignored in Git)
├── package.json             # Extension metadata & dependencies
├── tsconfig.json            # TypeScript configuration
├── .eslintrc.js             # ESLint rules
├── .prettierrc              # Prettier formatting rules
├── .gitignore               # Ignore unnecessary files
├── .vscodeignore            # Ignore files from being packaged
├── README.md                # Documentation
├── CHANGELOG.md             # Version history
└── LICENSE                  # Open-source license

## 3. Feature Specification

### 3.1 Prompt Management
**User Story**: As a developer, I want to browse existing prompt templates and fill in placeholders using VSCode’s sidebar so that I can generate customized prompts.

- **Implementation Steps**:
  1. A sidebar view listing prompt files from `c:\Src\monkey\prompts`.
  2. Text areas for each required input or variable.
  3. “Generate” button compiles the template with user-provided data.
  4. “Copy to Clipboard” button to copy the final text.

- **Error Handling & Edge Cases**:
  - If prompts directory is empty or inaccessible, display a warning.
  - If placeholders do not match any known file, show a fallback message.

### 3.2 Structured Workflow
**User Story**: As a developer, I want to be guided through request → spec → planner → codegen → review steps, each having distinct forms or text areas.

- **Implementation Steps**:
  1. Create a multi-step form or tab-like interface in the sidebar.
  2. Provide quick tips or instructions for each step.
  3. Maintain state across steps (in memory or local file).

- **Error Handling & Edge Cases**:
  - If the user navigates away mid-step, preserve partial input.
  - If user does not fill required fields, allow partial completion or show warnings.

### 3.3 Jina.ai Integration (Optional)
**User Story**: As a developer, I want to retrieve markdown from external URLs via Jina.ai Reader so I can incorporate that content into my prompts.

- **Implementation Steps**:
  1. Create a module in `/utils/jinaReader.ts` with methods to call the Jina.ai API.
  2. Store the API key in extension settings (retrieved via `vscode.workspace.getConfiguration()`).
  3. Display an error message if the API call fails (e.g., network issues, invalid key).

- **Error Handling & Edge Cases**:
  - If no API key is provided, the UI should hide or disable Jina.ai features.
  - If the response is malformed or empty, show an appropriate error message.

### 3.4 Future Workspace File Context
**User Story**: Later, the extension might scan selected files or folders to add code snippets to the prompts.

- **Implementation Steps**:
  1. Provide additional commands or UI to select workspace files.
  2. Concatenate or transform file contents for prompt usage.
  3. Serve as an extended, optional feature.

- **Error Handling & Edge Cases**:
  - Large files could cause performance issues or memory overhead.
  - Non-text files are not useful for prompts—skip or warn.

## 4. Database Schema
- **No formal database**.
- All data is stored either in memory or in local file-based storage under `ExtensionContext.storageUri`.
- Consider storing “session data” as JSON, e.g. `storedPrompts.json`.

## 5. Server Actions

### 5.1 Database Actions
- **Not applicable** (local file storage, no traditional DB queries).

### 5.2 Other Actions
- **Jina.ai Reader**
  - Endpoint: `https://example.com/api/v1/reader` (placeholder).
  - Input parameters:
    - `apiKey` (string)
    - `urls` (string[])
  - Return:
    - Plain text or markdown snippets
  - Error handling:
    - Catch network errors, invalid key, response parsing.

## 6. Design System

### 6.1 Visual Style
- **Color Palette**: Inherit from VSCode default theme (light/dark).
- **Typography**: Use VSCode’s default fonts.
- **Component Styling**: Minimal.
- **Spacing & Layout**: Align elements in a clean vertical flow in the sidebar.

### 6.2 Core Components
- **Sidebar Panel**: Houses the main steps and forms.
- **Form Inputs**: Scrollable text areas for large content.
- **Message Panels**: Show warnings, errors, or success messages.
- **Buttons**: “Generate,” “Copy,” “Fetch from Jina.ai,” “Next Step.”

## 7. Component Architecture

### 7.1 Server Components
- Not applicable. No dedicated server.

### 7.2 Client Components
- **SidebarViewProvider**: Renders the multi-step UI.
  - State Management: store user inputs in memory or local file.
  - Event Handlers: handle button clicks to generate/copy prompt.
- **Commands**:
  - `extension.generatePrompt`: triggers the prompt generation function.
  - `extension.copyPrompt`: copies generated text to clipboard.

## 8. Authentication & Authorization
- **Jina.ai Key**:
  - Read from `vscode.workspace.getConfiguration("munky")` or a similar extension config.
  - No user login or token-based flow; the key suffices for optional calls.

## 9. Data Flow
1. **User interacts** with sidebar → user’s form inputs stored in memory/local file.
2. **User triggers generation** → merges user data with selected prompt template.
3. **User optionally calls Jina.ai** → if key is set, fetch remote markdown and include in final prompt.
4. **User copies** final prompt to clipboard or moves to next workflow step.

## 12. Testing
- **Unit Tests** (Mocha + Chai or Jest)
  - Test reading prompt templates, generating text, storing data.
  - Mock Jina.ai integration, simulating success/error responses.
- **Integration Tests**
  - Simulate user flows: select template, fill fields, generate prompt, copy to clipboard.
  - Confirm stable performance with large text areas or large prompt files.
