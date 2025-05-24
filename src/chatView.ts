import * as vscode from 'vscode';
import { CodeAssistant } from './assistatnt';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private context: vscode.ExtensionContext,
    private assistant: CodeAssistant
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getWebviewContent();

  interface WebviewMessage {
    type: string;
    content: string;
  }

  // Update the message handler
  webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
    if (message.type === 'sendMessage') {
      const response = await this.assistant.handleChatMessage(message.content);
      webviewView.webview.postMessage({
        type: 'addResponse',
        content: response
      });
    }
  });
}

  public createOrShowPanel() {
    if (!this.view) {
      vscode.window.showErrorMessage('Chat view not available');
      return;
    }
    this.view.show(true);
  }

  private getWebviewContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LLM Chat</title>
        <style>
          /* Add your styles here */
        </style>
      </head>
      <body>
        <div id="chat-container"></div>
        <input type="text" id="message-input" />
        <button id="send-button">Send</button>
        <script>
          (function() {
            const vscode = acquireVsCodeApi();
            // Add type-safe message handling
            document.getElementById('send-button').addEventListener('click', () => {
              const input = document.getElementById('message-input') as HTMLInputElement;
              vscode.postMessage({
                type: 'sendMessage',
                content: input.value
              });
              input.value = '';
            });
          })();
        </script>
      </body>
      </html>
    `;
  }
}
