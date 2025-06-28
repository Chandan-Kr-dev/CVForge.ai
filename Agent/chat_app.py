"""
Simple Web Chat Interface for CVForge.ai Resume Agent

A basic HTML interface to interact with the resume agent via the API.
"""

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import httpx
import json
from typing import Optional

# This would be imported in a real application
# For this demo, we'll create a simple standalone version

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CVForge.ai Resume Agent</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .chat-container {
            height: 500px;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .message {
            margin-bottom: 15px;
            padding: 12px 16px;
            border-radius: 8px;
            max-width: 80%;
        }
        .user-message {
            background: #007bff;
            color: white;
            margin-left: auto;
        }
        .agent-message {
            background: white;
            border: 1px solid #e9ecef;
        }
        .input-area {
            padding: 20px;
            border-top: 1px solid #e9ecef;
        }
        .input-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        input[type="text"], textarea {
            flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background: #0056b3;
        }
        .resume-json {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin-top: 10px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
        }
        .ats-score {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 6px;
            padding: 10px;
            margin-top: 10px;
        }
        .suggestions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 10px;
            margin-top: 10px;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 CVForge.ai Resume Agent</h1>
            <p>Your AI-powered resume consultant</p>
        </div>
        
        <div class="chat-container" id="chatContainer">
            <div class="message agent-message">
                <strong>Agent:</strong> Hello! I'm your AI resume consultant. I can help you generate personalized resumes, calculate ATS scores, and provide improvement suggestions. To get started, please enter your user ID and feel free to ask me anything!
            </div>
        </div>
        
        <div class="input-area">
            <div class="input-row">
                <input type="text" id="userId" placeholder="Enter your user ID" required>
                <input type="text" id="conversationId" placeholder="Conversation ID (optional)" readonly>
            </div>
            <div class="input-row">
                <textarea id="jobDescription" placeholder="Job description (optional - paste here if you want to generate a resume)" rows="3"></textarea>
            </div>
            <div class="input-row">
                <input type="text" id="messageInput" placeholder="Type your message here..." required>
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
    </div>

    <script>
        let conversationId = null;

        function addMessage(content, isUser = false, data = null) {
            const chatContainer = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user-message' : 'agent-message'}`;
            
            let messageContent = `<strong>${isUser ? 'You' : 'Agent'}:</strong> ${content}`;
            
            if (data) {
                if (data.resume_json) {
                    messageContent += `<div class="resume-json"><strong>Generated Resume JSON:</strong><br><pre>${JSON.stringify(data.resume_json, null, 2)}</pre></div>`;
                }
                
                if (data.ats_score) {
                    messageContent += `<div class="ats-score">
                        <strong>ATS Score:</strong> ${(data.ats_score.final_score * 100).toFixed(1)}%<br>
                        <strong>Semantic:</strong> ${(data.ats_score.semantic_score * 100).toFixed(1)}% | 
                        <strong>Keywords:</strong> ${(data.ats_score.keyword_score * 100).toFixed(1)}%
                        ${data.ats_score.missing_keywords && data.ats_score.missing_keywords.length > 0 ? 
                          `<br><strong>Missing Keywords:</strong> ${data.ats_score.missing_keywords.join(', ')}` : ''}
                    </div>`;
                }
                
                if (data.suggestions && data.suggestions.length > 0) {
                    messageContent += `<div class="suggestions">
                        <strong>Suggestions:</strong><br>
                        ${data.suggestions.map(s => `• ${s}`).join('<br>')}
                    </div>`;
                }
            }
            
            messageDiv.innerHTML = messageContent;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function showLoading() {
            const chatContainer = document.getElementById('chatContainer');
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.id = 'loading';
            loadingDiv.innerHTML = '🤖 Agent is thinking...';
            chatContainer.appendChild(loadingDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function hideLoading() {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.remove();
            }
        }

        async function sendMessage() {
            const userId = document.getElementById('userId').value.trim();
            const message = document.getElementById('messageInput').value.trim();
            const jobDescription = document.getElementById('jobDescription').value.trim();
            
            if (!userId) {
                alert('Please enter your user ID');
                return;
            }
            
            if (!message) {
                alert('Please enter a message');
                return;
            }

            // Add user message to chat
            addMessage(message, true);
            
            // Clear input
            document.getElementById('messageInput').value = '';
            
            // Show loading
            showLoading();

            try {
                const response = await fetch('/agent/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        message: message,
                        job_description: jobDescription || null,
                        conversation_id: conversationId
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Update conversation ID
                conversationId = data.conversation_id;
                document.getElementById('conversationId').value = conversationId;
                
                // Hide loading
                hideLoading();
                
                // Add agent response
                addMessage(data.response, false, data);

            } catch (error) {
                hideLoading();
                addMessage(`Error: ${error.message}`, false);
            }
        }

        // Allow Enter key to send message
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Add some example messages
        function addExamplePrompts() {
            const examples = [
                "Hi! I'd like to generate a resume for a software engineer position.",
                "Can you calculate the ATS score for my current resume?",
                "I need suggestions to improve my resume.",
                "Please help me tailor my resume for this job posting."
            ];
            
            const chatContainer = document.getElementById('chatContainer');
            const examplesDiv = document.createElement('div');
            examplesDiv.className = 'message agent-message';
            examplesDiv.innerHTML = `
                <strong>Example prompts you can try:</strong><br>
                ${examples.map(ex => `• "${ex}"`).join('<br>')}
            `;
            chatContainer.appendChild(examplesDiv);
        }

        // Add examples on page load
        window.onload = function() {
            addExamplePrompts();
        };
    </script>
</body>
</html>
"""

def create_chat_app():
    """Create a simple FastAPI app with the chat interface."""
    app = FastAPI(title="CVForge.ai Chat Interface")
    
    @app.get("/", response_class=HTMLResponse)
    async def chat_interface():
        return HTML_TEMPLATE
    
    # This would proxy to your main API
    @app.post("/agent/chat")
    async def proxy_chat(request: dict):
        # In a real app, this would proxy to your main API
        # For demo purposes, return a mock response
        return {
            "response": "This is a demo interface. Please connect to your main CVForge.ai API to use the full agent functionality.",
            "conversation_id": "demo-conversation",
            "resume_json": None,
            "ats_score": None,
            "suggestions": None
        }
    
    return app

if __name__ == "__main__":
    import uvicorn
    app = create_chat_app()
    print("🌐 Starting chat interface at http://localhost:8001")
    print("📝 Make sure your main CVForge.ai API is running on port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8001)
