// This file isolates the VS Code API acquisition
// @ts-expect-error because acquireVsCodeApi is not defined in a standard browser context, but is provided by VS Code webviews
const vscode = acquireVsCodeApi();

export default vscode;
