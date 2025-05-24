import * as vscode from 'vscode';
import { CodeAssistant } from '../assistant';

export class SemanticCodeNavigator {
    private _contextMenu = vscode.commands.registerCommand(
        'llm.semanticSearch',
        async (uri: vscode.Uri, range: vscode.Range) => {
            const symbol = await this._getSymbolAtPosition(uri, range.start);
            if (symbol) {
                this._findRelatedCode(symbol.name);
            }
        }
    );

    private _findSymbolAtPosition(symbols: vscode.DocumentSymbol[], position: vscode.Position): vscode.DocumentSymbol | undefined {
        for (const symbol of symbols) {
            if (symbol.range.contains(position)) {
                return symbol;
            }
            if (symbol.children) {
                const childSymbol = this._findSymbolAtPosition(symbol.children, position);
                if (childSymbol) {
                    return childSymbol;
                }
            }
        }
    return undefined;
    }

    constructor(private _assistant: CodeAssistant) {}

    private async _getSymbolAtPosition(uri: vscode.Uri, position: vscode.Position) {
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            uri
        );
        return this._findSymbolAtPosition(symbols, position);
    }

    private async _findRelatedCode(symbolName: string) {
        const response = await this._assistant.handleChatMessage(
            `Find all related code for symbol: ${symbolName}\n` +
            'Consider:\n- Direct references\n- Type definitions\n- Similar patterns\n' +
            'Respond with file paths and line numbers in JSON format'
        );
        
        const results = JSON.parse(response);
        this._showResultsInQuickPick(results);
    }

    private _showResultsInQuickPick(results: any[]) {
        const items = results.map(result => ({
            label: `$(file-code) ${result.file}`,
            description: `Line ${result.line}: ${result.context}`,
            detail: result.preview,
            uri: vscode.Uri.file(result.file),
            line: result.line
        }));

        vscode.window.showQuickPick(items).then(selection => {
            if (selection) {
                vscode.window.showTextDocument(selection.uri, {
                    selection: new vscode.Range(
                        new vscode.Position(selection.line, 0),
                        new vscode.Position(selection.line, 100)
                    )
                });
            }
        });
    }
}