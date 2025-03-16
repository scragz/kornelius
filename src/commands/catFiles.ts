import * as vscode from 'vscode';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import ignore from 'ignore';

export async function runConcatenation() {
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
    const ig = ignore();
    const gitignorePath = path.join(directoryPath, '.gitignore');
    try {
      await fsPromises.access(gitignorePath);
      const gitignoreContent = await fsPromises.readFile(gitignorePath, 'utf8');
      ig.add(gitignoreContent);
    } catch {
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
  } catch (error) {
    vscode.window.showErrorMessage(`Error during concatenation: ${error}`);
    console.error(error);
  }
}

export async function catFiles() {
  return runConcatenation();
}

async function getAllFiles(dir: string, ig: ignore.Ignore, baseDir: string): Promise<string[]> {
  let results: string[] = [];
  try {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relative = path.relative(baseDir, fullPath);
      // Skip if .gitignore rules say so
      if (ig.ignores(relative)) {
        continue;
      }
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, ig, baseDir);
        results = results.concat(subFiles);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err}`);
  }
  return results;
}

async function readFilesWithProgress(
  filePaths: string[],
  progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<string[]> {
  const concurrencyLimit = 5;
  const total = filePaths.length;
  const results: string[] = new Array(total);
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
    } catch (err) {
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
