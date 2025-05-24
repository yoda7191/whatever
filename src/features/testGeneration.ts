import * as vscode from 'vscode';
import { CodeAssistant } from '../assistatnt';

export class TestGenerator {
    constructor(private _assistant: CodeAssistant) {} // Add proper constructor

    async generateTestsForSelection() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const code = editor.document.getText(editor.selection);
        const response = await this._assistant.handleChatMessage(
            `Generate test cases for this code:\n${code}\n\n` +
            'Include:\n- Edge cases\n- Error conditions\n- Performance tests\n' +
            'Format as:\n\`\`\`\n// Test code\n\`\`\`\n// Explanation'
        );

        this._showTestProposals(response);
    }

    private _showTestProposals(response: string) {
        const testMatch = response.match(/```[\s\S]*?\n([\s\S]*?)\n```/);
        if (testMatch) {
            const testCode = testMatch[1];
            const uri = vscode.Uri.parse('untitled:GeneratedTests.spec.ts');
            
            vscode.workspace.openTextDocument(uri).then(doc => {
                const edit = new vscode.WorkspaceEdit();
                edit.insert(uri, new vscode.Position(0, 0), testCode);
                vscode.workspace.applyEdit(edit).then(() => {
                    vscode.window.showTextDocument(doc);
                });
            });
        }
    }
}