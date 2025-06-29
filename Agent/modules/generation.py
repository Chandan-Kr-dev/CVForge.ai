import logging
from typing import List
import httpx
from jinja2 import Template
from modules import embedding
import llm_client, schemas
logger = logging.getLogger(__name__)
FULL_RESUME_TEMPLATE = Template("""You are an AI Resume Architect. Your task is to create a complete, professional resume in JSON format based on the user's profile information and tailored to the specific job description provided.
**INSTRUCTIONS:**
1. Use ONLY the information provided in the Profile Context below
2. Tailor the resume content to highlight skills and experiences relevant to the job description
3. If profile information is missing for certain sections, use "Not specified" or omit those sections
4. Return ONLY valid JSON in the exact format specified below
**Job Description:**
{{ job_description }}
**Profile Context:**
{{ profile_context }}
**Required JSON Format:**
{
  "resume": {
    "basics": {
      "name": "Full Name from profile",
      "label": "Professional title based on job description",
      "email": "email from profile",
      "phone": "phone from profile", 
      "location": {
        "city": "city from profile",
        "region": "state/region from profile",
        "countryCode": "country code from profile"
      },
      "summary": "Professional summary tailored to job description using profile context"
    },
    "experience": [
      {
        "company": "Company name from profile",
        "position": "Job title from profile", 
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD or present",
        "summary": "Job description from profile, enhanced for relevance to target job",
        "highlights": ["Achievement 1", "Achievement 2"]
      }
    ],
    "education": [
      {
        "institution": "School name from profile",
        "area": "Field of study",
        "studyType": "Degree type",
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD"
      }
    ],
    "skills": {
      "keywords": ["skill1", "skill2", "skill3"]
    }
  }
}
Generate the resume JSON now:""")
SECTION_REWRITE_TEMPLATE = Template("""You are an AI Resume Editor. Your task is to rewrite a specific section of a resume to better match a job description using the user's profile context.
**INSTRUCTIONS:**
1. Use ONLY the information provided in the Profile Context below
2. Enhance the existing section content to better match the job requirements
3. Keep the same section structure but improve the content
4. Return ONLY the improved section text, no JSON formatting needed
**Job Description:**
{{ job_description }}
**Existing Section Content:**
{{ existing_text }}
**Profile Context:**
{{ profile_context }}
**Section to Rewrite:** {{ section_type }}
Provide the improved section content:""")
def format_context_for_prompt(chunks: List[schemas.ChunkItem]) -> str:
    if not chunks:
        return "No relevant context found."
    return "\n".join([
        f"Source: {chunk.source_type} (Relevance: {chunk.score:.2f})\nContent: {chunk.text.strip()}\n"
        for chunk in chunks
    ])
async def create_full_resume(request: schemas.FullGenerateRequest, client: httpx.AsyncClient) -> str:
    retrieved_chunks_data = embedding.retrieve_chunks(
        user_id=request.user_id,
        query_text=request.job_description,
        top_k=request.top_k,
        namespace="profile"
    )
    retrieved_chunks = [schemas.ChunkItem(**c) for c in retrieved_chunks_data]
    profile_context = format_context_for_prompt(retrieved_chunks)
    logger.info(f"Retrieved {len(retrieved_chunks)} chunks for user {request.user_id}")
    logger.info(f"Profile context: {profile_context[:200]}...")
    prompt = FULL_RESUME_TEMPLATE.render(
        job_description=request.job_description,
        profile_context=profile_context
    )
    return await llm_client.invoke_gemini(client, prompt, enforce_json=True)