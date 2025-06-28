# CVForge.ai Agent 🤖

**An intelligent AI-powered resume agent that creates personalized, ATS-optimized resumes with real-time scoring and intelligent suggestions.**

CVForge.ai Agent is a comprehensive solution that combines advanced AI technologies to help users create professional resumes tailored to specific job descriptions, calculate ATS (Applicant Tracking System) compatibility scores, and provide actionable improvement suggestions.

## 🌟 Features

### 🎯 Core Capabilities
- **Intelligent Resume Generation**: Creates personalized resumes in JSON format based on user profiles and job descriptions
- **ATS Score Analysis**: Real-time compatibility scoring with detailed breakdowns
- **Smart Suggestions**: AI-powered recommendations for profile improvements
- **Interactive Chat Interface**: Conversational AI agent for natural user interactions
- **Resume Editing**: Dynamic resume modifications based on user feedback
- **Persistent Conversations**: Maintains conversation state across sessions

### 🔧 Technical Features
- **Vector Search**: Advanced semantic search using specialized resume-job matching embeddings
- **MongoDB Integration**: Scalable document storage with vector search capabilities
- **LangChain Agent**: Sophisticated tool-calling AI agent with memory
- **Google Gemini Integration**: Powered by Google's latest AI models
- **RESTful API**: Comprehensive FastAPI-based backend
- **Web Interface**: Modern, responsive chat interface

## 🏗️ Architecture

### System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Chat Interface<br/>chat_app.py]
        API_CLIENT[API Clients<br/>External Apps]
    end
    
    subgraph "API Layer"
        FASTAPI[FastAPI Server<br/>app.py]
        ENDPOINTS[API Endpoints<br/>/generate, /score, /agent]
    end
    
    subgraph "Agent Layer"
        AGENT[LangChain Agent<br/>resume_agent.py]
        TOOLS[Agent Tools<br/>generate_resume<br/>calculate_ats_score<br/>get_suggestions<br/>edit_resume]
        MEMORY[Conversation Memory<br/>conversation_store]
    end
    
    subgraph "Processing Modules"
        EMBED[Embedding Module<br/>embedding.py]
        GEN[Generation Module<br/>generation.py]
        SCORE[Scoring Module<br/>scoring.py]
    end
    
    subgraph "External Services"
        GEMINI[Google Gemini AI<br/>llm_client.py]
        MONGO[MongoDB Atlas<br/>Vector Search]
        HUGGING[HuggingFace Models<br/>SentenceTransformers]
    end
    
    subgraph "Data Storage"
        PROFILES[(User Profiles<br/>Collection)]
        CHUNKS[(Vector Chunks<br/>Collection)]
        USERS[(Users Metadata<br/>Collection)]
    end
    
    %% Client connections
    WEB --> FASTAPI
    API_CLIENT --> FASTAPI
    
    %% API to Agent
    FASTAPI --> ENDPOINTS
    ENDPOINTS --> AGENT
    
    %% Agent interactions
    AGENT --> TOOLS
    AGENT --> MEMORY
    TOOLS --> EMBED
    TOOLS --> GEN
    TOOLS --> SCORE
    
    %% Module dependencies
    EMBED --> HUGGING
    EMBED --> MONGO
    GEN --> GEMINI
    GEN --> EMBED
    SCORE --> GEMINI
    SCORE --> EMBED
    
    %% Data storage
    EMBED --> PROFILES
    EMBED --> CHUNKS
    EMBED --> USERS
    
    %% Styling
    classDef client fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef agent fill:#e8f5e8
    classDef module fill:#fff3e0
    classDef external fill:#ffebee
    classDef storage fill:#f1f8e9
    
    class WEB,API_CLIENT client
    class FASTAPI,ENDPOINTS api
    class AGENT,TOOLS,MEMORY agent
    class EMBED,GEN,SCORE module
    class GEMINI,MONGO,HUGGING external
    class PROFILES,CHUNKS,USERS storage
```

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant WebUI as Web Interface
    participant API as FastAPI Server
    participant Agent as LangChain Agent
    participant Tools as Agent Tools
    participant Modules as Processing Modules
    participant Gemini as Google Gemini
    participant MongoDB as MongoDB Atlas
    
    User->>WebUI: "Generate a resume for this job"
    WebUI->>API: POST /agent/chat
    API->>Agent: Process chat request
    
    Agent->>Tools: Call generate_resume tool
    Tools->>Modules: Invoke generation module
    
    Modules->>MongoDB: Retrieve user profile chunks
    MongoDB-->>Modules: Return relevant profile data
    
    Modules->>Gemini: Generate resume with context
    Gemini-->>Modules: Return resume JSON
    
    Modules-->>Tools: Resume generated
    Tools-->>Agent: Tool execution complete
    
    Agent->>Tools: Call calculate_ats_score tool
    Tools->>Modules: Invoke scoring module
    
    Modules->>Gemini: Extract job keywords
    Gemini-->>Modules: Return keyword list
    
    Modules->>MongoDB: Calculate semantic similarity
    MongoDB-->>Modules: Return similarity scores
    
    Modules-->>Tools: ATS score calculated
    Tools-->>Agent: Scoring complete
    
    Agent-->>API: Return comprehensive response
    API-->>WebUI: JSON response with resume & score
    WebUI-->>User: Display results
```

### Core Components

```
CVForge.ai Agent/
├── app.py                 # Main FastAPI application with API endpoints
├── resume_agent.py        # LangChain-based conversational AI agent
├── chat_app.py           # Web-based chat interface
├── config.py             # Configuration management
├── schemas.py            # Pydantic data models
├── llm_client.py         # Google Gemini API client
├── modules/              # Core processing modules
│   ├── embedding.py      # Vector embeddings and semantic search
│   ├── generation.py     # Resume generation logic
│   └── scoring.py        # ATS scoring and keyword analysis
└── requirements.txt      # Python dependencies
```

### Technology Stack

- **Backend**: FastAPI, Python 3.12+
- **AI/ML**: Google Gemini, LangChain, SentenceTransformers
- **Database**: MongoDB Atlas with Vector Search
- **Embeddings**: Specialized resume-job matching model (`anass1209/resume-job-matcher-all-MiniLM-L6-v2`)
- **Web Interface**: HTML/CSS/JavaScript with modern styling

## 🚀 Getting Started

### Prerequisites

- Python 3.12 or higher
- MongoDB Atlas account (with Vector Search enabled)
- Google AI API key (for Gemini)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CVForge.ai/Agent
   ```

2. **Install dependencies**
   ```bash
   # Using pip
   pip install -r requirements.txt
   
   # Or using uv (recommended)
   uv install
   ```

3. **Environment Setup**
   Create a `.env` file in the project root:
   ```env
   # MongoDB Configuration
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGO_DB_NAME=cvforge_production
   
   # Google AI Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   
   # Generation Settings
   GENERATION_TEMPERATURE=0.7
   GENERATION_MAX_TOKENS=2048
   ```

4. **Database Setup**
   - Create a MongoDB Atlas cluster
   - Enable Vector Search and create an index named `vector_index`
   - Set up the following collections: `profiles`, `chunks`, `users`

### Running the Application

#### Start the Main API Server
```bash
# Development
uvicorn app:app --reload --port 8000

# Production
uvicorn app:app --host 0.0.0.0 --port 8000
```

#### Start the Chat Interface (Optional)
```bash
python chat_app.py
# Accessible at http://localhost:8001
```

## 📋 API Documentation

### Core Endpoints

#### Health Check
```http
GET /health
```
Returns service health status.

#### Profile Indexing
```http
POST /index/profile/{user_id}
```
Indexes user profile data for semantic search.

#### Resume Generation
```http
POST /generate/full
```
Generates a complete resume in JSON format.

**Request Body:**
```json
{
  "user_id": "string",
  "job_description": "string",
  "top_k": 7
}
```

#### ATS Scoring
```http
POST /score
```
Calculates ATS compatibility score.

**Request Body:**
```json
{
  "job_description": "string",
  "resume_text": "string"
}
```

**Response:**
```json
{
  "final_score": 0.85,
  "semantic_score": 0.82,
  "keyword_score": 0.88,
  "missing_keywords": ["docker", "kubernetes"]
}
```

#### AI Agent Chat
```http
POST /agent/chat
```
Interact with the conversational AI agent.

**Request Body:**
```json
{
  "user_id": "string",
  "message": "string",
  "job_description": "string (optional)",
  "conversation_id": "string (optional)"
}
```

**Response:**
```json
{
  "response": "AI response text",
  "conversation_id": "uuid",
  "resume_json": {...},
  "ats_score": {...},
  "suggestions": [...]
}
```

### Agent Capabilities

The AI agent can handle the following requests:

#### Resume Generation
- "Generate a resume for me"
- "Create a CV for this position"
- "I need a new resume"

#### ATS Analysis
- "Calculate my ATS score"
- "How well does my resume match this job?"
- "Score my resume"

#### Improvement Suggestions
- "Give me suggestions to improve"
- "What should I add to my profile?"
- "How can I get a better score?"

#### Resume Editing
- "Remove the summary section"
- "Update my experience section"
- "Add more technical skills"

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | Required |
| `MONGO_DB_NAME` | Database name | `test` |
| `GEMINI_API_KEY` | Google AI API key | Required |
| `GEMINI_MODEL` | Gemini model to use | `gemini-1.5-flash` |
| `GENERATION_TEMPERATURE` | AI creativity level | `0.7` |
| `GENERATION_MAX_TOKENS` | Max response length | `2048` |

### Model Configuration

The system uses a specialized embedding model optimized for resume-job matching:
- **Model**: `anass1209/resume-job-matcher-all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Purpose**: Semantic similarity between resumes and job descriptions

## 🗃️ Data Models

### User Profile Structure
Profiles should be stored in MongoDB with the following structure:

```json
{
  "user_id": "unique_user_id",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "summary": "Professional summary...",
  "skills": ["Python", "JavaScript", "React"],
  "experience": [
    {
      "position": "Software Engineer",
      "company": "Tech Corp",
      "duration": "2021-2023",
      "location": "San Francisco, CA",
      "description": "Developed web applications..."
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of Technology",
      "duration": "2017-2021",
      "location": "California, USA"
    }
  ],
  "certifications": ["AWS Certified Developer", "Google Cloud Professional"]
}
```

### Resume Output Format
Generated resumes follow this JSON structure:

```json
{
  "resume": {
    "basics": {
      "name": "John Doe",
      "label": "Full Stack Developer",
      "email": "john@example.com",
      "phone": "+1234567890",
      "location": {
        "city": "San Francisco",
        "region": "CA",
        "countryCode": "US"
      },
      "summary": "Experienced full stack developer..."
    },
    "experience": [...],
    "education": [...],
    "skills": {
      "keywords": ["Python", "React", "Node.js"]
    }
  }
}
```

## 🔍 Advanced Features

### Vector Search
The system uses MongoDB's Vector Search for semantic similarity:
- Automatic profile chunking and embedding
- Contextual retrieval based on job descriptions
- Essential information always included (name, contact info)

### Conversation Memory
The AI agent maintains conversation state:
- Persistent resume storage across interactions
- Job description context preservation
- Message history tracking
- Automatic conversation backup

### ATS Optimization
Advanced scoring algorithm:
- **Semantic Matching (40%)**: Content alignment using embeddings
- **Keyword Matching (60%)**: Important keyword coverage
- Missing keyword identification
- Improvement suggestions

## 🎮 Usage Examples

### Generate a Resume
```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/generate/full",
        json={
            "user_id": "user123",
            "job_description": "Senior Python Developer position requiring Django, PostgreSQL, and AWS experience."
        }
    )
    resume = response.json()
```

### Chat with Agent
```python
async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/agent/chat",
        json={
            "user_id": "user123",
            "message": "Generate a resume and calculate the ATS score",
            "job_description": "Senior Python Developer..."
        }
    )
    result = response.json()
```

## 🧪 Testing

### Manual Testing
1. Start the server: `uvicorn app:app --reload`
2. Visit the API docs: `http://localhost:8000/docs`
3. Use the chat interface: `http://localhost:8001`

### API Testing
```bash
# Health check
curl http://localhost:8000/health

# Generate resume
curl -X POST "http://localhost:8000/generate/full" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user", "job_description": "Python developer role"}'
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify `MONGO_URI` in `.env`
   - Check network connectivity
   - Ensure Vector Search is enabled

2. **Gemini API Errors**
   - Validate `GEMINI_API_KEY`
   - Check API quotas and billing
   - Verify model availability

3. **Model Loading Issues**
   - Ensure sufficient memory (>2GB)
   - Check internet connectivity for model download
   - Clear model cache if corrupted

4. **Profile Not Found**
   - Ensure user profile exists in MongoDB
   - Check profile data structure
   - Verify user_id spelling

### Performance Optimization

- **MongoDB**: Use appropriate indexes
- **Embedding Model**: Consider GPU acceleration for large-scale usage
- **Caching**: Implement Redis for conversation storage in production
- **Load Balancing**: Use multiple instances behind a load balancer

## 🛡️ Security Considerations

- **API Keys**: Never commit API keys to version control
- **Input Validation**: All inputs are validated using Pydantic
- **CORS**: Configure appropriately for production
- **Rate Limiting**: Consider implementing rate limiting for public APIs

## 📈 Performance Metrics

- **Response Time**: < 3 seconds for resume generation
- **ATS Scoring**: < 1 second for analysis
- **Vector Search**: < 500ms for profile retrieval
- **Conversation Memory**: Persistent across server restarts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guidelines
- Add type hints to all functions
- Write comprehensive docstrings
- Test all new features thoroughly
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please contact:
- **Issues**: GitHub Issues
- **Documentation**: This README
- **API Reference**: `/docs` endpoint when running

## 🔮 Roadmap

### Upcoming Features
- [ ] Resume templates and styling options
- [ ] Multi-language support
- [ ] Integration with job boards
- [ ] Resume version control
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] API rate limiting
- [ ] User authentication system

### Version History
- **v2.0.0**: Current - AI Agent with conversation memory
- **v1.x.x**: Basic resume generation and scoring

---

**Built with ❤️ by the CVForge.ai team**

*Empowering job seekers with AI-driven resume optimization*
