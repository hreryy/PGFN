window.applyTheme = function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.innerHTML = (savedTheme === 'dark') ? '☀️' : '🌙';

    const container = document.getElementById('chat-messages');
    if (container) {
        container.innerHTML = `<div style="background:#444; color:white; padding:10px; border-radius:10px; margin:5px 0; align-self:flex-start; direction: rtl; text-align: right; unicode-bidi: plaintext; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-right: 4px solid #1bb1e7;">I'm here for you, ask me about networks</div>`;
    }
    window.initSidebarDropdowns();
};

window.toggleTheme = function() {
    let currentTheme = document.documentElement.getAttribute('data-theme');
    let newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.innerHTML = (newTheme === 'dark') ? '☀️' : '🌙';
};

window.openNav = function() { 
    document.getElementById("mySidebar").style.width = "300px"; 
};

window.closeNav = function() { 
    document.getElementById("mySidebar").style.width = "0"; 
};

window.initSidebarDropdowns = function() {
    const dropdowns = document.getElementsByClassName("dropdown-btn");
    for (let i = 0; i < dropdowns.length; i++) {
        dropdowns[i].onclick = function() {
            this.classList.toggle("active");
            const dropdownContent = this.nextElementSibling;
            if (dropdownContent) {
                dropdownContent.style.display = (dropdownContent.style.display === "block") ? "none" : "block";
            }
        };
    }
};

window.toggleChat = function() {
    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
        chatBox.style.display = (chatBox.style.display === 'none' || chatBox.style.display === '') ? 'flex' : 'none';
    }
};

window.copyToClipboard = function(text, btn) {
    const cleanText = text.replace(/^(bash|sh|ios|cisco|config)\n/i, '');
    const textArea = document.createElement("textarea");
    textArea.value = cleanText;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        const oldText = btn.innerText;
        btn.innerText = "Copied!";
        btn.style.background = "#28a745";
        setTimeout(() => {
            btn.innerText = oldText;
            btn.style.background = "#444";
        }, 2000);
    } catch (err) {
        console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
};

function formatBotResponse(text) {
    let blocks = [];
    const codeRegex = new RegExp('`{3}(?:[a-zA-Z]*\\n)?([\\s\\S]*?)`{3}', 'g');
    
    let safeText = text.replace(codeRegex, (match, code) => {
        const cleanCode = code.trim();
        const formattedBlock = `
            <div style="background: #1e1e1e; color: #00ff00; padding: 15px; border-radius: 8px; margin: 10px 0; font-family: monospace; position: relative; border-left: 4px solid #007bff; direction: ltr; text-align: left;">
                <button onclick="window.copyToClipboard(\`${cleanCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`, this)" style="position: absolute; right: 5px; top: 5px; background: #444; color: white; border: none; padding: 4px 8px; cursor: pointer; font-size: 10px; border-radius: 4px;">Copy</button>
                <code style="white-space: pre-wrap; display: block;">${cleanCode}</code>
            </div>`;
        blocks.push(formattedBlock);
        return `__CODE_BLOCK_${blocks.length - 1}__`;
    });

    safeText = safeText.replace(/\*\*/g, ''); 
    safeText = safeText.replace(/`/g, '');    
    safeText = safeText.replace(/\n/g, "<br>");

    blocks.forEach((block, index) => {
        safeText = safeText.replace(`__CODE_BLOCK_${index}__`, block);
    });

    return safeText;
}

function appendUserMessage(text) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    messages.innerHTML += `<div style="background:#007bff; color:white; padding:12px; border-radius:12px; margin:5px 0; align-self:flex-end; max-width:85%; word-wrap: break-word; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">${text}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

function appendBotMessage(text) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const formatted = formatBotResponse(text);
    messages.innerHTML += `<div style="background:#444; color:white; padding:12px; border-radius:12px; margin:5px 0; align-self:flex-start; max-width:85%; direction: rtl; text-align: right; unicode-bidi: plaintext; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-right: 4px solid #1bb1e7;">${formatted}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('user-input');
        if (document.activeElement === input) window.sendMessage();
    }
});

window.sendMessage = async function() {
    const input = document.getElementById('user-input');
    const container = document.getElementById('chat-messages');
    if (!input || !input.value.trim()) return;

    const userText = input.value.trim();
    appendUserMessage(userText);
    input.value = "";
    container.scrollTop = container.scrollHeight;

    const thinkingId = "thinking-" + Date.now();
    container.innerHTML += `<div id="${thinkingId}" style="background:#444; color:white; padding:10px; border-radius:10px; margin:5px 0; align-self:flex-start; font-size: 13px;">⏳ Thinking...</div>`;
    container.scrollTop = container.scrollHeight;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userMessage: userText })
        });

        const data = await response.json();
        const thinkingEl = document.getElementById(thinkingId);
        if (thinkingEl) thinkingEl.remove();

        if (data.reply) {
            appendBotMessage(data.reply);
        } else {
            container.innerHTML += `<div style="color:red; padding:10px;">⚠️ Error: ${data.error || 'Server error'}</div>`;
        }
    } catch (error) {
        const el = document.getElementById(thinkingId);
        if (el) el.innerText = "❌ Connection failed. Check your network.";
    }
    container.scrollTop = container.scrollHeight;
    
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.applyTheme === 'function') {
        window.applyTheme();
    }
});
};
