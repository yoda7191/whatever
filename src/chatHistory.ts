import * as vscode from 'vscode';

interface ChatEntry {
  type: 'chat' | 'brainstorm';
  prompt: string;
  response: string;
  timestamp: Date;
  models: string[];
}

export class ChatHistoryManager {
  private history: ChatEntry[] = [];
  private storageKey = 'llm-assistant-history';

  constructor(private context: vscode.ExtensionContext) {
    this.loadHistory();
  }

  addEntry(entry: ChatEntry) {
    this.history.push(entry);
    this.saveHistory();
  }

  getRecentHistory(count = 5): ChatEntry[] {
    return this.history.slice(-count);
  }

  private saveHistory() {
    this.context.globalState.update(this.storageKey, this.history);
  }

  private loadHistory() {
    this.history = this.context.globalState.get<ChatEntry[]>(this.storageKey) || [];
  }
}