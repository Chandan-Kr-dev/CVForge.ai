# CVForge.ai 🚀

**An AI-Powered Resume Generation & Job Application Platform**

CVForge.ai is a comprehensive, full-stack application that leverages advanced AI technologies to revolutionize the job application process. It combines intelligent resume generation, ATS optimization, social profile integration, and job matching into a unified platform.

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-00C300.svg)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-4EA94B.svg)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)

## 🌟 Key Features

### 🎯 AI-Powered Resume Generation
- **Intelligent Content Creation**: Generates tailored resumes using Google Gemini AI based on user profiles and job descriptions
- **Multiple Templates**: 4 professional resume templates (Professional, Modern Sidebar, Creative, Minimalist)
- **Real-time Editing**: Interactive chat interface for refining resumes with AI assistance
- **Live Preview**: Instant preview updates as changes are made

### 📊 ATS Optimization & Scoring
- **Comprehensive ATS Analysis**: Calculates compatibility scores using semantic matching (40%) and keyword analysis (60%)
- **Missing Keywords Detection**: Identifies important keywords from job descriptions not present in resumes
- **Improvement Suggestions**: AI-powered recommendations for enhancing resume effectiveness
- **Real-time Feedback**: Instant scoring and suggestions as resumes are edited

### 🔗 Social Profile Integration
- **LinkedIn Integration**: Scrapes and imports LinkedIn profile data including experience, education, and skills
- **GitHub Integration**: Fetches GitHub profiles, repositories, and project information
- **Multi-Platform Authentication**: Support for Google, GitHub, and Civic Auth login methods
- **Automated Data Extraction**: Converts social media profiles into structured resume data

### 💼 Job Management System
- **Job Discovery**: Browse and search available job opportunities
- **Application Tracking**: Monitor job application status and progress
- **Company Dashboard**: Dedicated interface for companies to post and manage job listings
- **Role-Based Access**: Separate experiences for applicants and companies

### 🤖 Intelligent AI Agent
- **Conversational Interface**: Natural language interactions for resume building and optimization
- **Persistent Memory**: Maintains conversation context across sessions
- **Tool Integration**: Seamless access to generation, scoring, and editing capabilities
- **Session Management**: Unique session handling for personalized experiences

## 🏗️ Architecture Overview

CVForge.ai follows a modern microservices architecture with three main components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │◄───┤     Backend     │◄───┤   AI Agent      │
│                 │    │                 │    │                 │
│  React + Vite   │    │  Node.js + API  │    │ Python + FastAPI│
│  Modern UI/UX   │    │  Business Logic │    │ AI/ML Services  │
│  Responsive     │    │  Data Management│    │ Vector Search   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │    MongoDB      │    │  Google Gemini  │
│   Authentication│    │   Database      │    │   AI Models     │
│   Social Login  │    │   User Data     │    │  LangChain      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend (`/frontend`)
- **Framework**: React 19.1.0 with Vite for fast development
- **Styling**: Tailwind CSS with custom components and dark/light mode
- **Routing**: React Router DOM for SPA navigation
- **UI Components**: Headless UI, Radix UI, Lucide React icons
- **Authentication**: Firebase Auth with multi-provider support
- **State Management**: React hooks and context
- **Build Tools**: Vite, ESLint, PostCSS

#### Backend (`/backend`)
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with role-based access control
- **File Processing**: Multer for uploads, PDF2JSON for PDF parsing
- **Social Integration**: GitHub and LinkedIn data scraping
- **API Design**: RESTful endpoints with comprehensive error handling

#### AI Agent (`/Agent`)
- **Framework**: Python 3.12+ with FastAPI
- **AI/ML Stack**: 
  - Google Gemini for text generation
  - LangChain for agent orchestration
  - SentenceTransformers for embeddings
  - Specialized resume-job matching model (`anass1209/resume-job-matcher-all-MiniLM-L6-v2`)
- **Vector Database**: MongoDB Atlas with vector search capabilities
- **Tools**: NLTK for text processing, Jinja2 for templating
- **Dependencies**: httpx for async HTTP, pydantic for data validation

## 📁 Project Structure

```
CVForge.ai/
├── README.md                      # This file
├── frontend/                      # React frontend application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── dashboard/        # Dashboard-specific components
│   │   │   ├── resume_builder/   # Resume builder interface
│   │   │   ├── resume_checker/   # ATS scoring interface
│   │   │   ├── landing/          # Landing page components
│   │   │   ├── login/           # Authentication components
│   │   │   └── ui/              # Base UI components
│   │   ├── pages/               # Route components
│   │   ├── utils/               # Utility functions
│   │   ├── assets/              # Static assets
│   │   └── firebase.js          # Firebase configuration
│   ├── public/                  # Public assets
│   ├── package.json            # Frontend dependencies
│   ├── Dockerfile              # Frontend containerization
│   └── vite.config.js          # Vite configuration
├── backend/                     # Node.js backend API
│   ├── controllers/            # API route handlers
│   │   ├── auth.js            # Authentication logic
│   │   ├── JobController.js   # Job management
│   │   ├── ResumeController.js # Resume operations
│   │   ├── ReviewControllers.js # User reviews
│   │   └── SocialConnectController.js # Social integration
│   ├── models/                # Database schemas
│   │   ├── auth_user.js       # User authentication model
│   │   ├── job.js             # Job listings model
│   │   ├── resume.js          # Resume data model
│   │   ├── profiles.models.js  # User profiles model
│   │   └── social_connect.js   # Social connections model
│   ├── Routes/                # API route definitions
│   ├── middleware/            # Authentication middleware
│   ├── db/                    # Database configuration
│   ├── uploads/               # File upload handling
│   ├── package.json          # Backend dependencies
│   └── server.js             # Main server file
└── Agent/                     # Python AI service
    ├── modules/              # Core AI modules
    │   ├── embedding.py      # Vector embeddings & search
    │   ├── generation.py     # Resume generation logic
    │   └── scoring.py        # ATS scoring algorithms
    ├── app.py               # FastAPI application
    ├── resume_agent.py      # Main AI agent implementation
    ├── llm_client.py        # Google Gemini integration
    ├── config.py            # Configuration management
    ├── schemas.py           # Pydantic data models
    ├── requirements.txt     # Python dependencies
    ├── pyproject.toml       # Project metadata
    ├── Dockerfile           # Agent containerization
    └── README.md            # Agent-specific documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.12+ with pip
- **MongoDB** Atlas account or local MongoDB instance
- **Google Gemini API** key
- **Firebase** project for authentication
- **Docker** (optional, for containerized deployment)

### Environment Variables

Create `.env` files in each service directory:

#### Frontend (`.env`)
```env
VITE_DEV_URL=http://localhost:8080/
VITE_AGENT_URL=http://localhost:8000/
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_CIVIC_AUTH_CLIENT_ID=your_civic_client_id
```

#### Backend (`.env`)
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/cvforge
JWT_SECRET=your_jwt_secret_key
PORT=8080
```

#### AI Agent (`.env`)
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=cvforge
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GENERATION_TEMPERATURE=0.7
GENERATION_MAX_TOKENS=2048
```

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd CVForge.ai
```

#### 2. Set Up the Backend
```bash
cd backend
npm install
npm start  # Runs on http://localhost:8080
```

#### 3. Set Up the AI Agent
```bash
cd Agent
pip install -r requirements.txt
# Download NLTK data
python -c "import nltk; nltk.download('punkt')"
uvicorn app:app --reload --port 8000  # Runs on http://localhost:8000
```

#### 4. Set Up the Frontend
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### Docker Deployment

For production deployment with Docker:

```bash
# Build and start all services
docker-compose up -d

# Or use the deployment script
cd Agent
./deploy.sh  # Linux/Mac
deploy.bat   # Windows
```

## 🔧 Core Features Deep Dive

### AI Resume Generation
The AI agent uses a sophisticated pipeline to generate personalized resumes:

1. **Profile Indexing**: User profiles are chunked and embedded using specialized models
2. **Semantic Retrieval**: Relevant profile information is retrieved based on job descriptions
3. **Content Generation**: Google Gemini creates tailored resume content
4. **Template Formatting**: Content is formatted according to selected templates

### ATS Scoring Algorithm
The ATS scoring system provides comprehensive analysis:

- **Semantic Matching (40%)**: Measures content alignment using vector similarity
- **Keyword Matching (60%)**: Analyzes coverage of important job-specific keywords
- **Missing Keywords**: Identifies gaps and suggests improvements
- **Final Score**: Weighted combination providing actionable insights

### Social Profile Integration
Seamless integration with professional social networks:

- **LinkedIn Scraping**: Extracts comprehensive profile data including experience, education, skills
- **GitHub Integration**: Fetches repositories, projects, and contribution data
- **Data Normalization**: Converts diverse data formats into structured resume components
- **Real-time Updates**: Keeps profile information synchronized

## 📊 API Documentation

### Backend API Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/getUser` - Get user details

#### Resume Management
- `POST /resume/build` - Create new resume
- `GET /resume/getresumes` - Get user resumes

#### Job Management
- `POST /jobs/create` - Create job posting (companies)
- `GET /jobs/all` - Get all jobs with filtering

#### Social Integration
- `POST /Scrapper/linkedin/data` - Import LinkedIn profile
- `POST /Scrapper/github/data` - Import GitHub profile
- `GET /Scrapper/github/repos` - Fetch GitHub repositories

### AI Agent API Endpoints

#### Core Services
- `GET /health` - Service health check
- `POST /index/profile/{user_id}` - Index user profile for search
- `POST /generate/full` - Generate complete resume
- `POST /score` - Calculate ATS compatibility score
- `POST /suggest` - Get improvement suggestions
- `POST /agent/chat` - Interactive AI agent chat

#### Example API Usage
```javascript
// Generate a resume
const response = await fetch('http://localhost:8000/generate/full', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user123',
    job_description: 'Software Engineer position...',
    top_k: 7
  })
});

// Calculate ATS score
const scoreResponse = await fetch('http://localhost:8000/score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_description: 'Job requirements...',
    resume_text: 'Resume content...'
  })
});
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test  # Run backend tests
```

### AI Agent Testing
```bash
cd Agent
# Test API endpoints
curl http://localhost:8000/health

# Test resume generation
curl -X POST "http://localhost:8000/generate/full" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "job_description": "Python developer"}'
```

### Frontend Testing
```bash
cd frontend
npm run lint  # ESLint checks
npm run build  # Production build test
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with role-based access
- **Input Validation**: Comprehensive validation using Pydantic and Express validators
- **CORS Configuration**: Properly configured cross-origin resource sharing
- **Environment Variables**: Sensitive data stored in environment variables
- **Rate Limiting**: API rate limiting to prevent abuse
- **SQL Injection Prevention**: MongoDB ODM protection against injection attacks

## 🚀 Deployment

### Production Deployment Checklist

1. **Environment Setup**
   - [ ] MongoDB Atlas cluster configured
   - [ ] Google Gemini API key obtained
   - [ ] Firebase project set up
   - [ ] Domain and SSL certificates ready

2. **Service Configuration**
   - [ ] Environment variables set for all services
   - [ ] Database connections tested
   - [ ] API endpoints verified
   - [ ] CORS policies configured

3. **Containerization**
   - [ ] Docker images built and tested
   - [ ] Docker Compose configuration verified
   - [ ] Health checks implemented
   - [ ] Logging configured

4. **Monitoring & Maintenance**
   - [ ] Application monitoring set up
   - [ ] Error tracking implemented
   - [ ] Backup strategies in place
   - [ ] Update procedures documented

### Scaling Considerations

- **Horizontal Scaling**: Each service can be scaled independently
- **Load Balancing**: Use nginx or cloud load balancers for traffic distribution
- **Database Scaling**: MongoDB Atlas provides automatic scaling
- **CDN Integration**: Frontend assets can be served via CDN
- **Caching**: Implement Redis for session and response caching

## 🤝 Contributing

We welcome contributions to CVForge.ai! Please follow these guidelines:

1. **Fork the Repository**: Create a fork of the main repository
2. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Make Changes**: Implement your feature or bug fix
4. **Write Tests**: Add appropriate tests for your changes
5. **Submit Pull Request**: Create a detailed pull request with description

### Development Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Update documentation for any API changes
- Ensure all tests pass before submitting
- Add comments for complex logic

## 📈 Performance Metrics

### Current Performance Benchmarks
- **Resume Generation**: ~3-5 seconds average response time
- **ATS Scoring**: ~2-3 seconds for comprehensive analysis
- **Profile Indexing**: ~1-2 seconds for standard profiles
- **Database Queries**: <500ms for most operations
- **Frontend Load Time**: <2 seconds on average

### Optimization Strategies
- **Caching**: Implemented at multiple layers (API, database, frontend)
- **Code Splitting**: Frontend uses dynamic imports for optimal loading
- **Database Indexing**: Optimized MongoDB indexes for fast queries
- **Async Processing**: Non-blocking operations where possible
- **Compression**: Gzip compression for API responses

## 🔮 Roadmap

### Near Term (Q2 2025)
- [ ] Enhanced ATS scoring with more sophisticated algorithms
- [ ] Additional resume templates and customization options
- [ ] Improved social media integration (Twitter, Instagram)
- [ ] Mobile-responsive design improvements
- [ ] Advanced analytics and reporting

### Medium Term (Q3-Q4 2025)
- [ ] Multi-language support for international users
- [ ] AI-powered interview preparation tools
- [ ] Integration with major job boards (Indeed, LinkedIn Jobs)
- [ ] Company branding customization options
- [ ] Advanced user analytics and insights

### Long Term (2026+)
- [ ] Machine learning models for job matching
- [ ] Blockchain-based credential verification
- [ ] AI-powered career path recommendations
- [ ] Enterprise-grade features for large organizations
- [ ] API marketplace for third-party integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, bug reports, or feature requests:

- **GitHub Issues**: Use the issue tracker for bug reports and feature requests
- **Documentation**: Comprehensive docs available in each service directory
- **Community**: Join our community discussions
- **Email**: Contact the development team for enterprise inquiries

## 🙏 Acknowledgments

- **Google Gemini API**: For powerful AI text generation capabilities
- **MongoDB Atlas**: For reliable cloud database services
- **Firebase**: For seamless authentication services
- **LangChain**: For sophisticated AI agent orchestration
- **Open Source Community**: For the amazing tools and libraries that make this possible

---

**CVForge.ai** - Revolutionizing the future of job applications with AI-powered resume generation and optimization.