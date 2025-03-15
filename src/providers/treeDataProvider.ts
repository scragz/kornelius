import * as vscode from 'vscode';

/**
 * Simple tree data provider implementation to ensure our sidebar
 * has a valid data provider.
 */
export class KorneliusTreeDataProvider implements vscode.TreeDataProvider<KorneliusItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<KorneliusItem | undefined | null | void> = new vscode.EventEmitter<KorneliusItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<KorneliusItem | undefined | null | void> = this._onDidChangeTreeData.event;

  // An empty placeholder item
  private items: KorneliusItem[] = [];

  constructor() {
    // Initialize with empty data - the actual UI is in the webview
    this.items = [];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: KorneliusItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: KorneliusItem): Thenable<KorneliusItem[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve(this.items);
    }
  }
}

export class KorneliusItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}
