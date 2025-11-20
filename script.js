// Configuration - UPDATE THIS AFTER DEPLOYMENT
const API_BASE_URL = 'http://localhost:5000'; // Change to your deployed backend URL

// DOM Elements
const chatEl = document.getElementById('chat');
const form = document.getElementById('chat-form');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const prefsBtn = document.getElementById('prefs-btn');
const prefsPanel = document.getElementById('prefs');
const closePrefsBtn = document.getElementById('close-prefs');
const saveHistoryCheckbox = document.getElementById('save-history');
const systemPromptEl = document.getElementById('system-prompt');

// Chat state
let history = [];
let isWaiting = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadPreferences();
    renderHistory();
    
    // Add welcome message if no history
    if (history.length === 0) {
        renderMessage("Hello! I'm your AI assistant. How can I help you today?", 'bot');
    }
});

// Load preferences from localStorage
function loadPreferences() {
    try {
        const p = JSON.parse(localStorage.getItem('chat_prefs') || '{}');
        if (p.saveHistory && p.history) {
            history = p.history;
        }
        if (saveHistoryCheckbox) {
            saveHistoryCheckbox.checked = p.saveHistory || false;
        }
        if (systemPromptEl && p.systemPrompt) {
            systemPromptEl.value = p.systemPrompt;
        }
    } catch (e) {
        console.warn('Preferences load failed', e);
    }
}

// Save preferences to localStorage
function savePrefs() {
    const p = { 
        saveHistory: saveHistoryCheckbox ? saveHistoryCheckbox.checked : false, 
        systemPrompt: systemPromptEl ? systemPromptEl.value : '' 
    };
    if (saveHistoryCheckbox && saveHistoryCheckbox.checked) {
        p.history = history;
    }
    localStorage.setItem('chat_prefs', JSON.stringify(p));
}

// UI helpers
function renderMessage(text, who = 'bot') {
    const el = document.createElement('div');
    el.className = 'msg ' + (who === 'user' ? 'user' : 'bot');
    el.textContent = text;
    chatEl.appendChild(el);
    chatEl.scrollTop = chatEl.scrollHeight;
}

function renderHistory() {
    chatEl.innerHTML = '';
    history.forEach(h => renderMessage(h.content, h.role));
}

function showLoading() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'msg bot loading';
    loadingEl.id = 'loading-msg';
    loadingEl.textContent = 'Thinking...';
    loadingEl.style.opacity = '0.7';
    loadingEl.style.fontStyle = 'italic';
    chatEl.appendChild(loadingEl);
    chatEl.scrollTop = chatEl.scrollHeight;
}

function hideLoading() {
    const loadingEl = document.getElementById('loading-msg');
    if (loadingEl) {
        loadingEl.remove();
    }
}

// API call to your AI backend
async function sendToApi(message) {
    const systemPrompt = systemPromptEl ? systemPromptEl.value.trim() : '';
    
    const payload = { 
        message: message,
        user_id: 'portfolio_user' // Fixed user ID for this portfolio
    };
    
    // Add system prompt if provided
    if (systemPrompt) {
        payload.system = systemPrompt;
    }
    
    try {
        const res = await fetch(API_BASE_URL + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`API error: ${res.status} - ${errorText}`);
        }
        
        const data = await res.json();
        return data;
        
    } catch (err) {
        console.error('API call failed:', err);
        return { 
            reply: '🔌 Connection issue - ' + 
                   (err.message || 'Ensure backend is running at ' + API_BASE_URL) 
        };
    }
}

// Form submit handler
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isWaiting) return;
        
        const text = input.value.trim();
        if (!text) return;

        // Show user message
        renderMessage(text, 'user');
        history.push({ role: 'user', content: text });
        
        // Clear input and disable
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;
        isWaiting = true;
        
        // Show loading
        showLoading();

        try {
            // Get AI response
            const data = await sendToApi(text);
            
            // Remove loading and show AI response
            hideLoading();
            
            if (data && data.reply) {
                renderMessage(data.reply, 'bot');
                history.push({ role: 'bot', content: data.reply });
            } else {
                throw new Error('Invalid response from AI');
            }
            
        } catch (error) {
            hideLoading();
            console.error('Chat error:', error);
            renderMessage('❌ Connection error - please try again', 'bot');
        } finally {
            // Re-enable input
            input.disabled = false;
            sendBtn.disabled = false;
            isWaiting = false;
            input.focus();
            
            // Save preferences if history saving is enabled
            savePrefs();
        }
    });
}

// Preferences panel toggle
if (prefsBtn && prefsPanel && closePrefsBtn) {
    prefsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prefsPanel.classList.toggle('hidden');
    });
    
    closePrefsBtn.addEventListener('click', () => {
        prefsPanel.classList.add('hidden');
        savePrefs();
    });
    
    // Save preferences when inputs change
    if (saveHistoryCheckbox) {
        saveHistoryCheckbox.addEventListener('change', savePrefs);
    }
    if (systemPromptEl) {
        systemPromptEl.addEventListener('input', savePrefs);
    }
}

// Enter key support and auto-focus
if (input) {
    input.focus();
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isWaiting) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    });
}

// Close preferences when clicking outside
document.addEventListener('click', (e) => {
    if (prefsPanel && !prefsPanel.classList.contains('hidden') &&
        !prefsPanel.contains(e.target) && 
        e.target !== prefsBtn) {
        prefsPanel.classList.add('hidden');
        savePrefs();
    }
});

// Input styling on focus
if (input) {
    input.addEventListener('focus', () => {
        input.style.borderColor = 'var(--accent)';
        input.style.background = 'rgba(0, 229, 255, 0.05)';
    });
    
    input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(255, 255, 255, 0.04)';
        input.style.background = 'transparent';
    });
}