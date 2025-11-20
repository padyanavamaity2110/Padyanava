// Cloudflare Worker for Velz AI
export default {
  async fetch(request, env) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      return jsonResponse({ status: 'active', service: 'Velz AI' });
    }

    // Chat endpoint
    if (url.pathname === '/chat') {
      if (request.method === 'GET') {
        return jsonResponse({ reply: 'Hello! I am Velz, your AI assistant. Send POST request with {"message": "your text"}' });
      }

      if (request.method === 'POST') {
        try {
          const { message, user_id = 'default' } = await request.json();
          
          if (!message) {
            return jsonResponse({ reply: 'Please provide a message' }, 400);
          }

          // Handle preferences in memory (for demo)
          if (message.toLowerCase().includes('remember that')) {
            const parts = message.toLowerCase().split('remember that');
            if (parts.length > 1) {
              // Store preference (in real app, use KV storage)
              return jsonResponse({ reply: `✓ I've remembered: ${parts[1].trim()}` });
            }
          }

          // Call QWEN API
          const aiResponse = await callQwenAPI(message, env.HF_TOKEN);
          return jsonResponse({ reply: aiResponse });

        } catch (error) {
          return jsonResponse({ reply: 'Sorry, I encountered an error' }, 500);
        }
      }
    }

    return jsonResponse({ message: 'Velz AI Server is running!' });
  },
};

// Helper function for JSON responses with CORS
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Call Hugging Face QWEN API
async function callQwenAPI(message, hfToken) {
  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        model: 'Qwen/Qwen2.5-7B-Instruct:together',
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('QWEN API error:', error);
    return `Hello! I'm Velz. You said: "${message}". (AI temporarily offline)`;
  }
}