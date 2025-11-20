from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# SPECIFIC CORS for your GitHub Pages domain
CORS(app, origins=[
    "https://padyanavamaity2110.github.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
])

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://padyanavamaity2110.github.io')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

user_preferences = {}

def query_qwen_api(message):
    try:
        headers = {
            "Authorization": f"Bearer {os.environ.get('HF_TOKEN', 'YOUR_HF_TOKEN_HERE')}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [{"role": "user", "content": message}],
            "model": "Qwen/Qwen2.5-7B-Instruct:together",
            "max_tokens": 500,
            "temperature": 0.7
        }
        
        response = requests.post(
            "https://router.huggingface.co/v1/chat/completions",
            headers=headers, 
            json=payload, 
            timeout=30
        )
        data = response.json()
        return data["choices"][0]["message"]["content"]
        
    except Exception as e:
        logger.error(f"API error: {e}")
        return f"Hello! I'm Velz. You said: '{message}'"

@app.route('/chat', methods=['POST', 'GET', 'OPTIONS'])
def chat():
    try:
        if request.method == 'GET':
            return jsonify({'reply': 'Hello! I am Velz, your AI assistant. Send POST request with {"message": "your text"}'})
        
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'reply': 'Please provide a message'})
        
        if 'remember that' in user_message.lower():
            parts = user_message.lower().split('remember that')
            if len(parts) > 1:
                user_preferences['memory'] = parts[1].strip()
                return jsonify({'reply': f"✓ I've remembered: {parts[1].strip()}"})
        
        response = query_qwen_api(user_message)
        return jsonify({'reply': response})
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'reply': 'Sorry, I encountered an error'})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'active', 'service': 'Velz AI'})

@app.route('/')
def home():
    return jsonify({'message': 'Velz AI Server is running!'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)