import logging
import json
from typing import List
import httpx
from jinja2 import Template

from modules import embedding
import llm_client, schemas

logger = logging.getLogger(__name__)

KEYWORD_EXTRACTION_TEMPLATE = Template("""You are an expert ATS (Applicant Tracking System) analyzer. Your task is to extract the most important skills, technologies, and keywords from a job description that an ATS would look for in a resume.

**Job Description:**
{{ job_description }}

**Instructions:**
1. Extract 10-15 of the most important technical skills, tools, technologies, and keywords
2. Focus on specific technologies, programming languages, frameworks, certifications, and industry terms
3. Avoid generic terms like "communication" or "teamwork" unless they are specifically emphasized
4. Return ONLY a JSON object with a "skills" array

**Required JSON Format:**
{
  "skills": ["skill1", "skill2", "skill3", ...]
}

Extract the key skills now:""")

SUGGESTION_TEMPLATE = Template("""You are a helpful career coach. A candidate is missing some important keywords from their resume that appear in a job description. Provide specific, actionable suggestions on how they can incorporate these missing skills into their resume.

**Missing Keywords:** {{ skills_list }}

**Instructions:**
1. For each missing keyword, suggest specific ways to incorporate it into a resume
2. Focus on practical, honest ways to highlight relevant experience or learning
3. Suggest specific resume sections where each skill could be mentioned
4. Provide 5-8 concrete suggestions total

**Required JSON Format:**
{
  "suggestions": [
    "suggestion 1",
    "suggestion 2", 
    "suggestion 3"
  ]
}

Provide your suggestions now:""")

def identify_missing_keywords(required: List[str], resume_text: str) -> List[str]:
    resume_lower = resume_text.lower()
    return [skill for skill in required if skill.lower() not in resume_lower]

async def calculate_composite_score(request: schemas.ScoreRequest, client: httpx.AsyncClient) -> schemas.ScoreResponse:
    # 1. Calculate semantic score using the unified model
    semantic_score = embedding.compute_semantic_score(
        request.job_description, request.resume_text
    )

    # 2. Extract keywords from Job Description via LLM
    prompt = KEYWORD_EXTRACTION_TEMPLATE.render(job_description=request.job_description)
    try:
        response_text = await llm_client.invoke_gemini(client, prompt, enforce_json=True)
        required_keywords = json.loads(response_text).get("skills", [])
    except (json.JSONDecodeError, llm_client.LLMError):
        required_keywords = []

    # 3. Calculate keyword score
    if not required_keywords:
        keyword_score = 1.0
        missing_keywords = []
    else:
        missing_keywords = identify_missing_keywords(required_keywords, request.resume_text)
        keyword_score = (len(required_keywords) - len(missing_keywords)) / len(required_keywords)

    # 4. Calculate final weighted score
    final_score = (semantic_score * 0.4) + (keyword_score * 0.6)

    return schemas.ScoreResponse(
        final_score=round(final_score, 3),
        semantic_score=round(semantic_score, 3),
        keyword_score=round(keyword_score, 3),
        missing_keywords=missing_keywords,
    )

async def get_suggestions(request: schemas.SuggestionRequest, client: httpx.AsyncClient) -> schemas.SuggestionResponse:
    prompt = SUGGESTION_TEMPLATE.render(skills_list=", ".join(request.missing_keywords))
    try:
        response_text = await llm_client.invoke_gemini(client, prompt, enforce_json=True)
        suggestions = json.loads(response_text).get("suggestions", [])
    except (json.JSONDecodeError, llm_client.LLMError) as e:
        logger.error(f"Failed to get suggestions: {e}")
        suggestions = ["Could not generate suggestions at this time."]
    
    return schemas.SuggestionResponse(suggestions=suggestions)