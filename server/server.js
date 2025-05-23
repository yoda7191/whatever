const WebSocket = require('ws');
const { ContextManager } = require('./context-manager');
const axios = require('axios');

class OllamaServer {
  constructor() {
    this.wss = new WebSocket.Server({ port: 3001 });
    this.contextManager = new ContextManager();
    this.conversationHistory = new Map();

    this.setupConnection();
  }

  setupConnection() {
    this.wss.on('connection', (ws) => {
      const sessionId = Date.now().toString();
      
      ws.on('message', async (message) => {
        try {
          const { prompt, files } = JSON.parse(message);
          const context = this.getContext(files);
          const history = this.conversationHistory.get(sessionId) || [];
          
          const response = await this.generateResponse(prompt, context, history);
          
          history.push({ role: 'user', content: prompt });
          history.push({ role: 'assistant', content: response });
          this.conversationHistory.set(sessionId, history);
          
          ws.send(JSON.stringify({ type: 'response', content: response }));
        } catch (error) {
          console.error('Error:', error);
          ws.send(JSON.stringify({ type: 'error', content: 'Failed to process request' }));
        }
      });

      ws.on('close', () => {
        this.conversationHistory.delete(sessionId);
      });
    });
  }

  async generateResponse(prompt, context, history) {
    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'llama2',
        prompt: this.formatPrompt(prompt, context, history),
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      });
      return response.data.response;
    } catch (error) {
      console.error('Ollama API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  formatPrompt(prompt, context, history) {
    return `
[SYSTEM CONTEXT]
${context}

[CONVERSATION HISTORY]
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

[USER PROMPT]
${prompt}

[ASSISTANT RESPONSE]
`.trim();
  }

  getContext(files = []) {
    const baseContext = this.contextManager.getContext();
    const fileContext = files.map(f => `FILE: ${f.path}\nCONTENT:\n${f.content}`).join('\n\n');
    return `${baseContext}\n${fileContext}`.slice(0, 8000);
  }
}

new OllamaServer();
console.log('Ollama server running on ws://localhost:3001');