import * as vscode from 'vscode';
import { CodeAssistant } from '../assistatnt';

export class CodeReviewManager {
    private _decorator: vscode.TextEditorDecorationType;
    
    constructor(private _assistant: CodeAssistant) {
        this._decorator = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('editor.codeActionsBackground'),
            border: '1px solid #00ff0033',
            overviewRulerColor: 'rgba(0,255,0,0.3)'
        });
    }

    async performSecurityReview() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const code = editor.document.getText();
        const response = await this._assistant.handleChatMessage(
            `SECURITY REVIEW CONTEXT:\n${code}\n\n` +
            'Identify security vulnerabilities in this code. Respond in JSON format: ' +
            '{"issues": [{"line": number, "description": string, "severity": "high|medium|low"}]}'
        );

        try {
            const result = JSON.parse(response);
            this._showSecurityIssues(editor, result.issues);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to parse security review results');
        }
    }

    private _showSecurityIssues(editor: vscode.TextEditor, issues: any[]) {
        const decorations: vscode.DecorationOptions[] = [];
        
        issues.forEach(issue => {
            const line = editor.document.lineAt(issue.line - 1);
            const range = new vscode.Range(line.range.start, line.range.end);
            
            decorations.push({
                range,
                hoverMessage: `**${issue.severity.toUpperCase()} SEVERITY**\n${issue.description}`
            });
        });

        editor.setDecorations(this._decorator, decorations);
    }
}