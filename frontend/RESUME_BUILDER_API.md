# Resume Builder API Integration Guide

## Overview
The new resume builder component follows this flow:
1. User selects from 4 resume templates
2. User enters job description in a modal
3. AI agent generates initial resume using user's MongoDB profile data
4. User can chat with AI to refine the resume
5. Live preview updates with each change

## Required API Endpoint

### POST `${VITE_AGENT_URL}v1/chat`

**Request Body:**
```json
{
  "session_id": "resume-session-{timestamp}",
  "user_message": "User's chat message or initial request",
  "user_id": "MongoDB user ID from JWT token",
  "job_description": "The job description provided by user"
}
```

**Response:**
```json
{
  "agent_response": "AI's text response to display in chat",
  "resume_state": {
    "personal_info": {
      "full_name": "John Doe",
      "title": "Software Engineer",
      "email": "john@example.com",
      "phone": "(555) 123-4567",
      "location": "City, State"
    },
    "summary": "Professional summary text...",
    "experience": [
      {
        "position": "Senior Developer",
        "company": "Tech Corp",
        "start_date": "Jan 2020",
        "end_date": "Present",
        "responsibilities": [
          "Led development team",
          "Implemented new features"
        ]
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Computer Science",
        "institution": "University Name",
        "graduation_date": "2019"
      }
    ],
    "skills": [
      "JavaScript",
      "React",
      "Node.js"
    ]
  }
}
```

## Template Formatting

The component includes 4 built-in templates:
1. **Professional** - Clean, corporate style with blue accents
2. **Modern** - Contemporary with purple gradient header
3. **Creative** - Bold design with colorful elements
4. **Minimalist** - Simple, clean design with minimal styling

Each template automatically formats the `resume_state` JSON into appropriate HTML.

## Environment Variables Required

```env
VITE_AGENT_URL=http://localhost:8000/agent/
```

## Key Features

- **Template Selection**: 4 professional resume templates
- **Job Description Modal**: Popup for entering job requirements
- **AI Chat Integration**: Real-time conversation with resume agent
- **Live Preview**: Instant preview updates with template styling
- **Dark/Light Mode**: Full theme support
- **PDF Export**: Download resume as PDF
- **Session Management**: Unique session IDs for each resume build

## Backend Integration Notes

1. The AI agent should fetch user profile data from MongoDB using the `user_id`
2. Initial request creates a complete resume based on profile + job description
3. Subsequent requests refine the existing resume based on user feedback
4. All responses should include both chat text and updated resume data
5. Session management helps maintain conversation context
