# CVForge.ai LangChain Resume Agent

A conversational AI agent that generates personalized resumes, calculates ATS scores, and provides improvement suggestions using LangChain and your existing CVForge.ai architecture.

## 🚀 Features

- **Conversational Interface**: Natural language interaction for resume tasks
- **Resume Generation**: Creates personalized JSON resumes based on user profiles and job descriptions
- **ATS Scoring**: Calculates semantic and keyword-based compatibility scores
- **Improvement Suggestions**: Provides actionable recommendations for resume optimization
- **Conversation Memory**: Maintains context across multiple interactions
- **Multiple Interfaces**: API endpoints, CLI chat, and web interface

## 🛠️ Installation

The agent uses your existing uv package manager setup. The required dependencies have been added:

```bash
# Dependencies are already installed via uv add
# langchain
# langchain-google-genai  
# langchain-community
```

## 📋 Prerequisites

1. **Environment Setup**: Ensure your `.env` file contains:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   MONGO_URI=your_mongodb_connection_string
   MONGO_DB_NAME=your_database_name
   ```

2. **User Profile Data**: Users must have their profiles indexed in MongoDB before generating resumes:
   ```bash
   POST /index/profile/{user_id}
   ```

## 🎯 Usage

### 1. API Endpoints

Start the main FastAPI application:

```bash
cd "C:\Users\Abdul\Desktop\CVForge.ai\Agent"
uv run uvicorn app:app --reload
```

#### Chat with the Agent

```bash
POST /agent/chat
```

**Request Body:**
```json
{
  "user_id": "john_doe_123",
  "message": "Generate a resume for a software engineer position",
  "job_description": "We are looking for a Python developer with FastAPI experience...",
  "conversation_id": "optional-existing-conversation-id"
}
```

**Response:**
```json
{
  "response": "I've generated a personalized resume for you...",
  "resume_json": { /* Complete resume object */ },
  "ats_score": {
    "final_score": 0.85,
    "semantic_score": 0.82,
    "keyword_score": 0.88,
    "missing_keywords": ["Docker", "Kubernetes"]
  },
  "suggestions": ["Consider adding Docker experience...", "..."],
  "conversation_id": "uuid-conversation-id"
}
```

#### Get Conversation History

```bash
GET /agent/conversation/{conversation_id}
```

### 2. CLI Chat Interface

For interactive terminal-based chat:

```bash
uv run python cli_chat.py
```

Example interaction:
```
🆔 Enter your user ID: john_doe_123
[john_doe_123] You: Generate a resume for this job: Software Engineer at Google...
🤖 Agent: I've created a personalized resume for you based on your profile...
```

### 3. Web Chat Interface

Launch the web interface:

```bash
uv run python chat_app.py
```

Then visit `http://localhost:8001` for a user-friendly web chat interface.

### 4. Testing

Run the test suite to verify functionality:

```bash
uv run python test_agent.py
```

## 💬 Example Conversations

### Generate a Resume
```
User: "I need a resume for a Python developer position at a startup"
Agent: "I'll generate a personalized resume for you. Could you provide the job description?"

User: "Job description: We're looking for a Python developer with Django experience, REST APIs, and database design skills."
Agent: "I've generated a personalized resume highlighting your Python and Django experience..."
```

### Get ATS Score
```
User: "What's my ATS score for this resume?"
Agent: "Your ATS score is 78%. Here's the breakdown:
- Semantic Match: 82%
- Keyword Match: 74%
Missing keywords: Docker, Kubernetes, AWS"
```

### Get Suggestions
```
User: "How can I improve my resume?"
Agent: "Here are specific suggestions:
• Add Docker containerization experience to your technical skills
• Include Kubernetes orchestration in your recent projects
• Mention AWS cloud services in your infrastructure work"
```

## 🏗️ Architecture

The agent integrates seamlessly with your existing CVForge.ai components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   LangChain     │    │   CVForge.ai     │    │   External      │
│   Agent         │◄──►│   Modules        │◄──►│   Services      │
│                 │    │                  │    │                 │
│ • Conversation  │    │ • Embedding      │    │ • Gemini API    │
│ • Tool Calling  │    │ • Generation     │    │ • MongoDB       │
│ • State Mgmt    │    │ • Scoring        │    │ • Vector Store  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Agent Tools

The agent has access to these tools:

1. **`generate_resume`**: Creates personalized resumes using your generation pipeline
2. **`calculate_ats_score`**: Computes semantic and keyword-based scores
3. **`get_resume_suggestions`**: Provides improvement recommendations
4. **`edit_resume_section`**: Handles resume modifications (extensible)

## 📊 Conversation State

Each conversation maintains:
- User ID and conversation ID
- Current job description
- Generated resume JSON
- Last ATS score results
- Complete message history
- Timestamps for all interactions

## 🚨 Error Handling

The agent includes comprehensive error handling for:
- Missing user profile data
- API failures (Gemini, MongoDB)
- Invalid input validation
- Tool execution errors
- Conversation state issues

## 🔍 Monitoring & Logging

All agent interactions are logged with:
- User actions and responses
- Tool executions and results
- Error conditions and stack traces
- Performance metrics

## 🎨 Customization

### Adding New Tools

Create new tools by following the pattern:

```python
@tool
def my_custom_tool(param1: str, param2: int) -> str:
    """Description of what this tool does."""
    try:
        # Your tool logic here
        return "Tool result"
    except Exception as e:
        logger.error(f"Error in my_custom_tool: {e}")
        return f"Error: {str(e)}"
```

### Modifying Agent Behavior

Update the system prompt in `resume_agent.py`:

```python
("system", """You are CVForge.ai, an expert AI resume consultant.
Your enhanced capabilities include:
- Custom behavior 1
- Custom behavior 2
...
""")
```

## 🚀 Production Deployment

For production use:

1. **Replace In-Memory Storage**: Use Redis or database for conversation state
2. **Add Authentication**: Implement user authentication and authorization
3. **Rate Limiting**: Add rate limiting for API endpoints
4. **Monitoring**: Set up proper logging and monitoring
5. **Scaling**: Consider load balancing for multiple agent instances

## 📝 API Documentation

When running the FastAPI app, visit:
- **Interactive Docs**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🤝 Contributing

The agent follows your existing project patterns:
- Uses `uv` for dependency management
- Integrates with existing modules
- Follows FastAPI patterns
- Maintains proper error handling
- Includes comprehensive logging

## 📞 Support

For issues with the agent:
1. Check the logs for detailed error messages
2. Verify environment configuration
3. Ensure user profile data is properly indexed
4. Test with the provided test script

---

**Built with LangChain 🦜🔗 and CVForge.ai 📄**
