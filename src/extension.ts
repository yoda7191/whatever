import * as vscode from 'vscode';
import { CodeAssistant } from './assistant';
import { ChatViewProvider } from './chatView';
import { MultiLLMOrchestrator } from './orchestrator'

export  function activate(context: vscode.ExtensionContext) {
  const assistant = new CodeAssistant(context);
  const chatProvider = new ChatViewProvider(context, assistant);

context.subscriptions.push(
    vscode.commands.registerCommand('llm.securityReview', 
        () => assistant.codeReview.performSecurityReview()),
    vscode.commands.registerCommand('llm.generateTests', 
        () => assistant.testGenerator.generateTestsForSelection()),
    vscode.commands.registerCommand('llm.visualizeArch', 
        () => assistant.visualizer.visualizeProjectStructure()),
    vscode.commands.registerCommand('llm.startPairProgramming', 
        () => assistant.collaboration.startPairProgrammingSession())
);
    
    vscode.commands.registerCommand('llm.brainstorm', async () => {
      const prompt = await vscode.window.showInputBox({
        prompt: 'Enter your coding challenge:',
        placeHolder: 'e.g. "Implement a sorting algorithm"'
      });
      if (prompt) {
        await assistant.executeBrainstorm(prompt);
      }
    }),

    vscode.window.registerWebviewViewProvider(
      'llm-chat-view',
      chatProvider
    );
}

export function deactivate() {}