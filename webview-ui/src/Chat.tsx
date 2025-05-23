import React, { useState, useEffect } from 'react';

declare const acquireVsCodeApi: () => {
  postMessage(message: unknown): void;
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const vscode = acquireVsCodeApi();

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'response') {
        setMessages(prev => [...prev, 
          { role: 'assistant', content: message.content }]);
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const sendMessage = () => {
    const trimmedInput = input.trim();
    if (trimmedInput) {
      vscode.postMessage({ type: 'prompt', content: trimmedInput });
      setMessages(prev => [...prev, { role: 'user', content: trimmedInput }]);
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="role-label">{msg.role}:</div>
            <pre>{msg.content}</pre>
          </div>
        ))}
      </div>
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;