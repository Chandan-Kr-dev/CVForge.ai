import logging
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import traceback

import config, schemas
from modules import embedding, scoring
from modules.generation import create_full_resume
from llm_client import LLMError
from resume_agent import create_resume_agent

# --- Logging Setup ---
logging.basicConfig(level="INFO", format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# --- App State ---
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting up {config.APP_NAME} v{config.APP_VERSION}...")
    # Initialize shared resources
    app_state["http_client"] = httpx.AsyncClient(timeout=60.0)
    app_state["resume_agent"] = create_resume_agent(app_state["http_client"])
    embedding.init_db()
    embedding.load_model()
    logger.info("Startup complete. Service is ready.")
    yield
    logger.info("Shutting down...")
    await app_state["http_client"].aclose()
    if embedding.state.mongo_client:
        embedding.state.mongo_client.close()
    logger.info("Shutdown complete.")

app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Dependency Injection ---
def get_http_client() -> httpx.AsyncClient:
    return app_state["http_client"]

def get_resume_agent():
    return app_state["resume_agent"]

# --- API Endpoints ---
@app.get("/health", response_model=schemas.HealthResponse, tags=["Utilities"])
async def health_check():
    return {"status": "healthy", "service": config.APP_NAME}

# --- Indexing Endpoints ---
@app.post("/index/profile/{user_id}", response_model=schemas.IndexProfileResponse, tags=["Indexing"])
async def index_user_profile(user_id: str):
    try:
        total_chunks = embedding.index_user_profile(user_id)
        return {"status": "success", "message": f"Profile indexed successfully into {total_chunks} chunks."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during indexing: {e}")

# --- Generation Endpoints ---
@app.post("/generate/full", response_model=schemas.GenerateResponse, tags=["Generation"])
async def generate_full_resume(
    request: schemas.FullGenerateRequest,
    client: httpx.AsyncClient = Depends(get_http_client)
):
    try:
        generated_text = await create_full_resume(request, client)
        return schemas.GenerateResponse(generated_text=generated_text, retrieval_mode="full")
    except (httpx.HTTPError, LLMError, ValueError) as e:
        logger.error(f"Downstream/logic error during full generation: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        tb_str = traceback.format_exc()
        logger.error(f"Unexpected error in full generation: {e}\n{tb_str}")
        raise HTTPException(status_code=500, detail="An unexpected internal error occurred.")

# --- Scoring Endpoints ---
@app.post("/score", response_model=schemas.ScoreResponse, tags=["Scoring"])
async def score_resume(
    request: schemas.ScoreRequest,
    client: httpx.AsyncClient = Depends(get_http_client)
):
    try:
        return await scoring.calculate_composite_score(request, client)
    except (LLMError, httpx.HTTPError) as e:
        raise HTTPException(status_code=502, detail=f"A downstream service failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")

@app.post("/suggest", response_model=schemas.SuggestionResponse, tags=["Scoring"])
async def get_suggestions(
    request: schemas.SuggestionRequest,
    client: httpx.AsyncClient = Depends(get_http_client)
):
    try:
        return await scoring.get_suggestions(request, client)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")

# --- Agent Endpoints ---
@app.post("/agent/chat", response_model=schemas.AgentChatResponse, tags=["Agent"])
async def agent_chat(
    request: schemas.AgentChatRequest,
    agent=Depends(get_resume_agent)
):
    """
    Chat with the AI resume agent. The agent can:
    - Generate personalized resumes in JSON format
    - Calculate ATS scores
    - Provide improvement suggestions  
    - Edit and refine resumes based on feedback
    
    To start, provide a user_id, your message, and optionally a job_description.
    """
    try:
        return await agent.chat(request)
    except LLMError as e:
        raise HTTPException(status_code=502, detail=f"Agent service error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in agent chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected internal error occurred.")

@app.get("/agent/conversation/{conversation_id}", tags=["Agent"])
async def get_conversation_history(conversation_id: str):
    """Get the history of a conversation with the agent."""
    try:
        from resume_agent import conversation_store
        if conversation_id not in conversation_store:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation = conversation_store[conversation_id]
        return {
            "conversation_id": conversation.conversation_id,
            "user_id": conversation.user_id,
            "job_description": conversation.job_description,
            "current_resume": conversation.current_resume,
            "last_ats_score": conversation.last_ats_score,
            "message_history": conversation.message_history,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")