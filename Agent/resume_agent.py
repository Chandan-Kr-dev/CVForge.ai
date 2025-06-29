import json
import logging
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import BaseTool, tool
from langchain.schema import BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
import config
import schemas
from modules import embedding, scoring, generation
from llm_client import LLMError
logger = logging.getLogger(__name__)
conversation_store: Dict[str, schemas.ConversationState] = {}
import pickle
import os
CONVERSATION_BACKUP_FILE = "conversation_backup.pkl"
def save_conversation_store():
    """Save the current conversation store to a backup file."""
    try:
        valid_conversations = {}
        for conv_id, conv in conversation_store.items():
            try:
                if hasattr(conv, 'conversation_id') and hasattr(conv, 'user_id'):
                    valid_conversations[conv_id] = conv
            except Exception as e:
                logger.warning(f"Skipping invalid conversation {conv_id}: {e}")
        with open(CONVERSATION_BACKUP_FILE, 'wb') as f:
            pickle.dump(valid_conversations, f)
        logger.debug(f"Saved {len(valid_conversations)} conversations to backup")
    except Exception as e:
        logger.error(f"Failed to save conversation store: {e}", exc_info=True)
def load_conversation_store():
    """Load conversation store from backup file if it exists."""
    global conversation_store
    try:
        if os.path.exists(CONVERSATION_BACKUP_FILE):
            with open(CONVERSATION_BACKUP_FILE, 'rb') as f:
                loaded_conversations = pickle.load(f)
            valid_conversations = {}
            for conv_id, conv in loaded_conversations.items():
                try:
                    if hasattr(conv, 'conversation_id') and hasattr(conv, 'user_id'):
                        valid_conversations[conv_id] = conv
                except Exception as e:
                    logger.warning(f"Skipping invalid loaded conversation {conv_id}: {e}")
            conversation_store.update(valid_conversations)
            logger.info(f"Loaded {len(valid_conversations)} valid conversations from backup")
        else:
            logger.info("No conversation backup file found, starting with empty store")
    except Exception as e:
        logger.error(f"Failed to load conversation store: {e}", exc_info=True)
        conversation_store = {}
load_conversation_store()
class ResumeGenerationInput(BaseModel):
    user_id: str = Field(description="The user ID for whom to generate the resume")
    job_description: str = Field(description="The job description to tailor the resume for")
class ATSScoreInput(BaseModel):
    resume_text: str = Field(description="The resume text to score")
    job_description: str = Field(description="The job description to score against")
class SuggestionInput(BaseModel):
    missing_keywords: List[str] = Field(description="List of missing keywords to get suggestions for")
class ResumeEditInput(BaseModel):
    current_resume: Dict = Field(description="The current resume JSON to edit")
    edit_instructions: str = Field(description="Instructions for how to edit the resume")
    job_description: str = Field(description="The job description to keep in mind for edits")
@tool
def generate_resume(user_id: str, job_description: str) -> str:
    """Generate a personalized resume for a user based on their profile and a job description."""
    try:
        return f"RESUME_GENERATION_REQUESTED|{user_id}|{job_description}"
    except Exception as e:
        logger.error(f"Error in resume generation tool: {e}")
        return f"Error preparing resume generation: {str(e)}"
@tool
def calculate_ats_score(resume_text: str = "", job_description: str = "") -> str:
    """Calculate the ATS (Applicant Tracking System) compatibility score for a resume against a job description."""
    try:
        return f"ATS_SCORE_REQUESTED|{len(resume_text)}|{len(job_description)}"
    except Exception as e:
        logger.error(f"Error in ATS score tool: {e}")
        return f"Error preparing ATS score calculation: {str(e)}"
@tool
def get_resume_suggestions(user_id: str = None, missing_keywords: List[str] = None) -> str:
    """Get personalized suggestions for improving a user's profile based on missing keywords from ATS analysis."""
    try:
        if not missing_keywords and user_id:
            user_conversations = [
                conv for conv in conversation_store.values() 
                if conv.user_id == user_id and conv.last_ats_score is not None
            ]
            if user_conversations:
                latest_conv = max(user_conversations, key=lambda c: len(c.message_history))
                if latest_conv.last_ats_score and latest_conv.last_ats_score.missing_keywords:
                    missing_keywords = latest_conv.last_ats_score.missing_keywords
        if not missing_keywords:
            return "I need to calculate your ATS score first to identify missing keywords. Please ask me to 'calculate my ATS score' or provide the missing keywords directly."
        return f"PROFILE_SUGGESTIONS_REQUESTED|{user_id}|{','.join(missing_keywords[:10])}"
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        return f"Error getting suggestions: {str(e)}"
@tool
def edit_resume_section(edit_instructions: str, job_description: str, user_id: str = None) -> str:
    """Edit a specific section of an existing resume based on user instructions and job requirements."""
    try:
        current_resume = None
        user_conversations = [
            conv for conv in conversation_store.values() 
            if conv.user_id == user_id and conv.current_resume is not None
        ]
        if user_conversations:
            latest_conv = max(user_conversations, key=lambda c: len(c.message_history))
            current_resume = latest_conv.current_resume
        if not current_resume:
            return "Error: No current resume found. Please generate a resume first."
        current_resume_json = json.dumps(current_resume)
        edit_prompt = f"""
You are an expert resume editor. You have a resume in JSON format and specific edit instructions.
Apply the edit instructions precisely and return ONLY the updated JSON resume.

Current Resume JSON:
{current_resume_json}

Edit Instructions:
{edit_instructions}

Job Description (for context):
{job_description}

CRITICAL RULES:
1. Return ONLY valid JSON with the EXACT same structure
2. If asked to remove a "summary" section, remove any field that contains summary/profile/objective content
3. Look for summary content in common locations like:
   - resume.basics.summary
   - resume.summary  
   - Any field with "summary", "profile", "objective", "about" in the key name
4. When removing sections, delete the entire field/key completely
5. If adding content, ensure it fits the existing structure and is relevant to the job description
6. If modifying content, improve it while following the instructions precisely
7. Preserve all other content exactly as provided

IMPORTANT: If the resume has nested structure like {{"resume": {{"basics": {{"summary": "..."}}}}}}, 
make sure to preserve the nesting and only modify the requested content within that structure.

Updated Resume JSON:
"""
        llm = ChatGoogleGenerativeAI(
            model=config.GEMINI_MODEL,
            google_api_key=config.GEMINI_API_KEY,
            temperature=0.3
        )
        response = llm.invoke(edit_prompt)
        edited_resume = response.content.strip()
        if edited_resume.startswith("```json"):
            edited_resume = edited_resume[7:]
        if edited_resume.endswith("```"):
            edited_resume = edited_resume[:-3]
        edited_resume = edited_resume.strip()
        try:
            json.loads(edited_resume)
            return edited_resume
        except json.JSONDecodeError:
            logger.error(f"LLM returned invalid JSON: {edited_resume[:200]}...")
            return "Error: Failed to generate valid edited resume JSON"
    except Exception as e:
        logger.error(f"Error editing resume: {e}")
        return f"Error editing resume: {str(e)}"
@tool
def check_user_data(user_id: str) -> str:
    """Check if user data exists in the conversation store and return the status of their resume, job description, and ATS score."""
    try:
        user_conversations = [
            conv for conv in conversation_store.values() 
            if conv.user_id == user_id
        ]
        if user_conversations:
            latest_conv = max(user_conversations, key=lambda x: x.updated_at)
            has_resume = bool(latest_conv.current_resume)
            has_job_desc = bool(latest_conv.job_description)
            has_ats_score = bool(latest_conv.last_ats_score)
            return f"USER_DATA_FOUND|resume:{has_resume}|job_desc:{has_job_desc}|ats_score:{has_ats_score}|conv_id:{latest_conv.conversation_id}"
        else:
            return "USER_DATA_NOT_FOUND"
    except Exception as e:
        logger.error(f"Error checking user data: {e}")
        return f"Error checking user data: {str(e)}"
class ResumeAgent:
    def __init__(self, http_client: httpx.AsyncClient):
        self.http_client = http_client
        self.llm = ChatGoogleGenerativeAI(
            model=config.GEMINI_MODEL,
            google_api_key=config.GEMINI_API_KEY,
            temperature=config.GENERATION_TEMPERATURE,
            max_tokens=config.GENERATION_MAX_TOKENS
        )
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are CVForge.ai, an expert AI resume consultant that takes immediate action. You help users create personalized, ATS-optimized resumes and provide career advice.
Your capabilities include:
1. IMMEDIATELY generating complete personalized resumes in JSON format based on user profiles and job descriptions
2. INSTANTLY calculating ATS scores to show how well resumes match job requirements  
3. RAPIDLY providing specific suggestions for improving user profiles to generate better resumes
4. QUICKLY editing and refining resume sections based on user feedback
5. CHECKING for existing user data to avoid unnecessary work
CRITICAL WORKFLOW:
- If user asks for ATS score and you see "Current Resume Available: No", first use check_user_data tool to see if they have existing data
- If the user has existing resume data, use it immediately for ATS scoring
- If user asks for ATS score and you see existing resume data in context, immediately use calculate_ats_score tool
- Only generate new resumes when the user explicitly asks for one OR when they ask for ATS score but have no existing resume
IMPORTANT CONTEXT AWARENESS:
- If the user has a "Current Resume Available: Yes" in the context, USE IT for ATS scoring without asking for resume text
- If the user asks for ATS score and you see existing resume data, immediately use the calculate_ats_score tool
- If the user mentions score, rating, match, or compatibility and there's a resume available, calculate the ATS score
- Never ask users to provide resume text if they already have a resume in the conversation
- When starting fresh conversations, check for existing user data first
TOOL USAGE RULES:
- When a user requests a resume or mentions they need one:
  * FIRST check the context - if you see "Current Resume Available: Yes", DO NOT use generate_resume tool
  * Instead, respond that their existing resume is ready and available in the response data
  * Only use the generate_resume tool if context shows "Current Resume Available: No"
- When they ask about ATS scores and have an existing resume, INSTANTLY use the calculate_ats_score tool
- When they need suggestions for improvement (using words like 'suggest', 'improve', 'recommendation', 'tip', 'advice', 'enhance', 'suggestions'), ALWAYS use the get_resume_suggestions tool with their user_id (this tool provides suggestions for improving their profile data, not the resume itself)
- When they want to edit their resume, PROMPTLY use the edit_resume_section tool with their user_id, edit instructions, and job description
- NEVER provide suggestions without using the get_resume_suggestions tool
- NEVER generate suggestions directly in your response - always use the get_resume_suggestions tool
- Remember: suggestions focus on improving profile data to generate better resumes, not editing existing resumes
RESPONSE FORMATTING RULES:
- NEVER include raw tool outputs or function returns in your final response
- When tools return signal patterns like "RESUME_GENERATION_REQUESTED" or "PROFILE_SUGGESTIONS_REQUESTED", do NOT echo these in your response
- Always provide user-friendly confirmation messages instead of technical output
- Focus on concise, helpful confirmations that tell the user what was accomplished
Always take action immediately - no queueing, no delays, no "I will" statements. Just do it right away.
Be helpful, professional, and provide actionable advice. Format your responses clearly and explain your recommendations."""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        self.tools = [
            generate_resume,
            calculate_ats_score,
            get_resume_suggestions,
            edit_resume_section,
            check_user_data
        ]
        self.agent = create_tool_calling_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=3,
            return_intermediate_steps=True
        )
    def get_or_create_conversation(self, user_id: str, conversation_id: Optional[str] = None) -> schemas.ConversationState:
        if conversation_id and conversation_id in conversation_store:
            conversation = conversation_store[conversation_id]
            conversation.updated_at = datetime.now()
            save_conversation_store()
            return conversation
        if not conversation_id:
            user_conversations = [
                conv for conv in conversation_store.values() 
                if conv.user_id == user_id
            ]
            if user_conversations:
                latest_conversation = max(user_conversations, key=lambda x: x.updated_at)
                latest_conversation.updated_at = datetime.now()
                save_conversation_store()
                logger.info(f"Found existing conversation {latest_conversation.conversation_id} for user {user_id}")
                return latest_conversation
        new_conversation_id = conversation_id or str(uuid.uuid4())
        conversation = schemas.ConversationState(
            conversation_id=new_conversation_id,
            user_id=user_id
        )
        conversation_store[new_conversation_id] = conversation
        save_conversation_store()
        logger.info(f"Created new conversation {new_conversation_id} for user {user_id}")
        return conversation
    async def chat(self, request: schemas.AgentChatRequest) -> schemas.AgentChatResponse:
        try:
            conversation = self.get_or_create_conversation(
                request.user_id, 
                request.conversation_id
            )
            if request.job_description:
                conversation.job_description = request.job_description
            conversation.message_history.append({
                "role": "user",
                "content": request.message,
                "timestamp": datetime.now().isoformat()
            })
            context = f"User ID: {request.user_id}\n"
            if conversation.job_description:
                context += f"Job Description: {conversation.job_description}\n"
            if conversation.current_resume:
                context += f"Current Resume Available: Yes (Generated in this conversation)\n"
                context += f"Resume Summary: {json.dumps(conversation.current_resume, indent=2)[:500]}...\n"
                if any(word in request.message.lower() for word in ['resume', 'cv', 'generate', 'show', 'create']):
                    context += f"IMPORTANT: User is asking for resume but already has one. Return the existing resume instead of generating new.\n"
            else:
                context += f"Current Resume Available: No\n"
            is_asking_for_ats = any(word in request.message.lower() for word in ['ats', 'score', 'rating', 'match', 'compatibility'])
            if is_asking_for_ats and conversation.current_resume and conversation.job_description:
                context += f"IMPORTANT: User has a resume and is asking for ATS score. Use the calculate_ats_score tool with the existing resume data.\n"
            agent_input = {
                "input": f"{context}\nUser Message: {request.message}",
                "chat_history": []
            }
            result = await self.agent_executor.ainvoke(agent_input)
            response_text = result["output"]
            intermediate_steps = result.get("intermediate_steps", [])
            resume_json = None
            ats_score = None
            tool_called = False
            for step in intermediate_steps:
                if len(step) >= 2:
                    action, observation = step
                    if hasattr(action, 'tool') and action.tool == 'check_user_data':
                        tool_called = True
                        if "USER_DATA_FOUND" in observation:
                            try:
                                parts = observation.split("|")
                                has_resume = "resume:True" in observation
                                has_job_desc = "job_desc:True" in observation
                                conv_id_part = [p for p in parts if p.startswith("conv_id:")]
                                if has_resume and has_job_desc and conv_id_part:
                                    existing_conv_id = conv_id_part[0].split(":")[1]
                                    if existing_conv_id in conversation_store:
                                        existing_conv = conversation_store[existing_conv_id]
                                        conversation.current_resume = existing_conv.current_resume
                                        conversation.job_description = existing_conv.job_description
                                        conversation.last_ats_score = existing_conv.last_ats_score
                                        if conversation.current_resume and conversation.job_description:
                                            logger.info("Using existing resume data for ATS score calculation")
                                            resume_text = json.dumps(conversation.current_resume)
                                            ats_score = await self.calculate_full_ats_score_async(
                                                resume_text, 
                                                conversation.job_description
                                            )
                                            conversation.last_ats_score = ats_score
                                            resume_json = conversation.current_resume
                                            response_text = self.get_safe_ats_score_response(ats_score)
                                            break
                                        else:
                                            response_text = "Found your previous data but missing either resume or job description. Let me generate a new resume for you."
                                    else:
                                        response_text = "I found some previous data but couldn't access it. Let me generate a new resume for you."
                                else:
                                    response_text = "I don't see any existing resume data for you. Let me generate a new resume first."
                            except Exception as e:
                                logger.error(f"Error processing user data check: {e}")
                                response_text = "Error accessing your previous data. Let me generate a new resume for you."
                        else:
                            response_text = "I don't see any existing resume data for you. Let me generate a new resume first, then calculate the ATS score."
                        break
                    elif hasattr(action, 'tool') and action.tool == 'generate_resume':
                        tool_called = True
                        try:
                            user_id = action.tool_input.get('user_id')
                            job_desc = action.tool_input.get('job_description')
                            if conversation.current_resume:
                                logger.info(f"User {user_id} already has a resume, returning existing one")
                                resume_json = conversation.current_resume
                                response_text = "Here's your existing resume! It's already been tailored for your target position. If you'd like to make any changes, just let me know what you'd like to edit."
                                break
                            elif user_id and job_desc:
                                logger.info(f"Generating new resume for user {user_id}")
                                resume_json = await self.generate_full_resume_async(user_id, job_desc)
                                conversation.current_resume = resume_json
                                response_text = "\u2705 I've successfully generated a personalized resume for you! The resume has been tailored specifically for your target position, highlighting your relevant experience and skills."
                                break
                            else:
                                response_text = "Error: Missing user_id or job_description for resume generation."
                                break
                        except Exception as e:
                            logger.error(f"Error generating resume: {e}")
                            response_text = f"I encountered an error while generating your resume: {str(e)}. Please ensure your profile is properly indexed and try again."
                            break
                    elif hasattr(action, 'tool') and action.tool == 'calculate_ats_score':
                        tool_called = True
                        try:
                            if conversation.current_resume and conversation.job_description:
                                logger.info("Calculating ATS score")
                                resume_text = json.dumps(conversation.current_resume)
                                ats_score = await self.calculate_full_ats_score_async(
                                    resume_text, 
                                    conversation.job_description
                                )
                                conversation.last_ats_score = ats_score
                                resume_json = conversation.current_resume
                                response_text = self.get_safe_ats_score_response(ats_score)
                                break
                            else:
                                response_text = "\u274c I need both a current resume and job description to calculate an ATS score. Please generate a resume first."
                                break
                        except Exception as e:
                            logger.error(f"Error calculating ATS score: {e}")
                            response_text = f"\u274c I encountered an error while calculating your ATS score: {str(e)}. Please try again."
                            break
                    elif hasattr(action, 'tool') and action.tool == 'edit_resume_section':
                        tool_called = True
                        try:
                            edited_resume_json = observation
                            if edited_resume_json.startswith("Error:"):
                                response_text = f"\u274c {edited_resume_json}"
                                break
                            try:
                                edited_resume = json.loads(edited_resume_json)
                                conversation.current_resume = edited_resume
                                resume_json = edited_resume
                                response_text = "\u2705 I've successfully updated your resume based on your instructions! The changes have been applied and your resume is ready."
                                if conversation.job_description:
                                    ats_score = await self.calculate_full_ats_score_async(
                                        edited_resume_json, 
                                        conversation.job_description
                                    )
                                    conversation.last_ats_score = ats_score
                                    response_text += f"\n\n\ud83d\udd04 **Updated ATS Score: {ats_score.final_score:.1%}**"
                                break
                            except json.JSONDecodeError:
                                response_text = "\u274c Error: The edited resume is not in valid JSON format. Please try again."
                                break
                        except Exception as e:
                            logger.error(f"Error editing resume: {e}")
                            response_text = f"\u274c I encountered an error while editing your resume: {str(e)}. Please try again."
                            break
                    elif hasattr(action, 'tool') and action.tool == 'get_resume_suggestions':
                        tool_called = True
                        try:
                            suggestions_text = observation
                            if suggestions_text.startswith("Error:") or suggestions_text.startswith("I need to calculate"):
                                response_text = f"\u274c {suggestions_text}"
                                break
                            if "PROFILE_SUGGESTIONS_REQUESTED" in suggestions_text:
                                try:
                                    parts = suggestions_text.split("|")
                                    if len(parts) >= 3:
                                        signal_user_id = parts[1]
                                        keywords_str = parts[2]
                                        keywords = [k.strip() for k in keywords_str.split(",") if k.strip()]
                                        logger.info(f"Generating AI profile suggestions for user {signal_user_id}")
                                        ai_suggestions_list = await self.generate_ai_profile_suggestions(
                                            signal_user_id, 
                                            keywords,
                                            conversation.job_description
                                        )
                                        suggestions_text = "\n".join([f"• {suggestion}" for suggestion in ai_suggestions_list])
                                        response_text = f"\u2705 I've analyzed your profile and generated personalized suggestions to help you improve your professional profile:\n\n{suggestions_text}"
                                        break
                                    else:
                                        response_text = "\u274c Error: Could not parse profile suggestion request."
                                        break
                                except Exception as e:
                                    logger.error(f"Error generating AI profile suggestions: {e}")
                                    response_text = f"\u274c I encountered an error while generating personalized profile suggestions: {str(e)}. Please try again."
                                    break
                            else:
                                response_text = suggestions_text
                                break
                        except Exception as e:
                            logger.error(f"Error getting suggestions: {e}")
                            response_text = f"\u274c I encountered an error while getting suggestions: {str(e)}. Please try again."
                            break
            if not tool_called:
                if "RESUME_GENERATION_REQUESTED" in response_text:
                    try:
                        parts = response_text.split("|")
                        if len(parts) >= 3:
                            tool_user_id = parts[1]
                            tool_job_description = parts[2]
                            if conversation.current_resume:
                                logger.info(f"User {tool_user_id} already has a resume, returning existing one (fallback method)")
                                resume_json = conversation.current_resume
                                response_text = "\u2705 Here's your existing resume! It's already been tailored for your target position. If you'd like to make any changes, just let me know what you'd like to edit."
                            else:
                                logger.info(f"Generating new resume for user {tool_user_id} (fallback method)")
                                resume_json = await self.generate_full_resume_async(
                                    tool_user_id, 
                                    tool_job_description
                                )
                                conversation.current_resume = resume_json
                                response_text = "\u2705 I've successfully generated a personalized resume for you! The resume has been tailored specifically for your target position, highlighting your relevant experience and skills."
                        else:
                            response_text = "\u274c Error: Could not parse resume generation request properly."
                    except Exception as e:
                        logger.error(f"Error generating resume: {e}")
                        response_text = f"\u274c I encountered an error while generating your resume: {str(e)}. Please ensure your profile is properly indexed and try again."
            elif "ATS_SCORE_REQUESTED" in response_text:
                try:
                    if conversation.current_resume and conversation.job_description:
                        resume_text = json.dumps(conversation.current_resume)
                        ats_score = await self.calculate_full_ats_score_async(
                            resume_text, 
                            conversation.job_description
                        )
                        conversation.last_ats_score = ats_score
                        resume_json = conversation.current_resume
                        response_text = self.get_safe_ats_score_response(ats_score)
                    else:
                        response_text = "\u274c I need both a current resume and job description to calculate an ATS score. Please generate a resume first."
                except Exception as e:
                    logger.error(f"Error calculating ATS score: {e}")
                    response_text = f"\u274c I encountered an error while calculating your ATS score: {str(e)}. Please try again."
            conversation.message_history.append({
                "role": "assistant", 
                "content": response_text,
                "timestamp": datetime.now().isoformat()
            })
            conversation_store[conversation.conversation_id] = conversation
            save_conversation_store()
            if resume_json is None and conversation.current_resume is not None:
                resume_json = conversation.current_resume
            response_text = self.clean_response_text(response_text)
            agent_response = schemas.AgentChatResponse(
                response=response_text,
                conversation_id=conversation.conversation_id,
                resume_json=resume_json,
                ats_score=ats_score
            )
            return agent_response
        except LLMError as e:
            logger.error(f"LLM error in agent chat: {e}")
            conversation.message_history.append({
                "role": "assistant", 
                "content": f"\u274c I encountered an issue with the AI service: {str(e)}. Please try again in a moment.",
                "timestamp": datetime.now().isoformat()
            })
            conversation_store[conversation.conversation_id] = conversation
            save_conversation_store()
            return schemas.AgentChatResponse(
                response=f"\u274c I encountered an issue with the AI service. Please try again in a moment.",
                conversation_id=conversation.conversation_id,
                resume_json=conversation.current_resume if conversation.current_resume else None,
                ats_score=None
            )
        except Exception as e:
            logger.error(f"Error in agent chat: {e}", exc_info=True)
            try:
                conversation.message_history.append({
                    "role": "assistant", 
                    "content": f"\u274c I encountered an unexpected error. Please try again.",
                    "timestamp": datetime.now().isoformat()
                })
                conversation_store[conversation.conversation_id] = conversation
                save_conversation_store()
            except:
                pass
            return schemas.AgentChatResponse(
                response=f"\u274c I encountered an unexpected error. Please try again.",
                conversation_id=getattr(conversation, 'conversation_id', str(uuid.uuid4())),
                resume_json=None,
                ats_score=None
            )
    async def generate_full_resume_async(self, user_id: str, job_description: str) -> Dict:
        try:
            request = schemas.FullGenerateRequest(
                user_id=user_id,
                job_description=job_description
            )
            resume_json_str = await generation.create_full_resume(request, self.http_client)
            resume_json = json.loads(resume_json_str)
            return resume_json
        except Exception as e:
            logger.error(f"Error in async resume generation: {e}")
            raise
    async def calculate_full_ats_score_async(self, resume_text: str, job_description: str) -> schemas.ScoreResponse:
        try:
            self.ensure_embedding_model_loaded()
            request = schemas.ScoreRequest(
                job_description=job_description,
                resume_text=resume_text
            )
            return await scoring.calculate_composite_score(request, self.http_client)
        except Exception as e:
            logger.error(f"Error in async ATS scoring: {e}")
            raise
    async def get_full_suggestions_async(self, missing_keywords: List[str]) -> schemas.SuggestionResponse:
        try:
            request = schemas.SuggestionRequest(missing_keywords=missing_keywords)
            return await scoring.get_suggestions(request, self.http_client)
        except Exception as e:
            logger.error(f"Error in async suggestions: {e}")
            raise
    def ensure_embedding_model_loaded(self):
        """Ensure the embedding model is loaded before use."""
        try:
            from modules import embedding
            embedding.init_db()
            embedding.load_model()
        except Exception as e:
            logger.warning(f"Could not load embedding model: {e}")
    async def generate_ai_profile_suggestions(self, user_id: str, missing_keywords: List[str], job_description: str = None) -> List[str]:
        try:
            user_profile_context = ""
            try:
                from modules import embedding
                profile_chunks = embedding.retrieve_chunks(
                    user_id=user_id,
                    query_text=" ".join(missing_keywords),
                    top_k=5,
                    namespace="profile"
                )
                if profile_chunks:
                    user_profile_context = "\n".join([
                        f"- {chunk['text']}" for chunk in profile_chunks[:3]
                    ])
                else:
                    user_profile_context = "No existing profile data found."
            except Exception as e:
                logger.warning(f"Could not retrieve profile context: {e}")
                user_profile_context = "Profile data unavailable."
            prompt = f"""You are an expert career consultant helping a user improve their professional profile. Based on the ATS analysis, the user is missing these key skills/technologies: {', '.join(missing_keywords)}.
User's Current Profile Context:
{user_profile_context}
{f"Target Job Requirements: {job_description}" if job_description else ""}
Generate specific, actionable suggestions for improving their professional profile to include the missing skills. Focus on:
1. Skill Development (courses, certifications, training)
2. Experience Building (hands-on practice, projects)
3. Profile Content (achievements, experiences to add)
4. Industry Alignment (positioning for target role)
Return your response as a JSON array of strings, where each string is a complete, actionable suggestion. Include 5-7 suggestions that are personalized and specific.
Example format:
[
  "Take a Docker certification course to demonstrate containerization skills and add it to your professional development section",
  "Build a personal project using Kubernetes and deploy it to showcase orchestration experience in your portfolio"
]
Focus on PROFILE improvements, not resume edits. Be specific and actionable."""
            from llm_client import invoke_gemini
            response = await invoke_gemini(self.http_client, prompt, enforce_json=True)
            import json
            suggestions_list = json.loads(response)
            if isinstance(suggestions_list, list) and all(isinstance(s, str) for s in suggestions_list):
                return suggestions_list
            else:
                logger.error(f"AI returned invalid format: {response}")
                return [
                    "Take courses or get certifications in the missing technologies to strengthen your profile",
                    "Build personal projects using the missing skills and add them to your experience",
                    "Update your profile with specific achievements involving these technologies",
                    "Consider freelance work or volunteering to gain experience with these tools",
                    "Join professional communities and contribute to open-source projects in these areas"
                ]
        except Exception as e:
            logger.error(f"Error generating AI profile suggestions: {e}")
            return [
                f"I encountered an error generating personalized suggestions: {str(e)}",
                "Please try again or contact support if the issue persists"
            ]
    def clean_response_text(self, text: str) -> str:
        import re
        import unicodedata
        
        # First, replace problematic Unicode escape sequences with safe alternatives
        unicode_replacements = {
            '\u274c': 'ERROR:',  # ❌ -> ERROR:
            '\u2705': 'SUCCESS:',  # ✅ -> SUCCESS:
            '\u26a0\ufe0f': 'WARNING:',  # ⚠️ -> WARNING:
            '\u26a0': 'WARNING:',  # ⚠ -> WARNING:
            '\ud83d\udcca': 'CHART:',  # 📊 -> CHART:
            '\ud83c\udfaf': 'TARGET:',  # 🎯 -> TARGET:
            '\ud83d\udcc8': 'TREND:',  # 📈 -> TREND:
            '\ud83c\udf89': 'CELEBRATION:',  # 🎉 -> CELEBRATION:
            '\ud83d\udca1': 'IDEA:',  # 💡 -> IDEA:
            '\ud83d\udd04': 'REFRESH:',  # 🔄 -> REFRESH:
        }
        
        # Replace the problematic Unicode characters
        for unicode_char, replacement in unicode_replacements.items():
            text = text.replace(unicode_char, replacement)
        
        # Normalize and clean Unicode characters to prevent encoding issues
        try:
            # Normalize Unicode and remove problematic surrogate pairs
            text = unicodedata.normalize('NFKC', text)
            # Remove any remaining problematic Unicode characters
            text = text.encode('utf-8', errors='ignore').decode('utf-8')
        except (UnicodeError, UnicodeDecodeError, UnicodeEncodeError):
            # If there are still Unicode issues, strip problematic characters
            text = ''.join(char for char in text if ord(char) < 65536)
        
        patterns_to_remove = [
            r'RESUME_GENERATION_REQUESTED\|[^|]*\|.*',
            r'ATS_SCORE_REQUESTED\|[^|]*\|.*',
            r'PROFILE_SUGGESTIONS_REQUESTED\|[^|]*\|.*',
            r'EDIT_RESUME_REQUESTED\|[^|]*\|.*',
            r'USER_DATA_FOUND\|.*',
            r'USER_DATA_NOT_FOUND'
        ]
        cleaned_text = text
        for pattern in patterns_to_remove:
            cleaned_text = re.sub(pattern, '', cleaned_text, flags=re.IGNORECASE)
        cleaned_text = re.sub(r'```json.*?```', '', cleaned_text, flags=re.DOTALL)
        cleaned_text = re.sub(r'```.*?```', '', cleaned_text, flags=re.DOTALL)
        cleaned_text = re.sub(r'\{[\s\S]*?"resume"[\s\S]*?\}', '', cleaned_text)
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        
        # Clean up the prefixes we added
        cleaned_text = cleaned_text.replace('ERROR: ', '').replace('SUCCESS: ', '').replace('WARNING: ', '')
        cleaned_text = cleaned_text.replace('CHART: ', '').replace('TARGET: ', '').replace('TREND: ', '')
        cleaned_text = cleaned_text.replace('CELEBRATION: ', '').replace('IDEA: ', '').replace('REFRESH: ', '')
        
        # Final Unicode safety check
        try:
            # Test if the cleaned text can be safely encoded
            cleaned_text.encode('utf-8')
        except UnicodeEncodeError:
            # If there are still issues, replace problematic characters
            cleaned_text = cleaned_text.encode('utf-8', errors='replace').decode('utf-8')
        
        if any(phrase in cleaned_text.lower() for phrase in ['here is the resume', 'here\'s the resume', 'the resume json']):
            if len(cleaned_text.split()) < 10:
                cleaned_text = "Your resume is ready! You can see the details in the resume data below."
        if not cleaned_text or cleaned_text.replace(' ', '').replace('.', '').replace('!', '').replace('?', '') == '':
            return "I've processed your request successfully!"
        return cleaned_text
    def get_safe_ats_score_response(self, ats_score) -> str:
        """Generate a safe ATS score response without problematic Unicode characters."""
        try:
            # Use safe text representations instead of potentially problematic emoji sequences
            missing_keywords_text = ""
            if ats_score.missing_keywords:
                keywords_preview = ', '.join(ats_score.missing_keywords[:8])
                missing_keywords_text = f"**Missing Keywords ({len(ats_score.missing_keywords)}):** {keywords_preview}"
                suggestion_text = "Would you like specific suggestions on how to improve your score?"
            else:
                missing_keywords_text = "**Excellent!** All important keywords are covered."
                suggestion_text = "Your resume is well-optimized for this position!"
            
            response = f"""**ATS Score Analysis Complete!**

**Overall ATS Score: {ats_score.final_score:.1%}**

**Detailed Breakdown:**
• Semantic Match: {ats_score.semantic_score:.1%} (Content alignment with job requirements)
• Keyword Match: {ats_score.keyword_score:.1%} (Coverage of important keywords)

{missing_keywords_text}

{suggestion_text}"""
            
            # Ensure the response is safe for UTF-8 encoding
            return self.clean_response_text(response)
        except Exception as e:
            logger.error(f"Error generating ATS score response: {e}")
            # Fallback to a simple text response
            return "ATS Score Analysis Complete! Check the score details in the response data."
class AsyncResumeAgent(ResumeAgent):
    pass
def create_resume_agent(http_client: httpx.AsyncClient) -> ResumeAgent:
    return ResumeAgent(http_client)
