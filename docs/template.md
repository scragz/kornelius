Here's a **VSCode Extension Starter Template** with **TypeScript**, **ESLint**, and **Prettier** configured. This template follows best practices and provides a solid foundation for extension development.

---

## **📂 Project Structure**
```
my-vscode-extension/
├── .vscode/                 # Workspace settings
│   ├── extensions.json      # Recommended extensions
│   ├── launch.json          # Debugging configuration
│   ├── tasks.json           # Build tasks
├── src/                     # Source code
│   ├── commands/            # Command handlers
│   ├── utils/               # Helper functions
│   ├── views/               # Webviews & UI
│   ├── tests/               # Unit tests
│   ├── extension.ts         # Main extension entry point
│   ├── activate.ts          # Activation logic
│   ├── deactivate.ts        # Cleanup logic
├── out/                     # Compiled output (ignored in Git)
├── package.json             # Extension metadata & dependencies
├── tsconfig.json            # TypeScript configuration
├── .eslintrc.js             # ESLint rules
├── .prettierrc              # Prettier formatting rules
├── .gitignore               # Ignore unnecessary files
├── .vscodeignore            # Ignore files from being packaged
├── README.md                # Documentation
├── CHANGELOG.md             # Version history
├── LICENSE                  # Open-source license
```

---

## **1️⃣ Install Prerequisites**
Before starting, ensure you have:
- **VSCode** installed.
- **Node.js 16+** installed.
- **Yeoman & VSCode Generator** (Optional, for scaffolding):
  ```sh
  npm install -g yo generator-code
  ```

---

## **2️⃣ Initialize Your Extension**
Run:
```sh
npx yo code
```
Select:
- **Type**: `New Extension (TypeScript)`
- **Name**: `my-vscode-extension`
- **Language**: `TypeScript`
- **Initialize Git**: Yes

OR manually create a folder and run:
```sh
mkdir my-vscode-extension && cd my-vscode-extension
npm init -y
```

---

## **3️⃣ Install Dependencies**
```sh
npm install --save vscode
npm install --save-dev typescript @types/node eslint prettier
```

---

## **4️⃣ Configure `package.json`**
Modify `package.json` to define commands and activation events:
```json
{
  "name": "my-vscode-extension",
  "displayName": "My VSCode Extension",
  "description": "A starter VSCode extension with TypeScript",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onCommand:extension.helloWorld"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "extension.helloWorld",
        "title": "Hello World"
      }
    ]
  },
  "scripts": {
    "compile": "tsc",
    "watch": "tsc --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src",
    "test": "node ./out/test/runTest.js",
    "package": "vsce package"
  },
  "devDependencies": {
    "@types/node": "^18",
    "typescript": "^5.0.0",
    "vscode": "^1.80.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "vsce": "^2.13.0"
  }
}
```

---

## **5️⃣ Configure TypeScript (`tsconfig.json`)**
```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "CommonJS",
    "lib": ["ES6"],
    "outDir": "./out",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

---

## **6️⃣ Configure ESLint (`.eslintrc.js`)**
```js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error"
  }
};
```

---

## **7️⃣ Configure Prettier (`.prettierrc`)**
```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

---

## **8️⃣ Implement the Extension (`src/extension.ts`)**
```ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello, VSCode Extension!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
```

---

## **9️⃣ Run & Debug**
1. Open the **Run and Debug** panel (`Ctrl+Shift+D`).
2. Select `Run Extension` and click **Start Debugging** (`F5`).
3. A new VSCode window opens—run the **"Hello World"** command.

---

## **🔟 Package & Publish**
### **Package the Extension**
```sh
npx vsce package
```
This creates a `.vsix` file.

### **Publish the Extension**
1. Log in to VSCode Marketplace:
   ```sh
   npx vsce login <your-publisher-name>
   ```
2. Publish:
   ```sh
   npx vsce publish
   ```

---

## **🎯 Next Steps**
✅ Add **unit tests** (`Mocha + Chai`)
✅ Add **Webviews** (for custom UI)
✅ Store **large user data** using `globalStorageUri`

Let me know if you need additional features! 🚀
