<img src="media/munky.png" width="200" height="200" alt="Munky playing guitar" />

# KoЯnelius

Kornelius is a Visual Studio Code extension for this vibe coding era designed to streamline AI prompt creation and context management.

## Features

- **Create Mode**: Guides users through a `REQUEST → SPEC → PLANNER → CODEGEN → REVIEW` process.
- **Debug Mode**: Implements an OODA `OBSERVE → ORIENT → DECIDE → ACT` loop for iterative debugging assistance.
- **Audit Mode**: Offers specialized prompts for comprehensive Security and Accessibility audits.
- **File Concatenation**: Easily include the content of selected files for contextual prompting.
- **Jina.ai Integration**: Optional capability to fetch markdown content using the Jina Reader API.

## Usage

1. Click the KoЯnelius icon in the activity bar.
2. Select a workflow (Standard, Debug, Audit).
3. Fill in the required details at each stage of the selected workflow.
4. Generated prompts are automatically copied to the clipboard for use with your preferred AI tool.

## Extension Settings

- `kornelius.enableJinaIntegration`: Enable/disable the Jina.ai integration
- `kornelius.jinaApiKey`: API key for Jina.ai integration (if enabled)
