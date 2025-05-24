import * as vscode from 'vscode';
import { MultiLLMOrchestrator } from './orchestrator';
import { OllamaService } from './services/ollamaService';
import { ChatHistoryManager } from './chatHistory';
import { CodeReviewManager } from './features/codeReview';
import { SemanticCodeNavigator } from './features/codeNavigation';
import { ModelCollaborationManager } from './features/liveCollaboration';
import { TestGenerator } from './features/testGeneration';
import { ArchitectureVisualizer } from './features/architectureVisualizer'

export class CodeAssistant {
  // private orchestrator: MultiLLMOrchestrator;
  public chatHistory: ChatHistoryManager;
  public codeReview: CodeReviewManager;
  public navigator: SemanticCodeNavigator
  public collaboration: ModelCollaborationManager;
  public testGenerator: TestGenerator
  public visualizer: ArchitectureVisualizer;

  constructor(context: vscode.ExtensionContext) {
    const models = [
      new OllamaService('deepseek-r1:7b'),
      new OllamaService('opencoder:8b'),
      new OllamaService('llama3.1:8b')
    ];
      this.codeReview = new CodeReviewManager(this);
      this.navigator = new SemanticCodeNavigator(this);
      this.collaboration = new ModelCollaborationManager(this);
      this.testGenerator = new TestGenerator(this);
      this.visualizer = new ArchitectureVisualizer(this);
      this.chatHistory = new ChatHistoryManager(context);
  }

  async executeBrainstorm(prompt: string): Promise<void> {
    try {
      const response = await this.orchestrator.brainstorm(prompt);
      await this.applyCodeChanges(response);
      this.chatHistory.addEntry({
        type: 'brainstorm',
        prompt,
        response,
        timestamp: new Date(),
        models: this.orchestrator.lastUsedModels
      });
    } catch (error) {
      let errorMessage = 'Failed to brainstorm solution';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      vscode.window.showErrorMessage(errorMessage);
    }
  }

  private async applyCodeChanges(response: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const original = editor.document.getText();
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      editor.document.positionAt(0),
      editor.document.positionAt(original.length)
    );

    edit.replace(editor.document.uri, fullRange, response);
    await vscode.workspace.applyEdit(edit);
    
    await vscode.commands.executeCommand('editor.action.formatDocument');
    vscode.window.showInformationMessage('Code updated successfully!');
  }

  async handleChatMessage(prompt: string): Promise<string> {
    const response = await this.orchestrator.generateChatResponse(prompt);
    this.chatHistory.addEntry({
      type: 'chat',
      prompt,
      response,
      timestamp: new Date(),
      models: this.orchestrator.lastUsedModels
    });
    return response;
  }
}