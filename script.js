const API_BASE_URL = 'https://8080-cs-1b6510d6-1baa-42d4-97d2-6447f0d617b4.cs-asia-southeast1-seal.cloudshell.dev';

// Use CORS proxy to bypass browser restrictions
async function sendMessage() {
    const userInput = document.getElementById('input');
    const message = userInput.value.trim();
    
    if (!message) return;
    
    renderMessage(message, 'user');
    userInput.value = '';
    
    try {
        // Method 1: Try direct call first
        console.log('Trying direct connection...');
        const response = await fetch(API_BASE_URL + '/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: message,
                user_id: 'default'
            })
        });
        
        const data = await response.json();
        renderMessage(data.reply, 'bot');
        
    } catch (error) {
        console.log('Direct failed, trying CORS proxy...');
        
        // Method 2: Use CORS proxy (always works)
        try {
            const proxyResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(API_BASE_URL + '/chat')}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    user_id: 'default'
                })
            });
            
            const proxyData = await proxyResponse.json();
            renderMessage(proxyData.reply, 'bot');
            
        } catch (proxyError) {
            console.error('Proxy also failed:', proxyError);
            renderMessage('🔧 Velz is setting up... Try again in a moment.', 'bot');
        }
    }
}