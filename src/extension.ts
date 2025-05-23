import * as vscode from 'vscode';
import WebSocket from 'ws';

interface WebviewMessage {
  type: 'prompt' | 'response' | 'error';
  content: string;
}

interface FileContext {
  path: string;
  content: string;
}

export function activate(context: vscode.ExtensionContext) {
  let webviewPanel: vscode.WebviewPanel | undefined;
  let wsClient: WebSocket | null = null;

  context.subscriptions.push(
    vscode.commands.registerCommand('chatWithOllama.start', () => {
      if (webviewPanel) {
        webviewPanel.reveal(vscode.ViewColumn.Two);
        return;
      }

      webviewPanel = vscode.window.createWebviewPanel(
        'chatWithOllama',
        'Chat with Ollama',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview-ui')]
        }
      );

      setupWebviewContent();
      connectToBackend();
      setupWebviewHooks();
    })
  );

  function setupWebviewContent() {
    if (!webviewPanel) return;

    const scriptUri = webviewPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'dist', 'main.js')
    );

    webviewPanel.webview.html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div id="root"></div>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  function connectToBackend() {
    wsClient = new WebSocket('ws://localhost:3001');
    
    wsClient.on('message', (data: WebSocket.Data) => {
      if (!webviewPanel) return;
      try {
        const message = JSON.parse(data.toString()) as WebviewMessage;
        webviewPanel.webview.postMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    wsClient.on('error', (error: Error) => {
      vscode.window.showErrorMessage(`Connection error: ${error.message}`);
    });

    wsClient.on('close', () => {
      vscode.window.showWarningMessage('Connection to Ollama server closed');
      webviewPanel?.dispose();
    });
  }

  function setupWebviewHooks() {
    if (!webviewPanel) return;

    webviewPanel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        if (message.type === 'prompt') {
          const files = await getSelectedFiles();
          wsClient?.send(JSON.stringify({
            prompt: message.content,
            files
          }));
        }
      },
      undefined,
      context.subscriptions
    );

    webviewPanel.onDidDispose(() => {
      webviewPanel = undefined;
      wsClient?.close();
      wsClient = null;
    });
  }

  async function getSelectedFiles(): Promise<FileContext[]> {
    const files: FileContext[] = [];
    
    try {
      // Get currently open files
      const openFiles = vscode.workspace.textDocuments;
      for (const doc of openFiles) {
        if (doc.uri.scheme === 'file') {
          files.push({
            path: doc.uri.fsPath,
            content: doc.getText()
          });
        }
      }

      // Get files from file explorer selection
      const selectedFiles = await vscode.window.showOpenDialog({
        canSelectMany: true,
        openLabel: 'Select Context Files'
      });

      if (selectedFiles) {
        for (const uri of selectedFiles) {
          const content = await vscode.workspace.fs.readFile(uri);
          files.push({
            path: uri.fsPath,
            content: Buffer.from(content).toString('utf-8')
          });
        }
      }

      return files;
    } catch (error) {
      console.error('Error getting files:', error);
      return [];
    }
  }
}

export function deactivate() {
  // Cleanup logic if needed
}