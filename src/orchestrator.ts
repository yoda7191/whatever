import { OllamaService, LLMResponse } from './services/ollamaService';
import * as vscode from 'vscode';

export class MultiLLMOrchestrator {
  public lastUsedModels: string[] = [];
  private contextManager = new CodeContextManager();

  constructor(private models: OllamaService[]) {}

  async brainstorm(prompt: string): Promise<string> {
    const context = await this.contextManager.getFullContext();
    this.lastUsedModels = this.models.map(m => m.modelName);

    const responses = await Promise.all(
      this.models.map(model => model.generate(prompt, context))
    );

    const validResponses = responses.filter(r => r.success);
    if (validResponses.length === 0) {
      throw new Error('All models failed to respond');
    }

    return this.resolveConsensus(validResponses);
  }

  async generateChatResponse(prompt: string): Promise<string> {
    const context = await this.contextManager.getChatContext();
    const response = await this.models[0].generate(prompt, context);
    return response.content;
  }

  private resolveConsensus(responses: LLMResponse[]): string {
    // Advanced consensus algorithm
    const codeBlocks = responses.map(r => this.extractCode(r.content));
    const voteMap = new Map<string, number>();

    for (const code of codeBlocks) {
      const key = code.trim().replace(/\s+/g, ' ');
      voteMap.set(key, (voteMap.get(key) || 0) + 1);
    }

    const [mostCommon] = Array.from(voteMap.entries())
      .sort((a, b) => b[1] - a[1]);

    return mostCommon[0] || responses[0].content;
  }

  private extractCode(content: string): string {
    // Extract code blocks from response
    const codeBlocks = content.match(/```[^\n]*([\s\S]*?)```/g) || [content];
    return codeBlocks.map(block => 
      block.replace(/```[^\n]*/g, '').trim()
    ).join('\n\n');
  }
}

class CodeContextManager {
  async getFullContext(): Promise<string> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return '';

    const doc = editor.document;
    return `Current File (${doc.fileName}):
${doc.getText()}

Project Structure:
${await this.getProjectStructure()}

Cursor Position:
Line ${editor.selection.active.line + 1}, Column ${editor.selection.active.character + 1}`;
  }

  async getChatContext(): Promise<string> {
    return `VS Code Session Context:
${await this.getFullContext()}

Chat History:
${this.getRecentHistory()}`;
  }
    private async getProjectStructure(): Promise<string> {
    const files = await vscode.workspace.findFiles('**/*');
    return files.map((f: vscode.Uri) => f.path).join('\n');
    }
  private getRecentHistory(): string {
    // Implement history tracking
    return 'Last 5 messages...';
  }
}

