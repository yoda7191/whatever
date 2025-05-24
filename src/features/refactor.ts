import * as vscode from 'vscode';
import { CodeAssistant } from '../assistant'

export class CodeRefactoring {
    constructor(private assistant: CodeAssistant) {}

    async refactorSelection() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const code = editor.document.getText(editor.selection);
        const response = await this.assistant.handleChatMessage(
            `Refactor this code following clean code principles:\n\`\`\`\n${code}\n\`\`\`\n` +
            'Provide only the refactored code without explanations'
        );

        const refactoredCode = this.extractCode(response);
        if (refactoredCode) {
            await editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, refactoredCode);
            });
        }
    }

    private extractCode(response: string): string | null {
        const match = response.match(/```[\s\S]*?\n([\s\S]*?)\n```/);
        return match ? match[1] : response;
    }
}