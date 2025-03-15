# KoЯnelius Development Guide

This guide covers how to develop, test, and install the KoЯnelius extension.

## 🎸 Development Workflow

### Running in Development Mode

The simplest way to test the extension during development:

1. Open the KoЯnelius project in VS Code
2. Press `F5` or select "Run Extension" from the Run menu
3. This launches a new VS Code window with the extension loaded (Extension Development Host)
4. Changes you make to the code will require you to reload the development window
   (use the Reload command from the Command Palette)

### Package for Local Installation

To test the extension in your regular VS Code instance:

1. **Install vsce if you haven't already**:

   ```bash
   npm install -g @vscode/vsce
   ```

2. **Package the extension**:

   ```bash
   # From the root of the project
   vsce package
   ```

   This creates a `.vsix` file in the project root.

3. **Install the packaged extension**:

   ```bash
   code --install-extension kornelius-0.1.0.vsix
   ```

4. **Development/Installation Loop**:
   - Make changes to the code
   - Run `npm run compile` to compile the TypeScript
   - Run `vsce package` to create an updated VSIX
   - Run `code --install-extension kornelius-0.1.0.vsix` (overwrites previous installation)
   - Reload VS Code windows to see changes

## 🤘 Tips for Effective Development

1. **Use Watch Mode**:
   - Run `npm run watch` in a terminal to automatically compile TypeScript as you make changes

2. **Extension Debugging**:
   - Use `console.log()` statements to debug
   - Logs appear in the "Developer: Toggle Developer Tools" console when running the extension

3. **Extension Settings**:
   - Modify `package.json` "contributes" section to change commands, menus, views, and settings

4. **Clean Reinstall**:
   If you experience issues:

   ```bash
   # Remove the extension
   code --uninstall-extension kornelius

   # Reinstall from VSIX
   code --install-extension kornelius-0.1.0.vsix
   ```

## 🎧 Publishing to Marketplace (Future)

When ready to share with others:

1. Create a publisher account on the VS Code Marketplace
2. Update `publisher` in package.json
3. Run `vsce publish` (requires a Personal Access Token)

See [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) in the VS Code docs for details.
