# Project Name

## Project Description

A VS Code extension that helps developers write and manage AI-based dev prompts, using the existing prompt templates in the `prompts` directory. It provides a guided flow (request → spec → planner → codegen → review) through a dedicated sidebar panel with text areas for large amounts of context. Users can generate prompts, copy them to the clipboard, and optionally integrate Jina.ai Reader to retrieve markdown from provided URLs.

## Target Audience

- Developers who frequently use AI-based prompts and need a clear workflow
- Users wanting to utilize built-in prompt templates for consistent code generation patterns

## Desired Features

### Prompt Management

- [ ] Store prompt data in-memory or in a config file (not workspace settings)
  - [ ] Allow browsing and selecting from existing `prompts` directory files
- [ ] Collect user input in sidebar panels
  - [ ] Provide scrollable text areas for large contexts
  - [ ] Include “Generate” and “Copy to Clipboard” buttons

### Workflow Guidance

- [ ] Display a structured flow (request → spec → planner → codegen → review)
  - [ ] Show minimal instructions or tips for each step
  - [ ] Each step has its own button or form

### Integrations

- [ ] Optional Jina.ai Reader for retrieving markdown via API
  - [ ] Configure API key in extension settings
  - [ ] Show informative error messages if the call fails
- [ ] (Future) Read workspace directory/files for additional context as needed

## Design Requests

- [ ] Use a sidebar panel for the main UI
  - [ ] Follow accessible and minimal design principles
  - [ ] Provide clear feedback on validation or errors

## Other Notes

- No analytics needed
- Prompt templates are in the existing `c:\Src\monkey\prompts` folder
- Consider secure handling of any API keys
