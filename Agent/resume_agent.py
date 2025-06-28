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

# In-memory conversation storage (in production, use Redis or database)
# Adding persistence to survive server restarts
conversation_store: Dict[str, schemas.ConversationState] = {}

# Add a backup storage mechanism
import pickle
import os

CONVERSATION_BACKUP_FILE = "conversation_backup.pkl"

def save_conversation_store():
    """Save conversation store to disk"""
    try:
        with open(CONVERSATION_BACKUP_FILE, 'wb') as f:
            pickle.dump(conversation_store, f)
    except Exception as e:
        logger.error(f"Failed to save conversation store: {e}")

def load_conversation_store():
    """Load conversation store from disk"""
    global conversation_store
    try:
        if os.path.exists(CONVERSATION_BACKUP_FILE):
            with open(CONVERSATION_BACKUP_FILE, 'rb') as f:
                conversation_store = pickle.load(f)
                logger.info(f"Loaded {len(conversation_store)} conversations from backup")
    except Exception as e:
        logger.error(f"Failed to load conversation store: {e}")
        conversation_store = {}

# Load conversations on startup
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
    """Generate a personalized resume in JSON format based on user profile and job description."""
    try:
        # This tool signals that a resume should be generated immediately
        # The actual generation will be handled by the agent's async methods
        return f"RESUME_GENERATION_REQUESTED|{user_id}|{job_description}"
        
    except Exception as e:
        logger.error(f"Error in resume generation tool: {e}")
        return f"Error preparing resume generation: {str(e)}"

@tool
def calculate_ats_score(resume_text: str = "", job_description: str = "") -> str:
    """Calculate ATS score for a resume against a job description. Can work with existing conversation data."""
    try:
        # This tool signals that ATS scoring should be performed immediately
        return f"ATS_SCORE_REQUESTED|{len(resume_text)}|{len(job_description)}"
        
    except Exception as e:
        logger.error(f"Error in ATS score tool: {e}")
        return f"Error preparing ATS score calculation: {str(e)}"

@tool
def get_resume_suggestions(user_id: str = None, missing_keywords: List[str] = None) -> str:
    """Get suggestions for improving a resume based on missing keywords. If missing_keywords is not provided, will try to get them from the latest ATS score in the conversation."""
    try:
        # If missing_keywords not provided, try to get them from conversation state
        if not missing_keywords and user_id:
            user_conversations = [
                conv for conv in conversation_store.values() 
                if conv.user_id == user_id and conv.last_ats_score is not None
            ]
            
            if user_conversations:
                # Get the most recent conversation with an ATS score
                latest_conv = max(user_conversations, key=lambda c: len(c.message_history))
                if latest_conv.last_ats_score and latest_conv.last_ats_score.missing_keywords:
                    missing_keywords = latest_conv.last_ats_score.missing_keywords
        
        if not missing_keywords:
            return "I need to calculate your ATS score first to identify missing keywords. Please ask me to 'calculate my ATS score' or provide the missing keywords directly."
        
        suggestions = []
        suggestions.append("🎯 **Resume Improvement Suggestions:**\n")
        
        for i, keyword in enumerate(missing_keywords[:7], 1):  # Limit to top 7
            suggestions.append(f"{i}. **Add '{keyword}'** to relevant sections of your resume")
            suggestions.append(f"   • Look for ways to incorporate '{keyword}' in your experience descriptions")
            suggestions.append(f"   • Consider adding '{keyword}' to your skills section if applicable\n")
        
        suggestions.append("💡 **Pro Tips:**")
        suggestions.append("• Use these keywords naturally in context, don't just list them")
        suggestions.append("• Focus on the most relevant keywords for your target role")
        suggestions.append("• Update your experience descriptions to include these technologies/skills")
        
        return "\n".join(suggestions)
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        return f"Error getting suggestions: {str(e)}"

@tool
def edit_resume_section(edit_instructions: str, job_description: str, user_id: str = None) -> str:
    """Edit a specific section of the resume based on user instructions. The current resume will be retrieved from the conversation state."""
    try:
        # Find the current conversation for this user
        current_resume = None
        user_conversations = [
            conv for conv in conversation_store.values() 
            if conv.user_id == user_id and conv.current_resume is not None
        ]
        
        if user_conversations:
            # Get the most recent conversation with a resume
            latest_conv = max(user_conversations, key=lambda c: len(c.message_history))
            current_resume = latest_conv.current_resume
        
        if not current_resume:
            return "Error: No current resume found. Please generate a resume first."
        
        # Convert resume to JSON string for processing
        current_resume_json = json.dumps(current_resume)
        
        # Use LLM to intelligently apply the edit instructions
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
        
        # Get LLM instance and process the edit
        llm = ChatGoogleGenerativeAI(
            model=config.GEMINI_MODEL,
            google_api_key=config.GEMINI_API_KEY,
            temperature=0.3
        )
        
        response = llm.invoke(edit_prompt)
        edited_resume = response.content.strip()
        
        # Clean up the response to extract just the JSON
        if edited_resume.startswith("```json"):
            edited_resume = edited_resume[7:]
        if edited_resume.endswith("```"):
            edited_resume = edited_resume[:-3]
        edited_resume = edited_resume.strip()
        
        # Validate the edited resume is valid JSON
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
    """Check if a user has any existing resumes or conversation data available."""
    try:
        # Check conversation store for existing data
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
        
        # Initialize the LLM
        self.llm = ChatGoogleGenerativeAI(
            model=config.GEMINI_MODEL,
            google_api_key=config.GEMINI_API_KEY,
            temperature=config.GENERATION_TEMPERATURE,
            max_tokens=config.GENERATION_MAX_TOKENS
        )
        
        # Create the prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are CVForge.ai, an expert AI resume consultant that takes immediate action. You help users create personalized, ATS-optimized resumes and provide career advice.

Your capabilities include:
1. IMMEDIATELY generating complete personalized resumes in JSON format based on user profiles and job descriptions
2. INSTANTLY calculating ATS scores to show how well resumes match job requirements  
3. RAPIDLY providing specific suggestions for resume improvements
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
- When a user requests a resume or mentions they need one, FIRST check if they already have a resume in the conversation. If they do, return the existing resume instead of generating a new one (unless they specifically ask for edits or a new version)
- Only use the generate_resume tool if no existing resume is found or if the user explicitly requests a new/different resume
- When they ask about ATS scores and have an existing resume, INSTANTLY use the calculate_ats_score tool
- When they need suggestions for improvement (using words like 'suggest', 'improve', 'recommendation', 'tip', 'advice', 'enhance'), ALWAYS use the get_resume_suggestions tool with their user_id (the tool will automatically find missing keywords from recent ATS scores)
- When they want to edit their resume, PROMPTLY use the edit_resume_section tool with their user_id, edit instructions, and job description
- NEVER provide suggestions without using the get_resume_suggestions tool

Always take action immediately - no queueing, no delays, no "I will" statements. Just do it right away.
Be helpful, professional, and provide actionable advice. Format your responses clearly and explain your recommendations."""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create tools list
        self.tools = [
            generate_resume,
            calculate_ats_score,
            get_resume_suggestions,
            edit_resume_section,
            check_user_data
        ]
        
        # Create the agent
        self.agent = create_tool_calling_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=3,  # Increased from 1 to allow for complex operations
            return_intermediate_steps=True  # Get tool call details
        )
    
    def get_or_create_conversation(self, user_id: str, conversation_id: Optional[str] = None) -> schemas.ConversationState:
        """Get existing conversation or create a new one."""
        if conversation_id and conversation_id in conversation_store:
            conversation = conversation_store[conversation_id]
            conversation.updated_at = datetime.now()
            save_conversation_store()  # Save after update
            return conversation
        
        # If no conversation_id provided, check if user has any existing conversations
        if not conversation_id:
            # Find the most recent conversation for this user
            user_conversations = [
                conv for conv in conversation_store.values() 
                if conv.user_id == user_id
            ]
            if user_conversations:
                # Get the most recent conversation
                latest_conversation = max(user_conversations, key=lambda x: x.updated_at)
                latest_conversation.updated_at = datetime.now()
                save_conversation_store()
                logger.info(f"Found existing conversation {latest_conversation.conversation_id} for user {user_id}")
                return latest_conversation
        
        # Create new conversation
        new_conversation_id = conversation_id or str(uuid.uuid4())
        conversation = schemas.ConversationState(
            conversation_id=new_conversation_id,
            user_id=user_id
        )
        conversation_store[new_conversation_id] = conversation
        save_conversation_store()  # Save after creation
        logger.info(f"Created new conversation {new_conversation_id} for user {user_id}")
        return conversation
    
    async def chat(self, request: schemas.AgentChatRequest) -> schemas.AgentChatResponse:
        """Process a chat message and return a response."""
        try:
            # Get or create conversation
            conversation = self.get_or_create_conversation(
                request.user_id, 
                request.conversation_id
            )
            
            # Update job description if provided
            if request.job_description:
                conversation.job_description = request.job_description
            
            # Add user message to history
            conversation.message_history.append({
                "role": "user",
                "content": request.message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Prepare context for the agent
            context = f"User ID: {request.user_id}\n"
            if conversation.job_description:
                context += f"Job Description: {conversation.job_description}\n"
            if conversation.current_resume:
                context += f"Current Resume Available: Yes (Generated in this conversation)\n"
                context += f"Resume Summary: {json.dumps(conversation.current_resume, indent=2)[:500]}...\n"
            else:
                context += f"Current Resume Available: No\n"
            
            # Detect if user is asking for ATS score and we have resume
            is_asking_for_ats = any(word in request.message.lower() for word in ['ats', 'score', 'rating', 'match', 'compatibility'])
            
            # Enhanced context for ATS score requests
            if is_asking_for_ats and conversation.current_resume and conversation.job_description:
                context += f"IMPORTANT: User has a resume and is asking for ATS score. Use the calculate_ats_score tool with the existing resume data.\n"
            
            # Create input for the agent
            agent_input = {
                "input": f"{context}\nUser Message: {request.message}",
                "chat_history": []  # Could be populated with previous messages
            }
            
            # Get response from agent
            result = await self.agent_executor.ainvoke(agent_input)
            response_text = result["output"]
            intermediate_steps = result.get("intermediate_steps", [])
            
            # Check for special tool responses and handle them
            resume_json = None
            ats_score = None
            suggestions = None
            
            # Check if any tools were called by examining intermediate steps
            tool_called = False
            for step in intermediate_steps:
                if len(step) >= 2:
                    action, observation = step
                    if hasattr(action, 'tool') and action.tool == 'check_user_data':
                        tool_called = True
                        # Handle user data check result
                        if "USER_DATA_FOUND" in observation:
                            try:
                                parts = observation.split("|")
                                has_resume = "resume:True" in observation
                                has_job_desc = "job_desc:True" in observation
                                conv_id_part = [p for p in parts if p.startswith("conv_id:")]
                                
                                if has_resume and has_job_desc and conv_id_part:
                                    # Update the conversation to use existing data
                                    existing_conv_id = conv_id_part[0].split(":")[1]
                                    if existing_conv_id in conversation_store:
                                        existing_conv = conversation_store[existing_conv_id]
                                        conversation.current_resume = existing_conv.current_resume
                                        conversation.job_description = existing_conv.job_description
                                        conversation.last_ats_score = existing_conv.last_ats_score
                                        
                                        # Now calculate ATS score with existing data
                                        if conversation.current_resume and conversation.job_description:
                                            logger.info("Using existing resume data for ATS score calculation")
                                            resume_text = json.dumps(conversation.current_resume)
                                            ats_score = await self.calculate_full_ats_score_async(
                                                resume_text, 
                                                conversation.job_description
                                            )
                                            conversation.last_ats_score = ats_score
                                            resume_json = conversation.current_resume  # Include current resume in response
                                            
                                            response_text = f"""📊 **ATS Score Analysis Complete!**

🎯 **Overall ATS Score: {ats_score.final_score:.1%}**

📈 **Detailed Breakdown:**
• Semantic Match: {ats_score.semantic_score:.1%} (Content alignment with job requirements)
• Keyword Match: {ats_score.keyword_score:.1%} (Coverage of important keywords)

{f"⚠️ **Missing Keywords ({len(ats_score.missing_keywords)}):** {', '.join(ats_score.missing_keywords[:8])}" if ats_score.missing_keywords else "✅ **Excellent!** All important keywords are covered."}

{f"💡 Would you like specific suggestions on how to improve your score?" if ats_score.missing_keywords else "🎉 Your resume is well-optimized for this position!"}"""
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
                        # Extract parameters from the action
                        try:
                            user_id = action.tool_input.get('user_id')
                            job_desc = action.tool_input.get('job_description')
                            
                            # First check if user already has a resume in conversation
                            if conversation.current_resume:
                                logger.info(f"User {user_id} already has a resume, returning existing one")
                                resume_json = conversation.current_resume
                                response_text = "✅ Here's your existing resume! It's already been tailored for your target position. If you'd like to make any changes, just let me know what you'd like to edit."
                                break
                            elif user_id and job_desc:
                                logger.info(f"Generating new resume for user {user_id}")
                                resume_json = await self.generate_full_resume_async(user_id, job_desc)
                                conversation.current_resume = resume_json
                                response_text = "✅ I've successfully generated a personalized resume for you! The resume has been tailored specifically for your target position, highlighting your relevant experience and skills."
                                break
                            else:
                                response_text = "❌ Error: Missing user_id or job_description for resume generation."
                                break
                        except Exception as e:
                            logger.error(f"Error generating resume: {e}")
                            response_text = f"❌ I encountered an error while generating your resume: {str(e)}. Please ensure your profile is properly indexed and try again."
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
                                resume_json = conversation.current_resume  # Include current resume in response
                                
                                response_text = f"""📊 **ATS Score Analysis Complete!**

🎯 **Overall ATS Score: {ats_score.final_score:.1%}**

📈 **Detailed Breakdown:**
• Semantic Match: {ats_score.semantic_score:.1%} (Content alignment with job requirements)
• Keyword Match: {ats_score.keyword_score:.1%} (Coverage of important keywords)

{f"⚠️ **Missing Keywords ({len(ats_score.missing_keywords)}):** {', '.join(ats_score.missing_keywords[:8])}" if ats_score.missing_keywords else "✅ **Excellent!** All important keywords are covered."}

{f"💡 Would you like specific suggestions on how to improve your score?" if ats_score.missing_keywords else "🎉 Your resume is well-optimized for this position!"}"""
                                break
                            else:
                                response_text = "❌ I need both a current resume and job description to calculate an ATS score. Please generate a resume first."
                                break
                        except Exception as e:
                            logger.error(f"Error calculating ATS score: {e}")
                            response_text = f"❌ I encountered an error while calculating your ATS score: {str(e)}. Please try again."
                            break
                    
                    elif hasattr(action, 'tool') and action.tool == 'edit_resume_section':
                        tool_called = True
                        try:
                            # The tool should return the edited resume JSON
                            edited_resume_json = observation
                            
                            # Check if it's valid JSON
                            if edited_resume_json.startswith("Error:"):
                                response_text = f"❌ {edited_resume_json}"
                                break
                            
                            try:
                                # Parse and update the resume
                                edited_resume = json.loads(edited_resume_json)
                                conversation.current_resume = edited_resume
                                resume_json = edited_resume  # Return the edited resume
                                
                                response_text = "✅ I've successfully updated your resume based on your instructions! The changes have been applied and your resume is ready."
                                
                                # If we have a job description, recalculate ATS score
                                if conversation.job_description:
                                    ats_score = await self.calculate_full_ats_score_async(
                                        edited_resume_json, 
                                        conversation.job_description
                                    )
                                    conversation.last_ats_score = ats_score
                                    
                                    response_text += f"\n\n🔄 **Updated ATS Score: {ats_score.final_score:.1%}**"
                                    
                                break
                            except json.JSONDecodeError:
                                response_text = "❌ Error: The edited resume is not in valid JSON format. Please try again."
                                break
                        except Exception as e:
                            logger.error(f"Error editing resume: {e}")
                            response_text = f"❌ I encountered an error while editing your resume: {str(e)}. Please try again."
                            break
                    
                    elif hasattr(action, 'tool') and action.tool == 'get_resume_suggestions':
                        tool_called = True
                        try:
                            # The tool should return suggestions text
                            suggestions_text = observation
                            
                            # Check if it's an error
                            if suggestions_text.startswith("Error:") or suggestions_text.startswith("I need to calculate"):
                                response_text = f"❌ {suggestions_text}"
                                break
                            
                            # Set the suggestions and include current resume
                            suggestions = [suggestions_text]  # Wrap in list for compatibility
                            resume_json = conversation.current_resume  # Include current resume in response
                            
                            response_text = suggestions_text
                            break
                            
                        except Exception as e:
                            logger.error(f"Error getting suggestions: {e}")
                            response_text = f"❌ I encountered an error while getting suggestions: {str(e)}. Please try again."
                            break
            
            # Fall back to old method if no tools were detected in intermediate steps
            if not tool_called:
                # Process tool responses from the response text
                if "RESUME_GENERATION_REQUESTED" in response_text:
                    try:
                        # Extract parameters from the tool response
                        parts = response_text.split("|")
                        if len(parts) >= 3:
                            tool_user_id = parts[1]
                            tool_job_description = parts[2]
                            
                            # First check if user already has a resume in conversation
                            if conversation.current_resume:
                                logger.info(f"User {tool_user_id} already has a resume, returning existing one (fallback method)")
                                resume_json = conversation.current_resume
                                response_text = "✅ Here's your existing resume! It's already been tailored for your target position. If you'd like to make any changes, just let me know what you'd like to edit."
                            else:
                                # Generate new resume
                                logger.info(f"Generating new resume for user {tool_user_id} (fallback method)")
                                resume_json = await self.generate_full_resume_async(
                                    tool_user_id, 
                                    tool_job_description
                                )
                                conversation.current_resume = resume_json
                                response_text = "✅ I've successfully generated a personalized resume for you! The resume has been tailored specifically for your target position, highlighting your relevant experience and skills."
                        else:
                            response_text = "❌ Error: Could not parse resume generation request properly."
                    except Exception as e:
                        logger.error(f"Error generating resume: {e}")
                        response_text = f"❌ I encountered an error while generating your resume: {str(e)}. Please ensure your profile is properly indexed and try again."
            
            elif "ATS_SCORE_REQUESTED" in response_text:
                try:
                    if conversation.current_resume and conversation.job_description:
                        # Convert resume to text for scoring
                        resume_text = json.dumps(conversation.current_resume)
                        ats_score = await self.calculate_full_ats_score_async(
                            resume_text, 
                            conversation.job_description
                        )
                        conversation.last_ats_score = ats_score
                        resume_json = conversation.current_resume  # Include current resume in response
                        
                        response_text = f"""📊 **ATS Score Analysis Complete!**

🎯 **Overall ATS Score: {ats_score.final_score:.1%}**

� **Detailed Breakdown:**
• Semantic Match: {ats_score.semantic_score:.1%} (Content alignment with job requirements)
• Keyword Match: {ats_score.keyword_score:.1%} (Coverage of important keywords)

{f"⚠️ **Missing Keywords ({len(ats_score.missing_keywords)}):** {', '.join(ats_score.missing_keywords[:8])}" if ats_score.missing_keywords else "✅ **Excellent!** All important keywords are covered."}

{f"💡 Would you like specific suggestions on how to improve your score?" if ats_score.missing_keywords else "🎉 Your resume is well-optimized for this position!"}"""
                    else:
                        response_text = "❌ I need both a current resume and job description to calculate an ATS score. Please generate a resume first."
                except Exception as e:
                    logger.error(f"Error calculating ATS score: {e}")
                    response_text = f"❌ I encountered an error while calculating your ATS score: {str(e)}. Please try again."
            
            # Let the agent handle everything through tools - removed fallback logic
            
            # Add assistant response to history
            conversation.message_history.append({
                "role": "assistant", 
                "content": response_text,
                "timestamp": datetime.now().isoformat()
            })
            
            # Update conversation store
            conversation_store[conversation.conversation_id] = conversation
            save_conversation_store()  # Save after each interaction
            
            # Always ensure resume_json is set to the current resume if available
            if resume_json is None and conversation.current_resume is not None:
                resume_json = conversation.current_resume
            
            # Prepare response
            agent_response = schemas.AgentChatResponse(
                response=response_text,
                conversation_id=conversation.conversation_id,
                resume_json=resume_json,
                ats_score=ats_score,
                suggestions=suggestions
            )
            
            return agent_response
            
        except Exception as e:
            logger.error(f"Error in agent chat: {e}")
            raise LLMError(f"Agent error: {str(e)}")
    
    async def generate_full_resume_async(self, user_id: str, job_description: str) -> Dict:
        """Generate a complete resume using the full pipeline."""
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
        """Calculate full ATS score using the scoring pipeline."""
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
        """Get full suggestions using the suggestion pipeline."""
        try:
            request = schemas.SuggestionRequest(missing_keywords=missing_keywords)
            return await scoring.get_suggestions(request, self.http_client)
            
        except Exception as e:
            logger.error(f"Error in async suggestions: {e}")
            raise

    def ensure_embedding_model_loaded(self):
        """Ensure the embedding model is loaded for ATS scoring operations."""
        try:
            from modules import embedding
            embedding.init_db()
            embedding.load_model()
        except Exception as e:
            logger.warning(f"Could not load embedding model: {e}")
# Enhanced tools that can use the HTTP client for full functionality
class AsyncResumeAgent(ResumeAgent):
    """Enhanced agent with full async capabilities."""
    pass

def create_resume_agent(http_client: httpx.AsyncClient) -> ResumeAgent:
    """Factory function to create a resume agent."""
    return ResumeAgent(http_client)
