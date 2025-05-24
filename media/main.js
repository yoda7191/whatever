(function () {
    const vscode = acquireVsCodeApi();
    const messageList = document.getElementById('message-list');
    const messageInput = document.getElementById('message-input');
    
    // Handle message sending
    document.getElementById('send-button').addEventListener('click', () => {
        sendMessage();
    });

    // Handle brainstorm
    document.getElementById('brainstorm-button').addEventListener('click', () => {
        vscode.postMessage({ type: 'brainstorm' });
    });

    // Handle Enter key (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Handle incoming messages
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'addMessage':
                addMessage(message.content, message.isUser);
                break;
            case 'addCode':
                addCodeBlock(message.code, message.language);
                break;
        }
    });

    function sendMessage() {
        const content = messageInput.value.trim();
        if (content) {
            vscode.postMessage({ type: 'sendMessage', content });
            messageInput.value = '';
        }
    }

    function addMessage(content, isUser) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageEl.innerHTML = marked.parse(content); // Using marked.js for markdown
        messageList.appendChild(messageEl);
        messageList.scrollTop = messageList.scrollHeight;
    }

    function addCodeBlock(code, language) {
        const pre = document.createElement('pre');
        pre.className = 'code-block';
        pre.innerHTML = `<code class="language-${language}">${hljs.highlightAuto(code).value}</code>`;
        messageList.appendChild(pre);
        messageList.scrollTop = messageList.scrollHeight;
    }
})();