import * as vscode from 'vscode';
import { CodeAssistant } from './assistant';

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
    const webview = this.view?.webview!;
    const styleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles.css')
    );
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js')
    );

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>AI Coding Assistant</title>
        </head>
        <body>
            <div class="chat-container">
                <div class="message-list" id="message-list"></div>
                <div class="input-container">
                    <textarea id="message-input" placeholder="Ask the AI coding assistant..."></textarea>
                    <div class="button-group">
                        <button id="send-button" class="primary">
                            <span class="codicon codicon-send"></span> Send
                        </button>
                        <button id="brainstorm-button">
                            <span class="codicon codicon-lightbulb"></span> Brainstorm
                        </button>
                    </div>
                </div>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>
    `;
}
}
