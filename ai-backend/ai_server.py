from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from urllib.parse import quote_plus
import os
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=[
    "https://padyanavamaity2110.github.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
])

# QWEN API Configuration
API_URL = "https://router.huggingface.co/v1/chat/completions"

# Simple in-memory storage (no database setup needed)
user_preferences = {}
conversation_history = {}

def query_qwen_api(messages):
    """Call QWEN API with your Hugging Face token"""
    try:
        headers = {
            "Authorization": f"Bearer {os.environ.get('HF_TOKEN', 'your-huggingface-token-here')}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": messages,
            "model": "Qwen/Qwen2.5-7B-Instruct:together",
            "max_tokens": 500,
            "temperature": 0.7
        }
        
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        # Parse JSON and try several common response shapes to be robust
        data = response.json()
        # Typical HF chat response: { choices: [ { message: { content: ... } } ] }
        choices = data.get('choices') if isinstance(data, dict) else None
        if choices and isinstance(choices, list) and len(choices) > 0:
            first = choices[0]
            # new Chat API shape
            if isinstance(first, dict):
                msg = first.get('message') or {}
                if isinstance(msg, dict) and 'content' in msg:
                    return msg['content']
                # fall back to common 'text' key
                if 'text' in first:
                    return first['text']

        # As a last-resort, try a few other common keys
        if isinstance(data, dict) and 'generated_text' in data:
            return data['generated_text']

        # Log unexpected response for easier debugging
        logger.error('Unexpected QWEN response shape: %s', data)
        return None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"QWEN API request failed: {e}")
        return None
    except Exception as e:
        logger.error(f"QWEN API error: {e}")
        return None

def get_ai_response(message, user_id="default"):
    try:
        # Get user preferences for context
        prefs = user_preferences.get(user_id, {})
        prefs_text = ", ".join([f"{k}: {v}" for k, v in prefs.items()]) if prefs else "No preferences set"
        
        # Get conversation history for context
        history = conversation_history.get(user_id, [])
        
        # Build messages for QWEN API
        messages = [
            {
                "role": "system",
                "content": f"""You are Velz, a helpful and friendly AI assistant. You have a conversational tone and are here to assist the user.

User preferences to remember: {prefs_text}

Important: Your name is Velz. Never call yourself Jarvis or any other name.

Please respond naturally and helpfully. If the user asks you to remember something, acknowledge it."""
            }
        ]
        
        # Add conversation history (last 4 messages)
        for msg in history[-4:]:
            messages.append({
                "role": "assistant" if msg['role'] == 'assistant' else 'user',
                "content": msg['content']
            })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": message
        })
        
        # Call QWEN API
        ai_response = query_qwen_api(messages)
        
        if ai_response:
            # Save conversation to memory
            if user_id not in conversation_history:
                conversation_history[user_id] = []
            
            conversation_history[user_id].extend([
                {'role': 'user', 'content': message},
                {'role': 'assistant', 'content': ai_response}
            ])
            
            # Keep only last 10 messages to prevent memory overload
            conversation_history[user_id] = conversation_history[user_id][-10:]
            
            return ai_response
        else:
            return "I'm having trouble connecting to my AI brain right now. Please try again in a moment."
            
    except Exception as e:
        logger.error(f"AI response error: {e}")
        return "I'm experiencing some technical difficulties. Please try again."

def search_web(query):
    """Free web search using DuckDuckGo"""
    try:
        # URL-encode the query to avoid issues with special characters
        q = quote_plus(query)
        response = requests.get(f"https://api.duckduckgo.com/?q={q}&format=json", timeout=10)
        data = response.json()
        
        if data.get('AbstractText'):
            return data.get('AbstractText')
        related = data.get('RelatedTopics') or []
        if related and isinstance(related, list) and len(related) > 0:
            # RelatedTopics can be nested; attempt to find a 'Text' field
            first = related[0]
            if isinstance(first, dict) and 'Text' in first:
                return first['Text']
            # fallback if nested
            for item in related:
                if isinstance(item, dict) and 'Text' in item:
                    return item['Text']

        return f"I found web results for '{query}' but no clear answer. Try rephrasing."
    except:
        return "Unable to search web at the moment."

@app.route('/chat', methods=['POST', 'GET'])
def chat():
    try:
        if request.method == 'GET':
            return jsonify({
                'reply': 'Hello! I am Velz, your AI assistant powered by QWEN. How can I help you today?'
            })
        
        data = request.get_json()
        if not data:
            return jsonify({'reply': 'No data provided. Send JSON with {"message": "your text"}'}), 400
            
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id', 'default')
        
        if not user_message:
            return jsonify({'reply': 'Please provide a message'}), 400
        
        logger.info(f"Chat request from {user_id}: {user_message}")
        
        # Handle preference saving
        if 'remember that' in user_message.lower():
            parts = user_message.lower().split('remember that')
            if len(parts) > 1:
                preference = parts[1].strip()
                if user_id not in user_preferences:
                    user_preferences[user_id] = {}
                user_preferences[user_id]['memory'] = preference
                return jsonify({'reply': f"✓ I've remembered: {preference}"})
            else:
                return jsonify({'reply': "What would you like me to remember?"})
                
        elif 'my preferences' in user_message.lower() or 'what do you know about me' in user_message.lower():
            prefs = user_preferences.get(user_id, {})
            if prefs:
                prefs_text = "\n".join([f"• {k}: {v}" for k, v in prefs.items()])
                return jsonify({'reply': f"Here's what I know about you:\n{prefs_text}"})
            else:
                return jsonify({'reply': "I don't have any preferences saved yet. Tell me something about yourself!"})
        
        elif 'search for' in user_message.lower() or 'search' in user_message.lower():
            query = user_message.lower().replace('search for', '').replace('search', '').strip()
            web_result = search_web(query)
            return jsonify({'reply': web_result})
        
        else:
            # Get AI response
            response = get_ai_response(user_message, user_id)
            return jsonify({'reply': response})
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return jsonify({'reply': 'Sorry, I encountered an error. Please try again.'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'active', 
        'service': 'Velz AI Server',
        'version': '1.0'
    })

@app.route('/')
def home():
    return jsonify({
        'message': 'Velz AI Server is running!',
        'assistant_name': 'Velz',
        'endpoints': {
            'POST /chat': 'Send chat messages - expects {"message": "your text"}',
            'GET /health': 'Health check'
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)