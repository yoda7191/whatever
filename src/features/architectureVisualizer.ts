import * as vscode from 'vscode';
import { CodeAssistant } from '../assistant';

export class ArchitectureVisualizer {
    private _panel: vscode.WebviewPanel | undefined;
    constructor(private _assistant: CodeAssistant) {}

    async visualizeProjectStructure() {
        const response = await this._assistant.handleChatMessage(
            'Analyze the project structure and generate a Mermaid diagram ' +
            'showing:\n- Module dependencies\n- Data flow\n- Key components'
        );

        this._showDiagram(response);
    }

    private _showDiagram(mermaidCode: string) {
        this._panel = vscode.window.createWebviewPanel(
            'archDiagram',
            'Project Architecture',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        this._panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
                <style>
                    .mermaid { padding: 20px; height: 95vh; }
                </style>
            </head>
            <body>
                <div class="mermaid">${mermaidCode}</div>
                <script>
                    mermaid.initialize({ startOnLoad: true });
                </script>
            </body>
            </html>
        `;
    }
}