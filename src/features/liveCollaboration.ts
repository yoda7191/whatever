import * as vscode from 'vscode';
import { CodeAssistant } from '../assistant';

declare const setTimeout: (handler: () => void, timeout?: number) => number;

export class ModelCollaborationManager {
    private _statusBar: vscode.StatusBarItem;
    private _activeSession: vscode.Disposable | undefined;

    constructor(private _assistant: CodeAssistant) {
        this._statusBar = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 100
        );
        this._statusBar.text = '$(hubot) LLM Session';
    }

    startPairProgrammingSession() {
        this._activeSession = vscode.workspace.onDidChangeTextDocument(async e => {
            if (e.contentChanges.length > 0) {
                this._statusBar.show();
                const suggestion = await this._getCodeSuggestion(e.document.getText());
                this._showInlineSuggestion(e.document, suggestion);
            }
        });
    }

    private async _getCodeSuggestion(code: string): Promise<string> {
        return this._assistant.handleChatMessage(
            `CODE CONTEXT:\n${code}\n\n` +
            'Suggest next logical code steps considering:\n' +
            '- Current project structure\n- Common patterns\n- Best practices\n' +
            'Respond with 3 suggestions in markdown format'
        );
    }

   private _showInlineSuggestion(document: vscode.TextDocument, suggestion: string) {
    const decoration = vscode.window.createTextEditorDecorationType({
        after: {
            contentText: suggestion.split('\n')[0],
            color: '#88888888',
            margin: '0 0 0 20px'
        }
    });


    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const line = editor.selection.active.line;
        const range = new vscode.Range(
            new vscode.Position(line, 0),
            new vscode.Position(line, 0)
        );
        
        editor.setDecorations(decoration, [{
            range,
            renderOptions: { 
                after: { 
                    contentText: suggestion 
                } 
            }
        }]);
        
        // Add proper NodeJS timeout typing
        setTimeout(() => decoration.dispose(), 5000);
    }
}
}