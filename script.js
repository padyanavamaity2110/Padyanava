const API_BASE_URL = 'https://8080-cs-1b6510d6-1baa-42d4-97d2-6447f0d617b4.cs-asia-southeast1-seal.cloudshell.dev';

async function sendMessage() {
    const userInput = document.getElementById('input');
    const message = userInput.value.trim();
    
    if (!message) return;
    
    renderMessage(message, 'user');
    userInput.value = '';
    
    try {
        // Use working CORS proxy
        const proxyResponse = await fetch('https://corsproxy.io/?' + encodeURIComponent(API_BASE_URL + '/chat'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: message,
                user_id: 'default'
            })
        });
        
        const data = await proxyResponse.json();
        renderMessage(data.reply, 'bot');
        
    } catch (error) {
        console.error('Error:', error);
        renderMessage('🔧 Setting up Velz... Try the local test above.', 'bot');
    }
}