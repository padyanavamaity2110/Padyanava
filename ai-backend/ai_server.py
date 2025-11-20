from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)

# Allow GitHub Pages domain + local testing
CORS(app, resources={r"/*": {"origins": [
    "https://padyanavaity2110.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
]}})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_msg = data.get("message", "")

    return jsonify({
        "reply": f"You said: {user_msg}"
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
