import axios from 'axios';
import * as vscode from 'vscode';

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed: number;
  success: boolean;
}

export class OllamaService {
  private baseUrl = 'http://localhost:11434/api';
  private defaultOptions = {
    temperature: 0.7,
    top_p: 0.9,
    num_predict: 1024,
    system: `You are an expert programmer. Follow these rules:
1. Respond with clean, efficient code
2. Use modern best practices
3. Include relevant comments
4. Consider edge cases`
  };

  constructor(public modelName: string) {}

  async generate(prompt: string, context: string): Promise<LLMResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/generate`, {
        model: this.modelName,
        prompt: this.formatPrompt(prompt, context),
        ...this.defaultOptions
      });

      return {
        content: response.data.response,
        model: this.modelName,
        tokensUsed: response.data.eval_count,
        success: true
      };
    } catch (error) {
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        vscode.window.showErrorMessage(`${this.modelName} error: ${errorMessage}`);
        return {
            content: '',
            model: this.modelName,
            tokensUsed: 0,
            success: false
        };
    }
  }

  private formatPrompt(prompt: string, context: string): string {
    return `[CONTEXT]
${context}
[END CONTEXT]

[TASK]
${prompt}`;
  }
}