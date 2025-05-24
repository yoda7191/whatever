import * as vscode from 'vscode';
import { CodeAssistant } from '../assistant';

export class DocumentationGenerator {
    constructor(private assistant: CodeAssistant) {}

    async generateDocs() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const code = editor.document.getText();
        const response = await this.assistant.handleChatMessage(
            `Generate comprehensive documentation for this code:\n\`\`\`\n${code}\n\`\`\`\n` +
            'Format as markdown with sections: Overview, Functions, Types, Usage Examples'
        );

        this.showDocumentation(response);
    }

    private async showDocumentation(content: string) {
        const doc = await vscode.workspace.openTextDocument({
            content,
            language: 'markdown'
        });
        
        await vscode.window.showTextDocument(doc, {
            viewColumn: vscode.ViewColumn.Beside,
            preview: false
        });
    }
}