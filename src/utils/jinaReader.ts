import * as vscode from 'vscode';
import * as https from 'https';
import { URL } from 'url';
import * as dns from 'dns';
import * as ipaddr from 'ipaddr.js'; // We'll need to install this dependency
import { DebugLogger } from './debugLogger'; // Import DebugLogger

// Helper function to check if a hostname resolves to a private/reserved IP
async function isPrivateHost(hostname: string): Promise<boolean> {
  try {
    const { address } = await dns.promises.lookup(hostname);
    const ip = ipaddr.parse(address);
    // Check against common private/reserved ranges
    // Includes loopback, private ranges, link-local, unique local, carrier-grade NAT, benchmark, reserved
    const privateRanges: [string, number][] = [
      ['::1', 128], // Loopback IPv6
      ['fe80::', 10], // Link-local IPv6
      ['fc00::', 7], // Unique Local IPv6
      ['127.0.0.0', 8], // Loopback IPv4
      ['10.0.0.0', 8], // Private IPv4
      ['172.16.0.0', 12], // Private IPv4
      ['192.168.0.0', 16], // Private IPv4
      ['169.254.0.0', 16], // Link-local IPv4
      ['100.64.0.0', 10], // Carrier-grade NAT
      ['192.0.0.0', 24], // IETF Protocol Assignments
      ['192.0.2.0', 24], // TEST-NET-1
      ['198.51.100.0', 24], // TEST-NET-2
      ['203.0.113.0', 24], // TEST-NET-3
      ['192.88.99.0', 24], // 6to4 Relay Anycast
      ['198.18.0.0', 15], // Benchmarking
      ['224.0.0.0', 4], // Multicast
      ['240.0.0.0', 4]  // Reserved
    ];
    // Iterate through the ranges and check if the IP matches any of them
    for (const [rangeStr, prefix] of privateRanges) {
        try {
            // Parse the string range into an ipaddr object before matching
            const rangeAddr = ipaddr.parseCIDR(rangeStr + '/' + prefix);
            if (ip.match(rangeAddr)) {
                return true; // Matches a private/reserved range
            }
        } catch (parseError) {
            DebugLogger.error(`Failed to parse CIDR range: ${rangeStr}/${prefix}`, parseError);
            // Optionally continue checking other ranges or return true for safety
        }
    }
    return false; // Does not match any private/reserved range
  } catch (error) {
    DebugLogger.error(`DNS lookup failed for ${hostname}:`, error); // Use DebugLogger
    // Treat lookup failure as potentially unsafe
    return true;
  }
}


/**
 * Class to handle Jina.ai markdown fetching
 */
export class JinaReader {
  private _apiKey: string | undefined;

  constructor() {
    // Get the API key from VS Code settings
    this._apiKey = vscode.workspace.getConfiguration('kornelius').get<string>('jinaApiKey');
  }

  public isEnabled(): boolean {
    const enabled = vscode.workspace.getConfiguration('kornelius').get<boolean>('enableJinaIntegration');
    return Boolean(enabled && this._apiKey);
  }

  public async fetchMarkdown(url: string): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('Jina.ai integration is not enabled or missing API key. Configure it in settings.');
    }

    // --- Perform async validation *before* creating the promise ---
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      // If URL parsing fails, it's an immediate error
      throw new Error('Invalid URL format.');
    }

    // Validate scheme
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid URL scheme. Only http and https are allowed.');
    }

    // Validate hostname presence
    if (!parsedUrl.hostname) {
      throw new Error('URL must include a hostname.');
    }

    // Validate hostname resolution (async)
    if (await isPrivateHost(parsedUrl.hostname)) {
      // isPrivateHost handles its own errors and returns true if lookup fails or IP is private
      throw new Error('Fetching from private or reserved IP addresses is not allowed.');
    }
    // --- End async validation ---

    // Now create the promise for the HTTPS request
    return new Promise((resolve, reject) => {
      try {
        // Create request options using the validated URL
        const options = {
          hostname: 'r.jina.ai',
          path: '/' + parsedUrl.toString(), // Use the validated parsedUrl
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this._apiKey}`,
            'X-Md-Bullet-List-Marker': '-',
            'X-Md-Em-Delimiter': '*',
            'X-Return-Format': 'markdown',
            'X-With-Links-Summary': 'true'
          }
        };

        // Make the HTTPS request
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(data); // Success
            } else {
              // Request completed but with an error status code
              reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
            }
          });
        });

        // Handle errors during the request itself (e.g., network issues)
        req.on('error', (error) => {
          reject(new Error(`Request error: ${error.message}`));
        });

        // End the request (since it's GET, no body is sent)
        req.end();

      } catch (error) {
        // Catch synchronous errors during request setup (e.g., issues creating the request object)
        reject(new Error(`Failed to initiate fetch: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
  }
  // End of corrected fetchMarkdown function

  public static registerCommands(): vscode.Disposable {
    const fetchCommand = vscode.commands.registerCommand('kornelius.fetchJina', async () => {
      try {
        const reader = new JinaReader();
        if (!reader.isEnabled()) {
          const configureAction = 'Configure Settings';
          const result = await vscode.window.showErrorMessage(
            'Jina.ai integration is not enabled or missing API key.',
            configureAction
          );
          if (result === configureAction) {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'kornelius');
          }
          return;
        }

        const url = await vscode.window.showInputBox({
          prompt: 'Enter URL to fetch markdown from',
          placeHolder: 'https://example.com/article',
          validateInput: async (value) => { // Make validator async
            try {
              const testUrl = new URL(value);
              // Basic syntax check passed, now check scheme and host
              if (testUrl.protocol !== 'http:' && testUrl.protocol !== 'https:') {
                return 'Invalid scheme. Only http and https allowed.';
              }
              if (!testUrl.hostname) {
                 return 'URL must include a hostname.';
              }
              if (await isPrivateHost(testUrl.hostname)) {
                return 'Fetching from private or reserved IPs is not allowed.';
              }
              return null; // Valid
            } catch {
              return 'Please enter a valid URL format';
            }
          }
        });

        if (!url) return; // User cancelled

        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'Fetching markdown content...',
          cancellable: false
        }, async () => {
          const markdown = await reader.fetchMarkdown(url);

          const document = await vscode.workspace.openTextDocument({
            content: markdown,
            language: 'markdown'
          });

          await vscode.window.showTextDocument(document);
          await vscode.env.clipboard.writeText(markdown);
          vscode.window.showInformationMessage('Content fetched and copied to clipboard');
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Error fetching markdown: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    return fetchCommand;
  }
}
