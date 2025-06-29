from pydantic import BaseModel, Field, AliasChoices, model_validator
from typing import List, Optional, Literal, Dict
from datetime import datetime
import config

IndexNamespace = Literal['profile', 'resume_sections']

class IndexSectionRequest(BaseModel):
    section_id: str = Field(..., description="A unique identifier for the section")
    text: str = Field(..., description="The text content of the section", min_length=1)

class IndexSectionResponse(BaseModel):
    status: str
    section_id: str
    chunk_ids: List[str]

class IndexProfileResponse(BaseModel):
    status: str
    message: str

class DeleteSectionResponse(BaseModel):
    status: str
    section_id: str

class ChunkItem(BaseModel):
    chunk_id: str = Field(..., validation_alias=AliasChoices("chunk_id", "_id"))
    text: str
    score: float
    source_type: str
    source_id: str

class RetrieveResponse(BaseModel):
    results: List[ChunkItem]

class FullGenerateRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)
    top_k: Optional[int] = Field(7, ge=1, le=50)

class SectionGenerateRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    section_id: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)
    existing_text: Optional[str] = None
    top_k: Optional[int] = Field(5, ge=1, le=50)

class GenerateResponse(BaseModel):
    generated_text: str
    retrieval_mode: str
    section_id: Optional[str] = None

class ScoreRequest(BaseModel):
    job_description: str = Field(..., min_length=1)
    resume_text: str = Field(..., min_length=1)

class ScoreResponse(BaseModel):
    final_score: float = Field(..., description="The final weighted ATS score from 0 to 1.", ge=0.0, le=1.0)
    semantic_score: float = Field(..., description="The semantic similarity score component (0 to 1).", ge=0.0, le=1.0)
    keyword_score: float = Field(..., description="The keyword matching score component (0 to 1).", ge=0.0, le=1.0)
    missing_keywords: List[str] = Field(..., description="Important keywords from the job description missing from the resume.")

class SuggestionRequest(BaseModel):
    missing_keywords: List[str] = Field(..., min_length=1)

class SuggestionResponse(BaseModel):
    suggestions: List[str]

class HealthResponse(BaseModel):
    status: str
    service: str

class AgentChatRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    job_description: Optional[str] = None
    conversation_id: Optional[str] = None

class AgentChatResponse(BaseModel):
    response: str
    resume_json: Optional[Dict] = None
    ats_score: Optional[ScoreResponse] = None
    conversation_id: str

class ConversationState(BaseModel):
    conversation_id: str
    user_id: str
    job_description: Optional[str] = None
    current_resume: Optional[Dict] = None
    last_ats_score: Optional[ScoreResponse] = None
    message_history: List[Dict[str, str]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)