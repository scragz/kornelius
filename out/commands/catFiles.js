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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catFiles = exports.runConcatenation = void 0;
const vscode = __importStar(require("vscode"));
const fsPromises = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const ignore_1 = __importDefault(require("ignore"));
async function runConcatenation() {
    try {
        const folders = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: "Select Directory"
        });
        if (!folders || folders.length === 0) {
            return; // user canceled
        }
        const directoryPath = folders[0].fsPath;
        // Load .gitignore if present
        const ig = (0, ignore_1.default)();
        // Add default patterns for common directories to ignore
        ig.add([
            '**/__pycache__/**',
            '**/node_modules/**',
            '**/.git/**',
            '**/.DS_Store',
            '**/dist/**',
            '**/build/**'
        ]);
        const gitignorePath = path.join(directoryPath, '.gitignore');
        try {
            await fsPromises.access(gitignorePath);
            const gitignoreContent = await fsPromises.readFile(gitignorePath, 'utf8');
            ig.add(gitignoreContent);
        }
        catch {
            console.log('.gitignore not found or unreadable, proceeding without it.');
        }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Concatenating Files",
            cancellable: false
        }, async (progress) => {
            progress.report({ message: "Scanning directory..." });
            const filePaths = await getAllFiles(directoryPath, ig, directoryPath);
            progress.report({ message: `Found ${filePaths.length} files. Reading files...`, increment: 10 });
            const fileContents = await readFilesWithProgress(filePaths, progress);
            const combined = fileContents.join('\n');
            const doc = await vscode.workspace.openTextDocument({
                content: combined,
                language: 'plaintext'
            });
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(`Concatenation complete. ${filePaths.length} files processed.`);
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error during concatenation: ${error}`);
        console.error(error);
    }
}
exports.runConcatenation = runConcatenation;
async function catFiles() {
    return runConcatenation();
}
exports.catFiles = catFiles;
async function getAllFiles(dir, ig, baseDir) {
    let results = [];
    try {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            // Use forward slashes for consistent path format across platforms
            const relative = path.relative(baseDir, fullPath).split(path.sep).join('/');
            // Skip if .gitignore rules say so
            if (ig.ignores(relative)) {
                continue;
            }
            if (entry.isDirectory()) {
                // Check directory name directly for common patterns
                if (entry.name === '__pycache__' || entry.name === 'node_modules' || entry.name === '.git') {
                    continue;
                }
                const subFiles = await getAllFiles(fullPath, ig, baseDir);
                results = results.concat(subFiles);
            }
            else if (entry.isFile()) {
                results.push(fullPath);
            }
        }
    }
    catch (err) {
        console.error(`Error reading directory ${dir}: ${err}`);
    }
    return results;
}
async function readFilesWithProgress(filePaths, progress) {
    const concurrencyLimit = 5;
    const total = filePaths.length;
    const results = new Array(total);
    let index = 0;
    async function processNext() {
        const currentIndex = index++;
        if (currentIndex >= total) {
            return;
        }
        const filePath = filePaths[currentIndex];
        try {
            const content = await fsPromises.readFile(filePath, 'utf8');
            results[currentIndex] = content;
        }
        catch (err) {
            console.error(`Error reading file ${filePath}: ${err}`);
            results[currentIndex] = '';
        }
        progress.report({
            increment: (1 / total) * 100,
            message: `Processed ${currentIndex + 1} of ${total} files`
        });
        await processNext();
    }
    const workers = [];
    for (let i = 0; i < concurrencyLimit && i < total; i++) {
        workers.push(processNext());
    }
    await Promise.all(workers);
    return results;
}
//# sourceMappingURL=catFiles.js.map