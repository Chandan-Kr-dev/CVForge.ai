#!/usr/bin/env python3
"""
CLI Chat Interface for CVForge.ai Resume Agent

Usage:
    python cli_chat.py

This provides a simple command-line interface to interact with the resume agent.
You can generate resumes, get ATS scores, and ask for suggestions.
"""

import asyncio
import json
import httpx
from typing import Optional

import config
from resume_agent import create_resume_agent
from schemas import AgentChatRequest

class CLIChat:
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=60.0)
        self.agent = create_resume_agent(self.http_client)
        self.user_id = None
        self.conversation_id = None
        
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    def print_welcome(self):
        print("🤖 Welcome to CVForge.ai Resume Agent!")
        print("=" * 50)
        print("I can help you:")
        print("• Generate personalized resumes")
        print("• Calculate ATS scores")
        print("• Provide improvement suggestions")
        print("• Edit and refine your resume")
        print()
        print("Commands:")
        print("• /help - Show this help message")
        print("• /user <user_id> - Set your user ID")
        print("• /quit - Exit the chat")
        print("=" * 50)
        
    async def run(self):
        self.print_welcome()
        
        while True:
            try:
                if not self.user_id:
                    self.user_id = input("\n🆔 Enter your user ID: ").strip()
                    if not self.user_id:
                        print("❌ User ID cannot be empty!")
                        continue
                    print(f"✅ User ID set to: {self.user_id}")
                    continue
                
                # Get user input
                user_input = input(f"\n[{self.user_id}] You: ").strip()
                
                if not user_input:
                    continue
                    
                # Handle commands
                if user_input.startswith('/'):
                    if user_input == '/quit':
                        print("👋 Goodbye!")
                        break
                    elif user_input == '/help':
                        self.print_welcome()
                        continue
                    elif user_input.startswith('/user'):
                        parts = user_input.split(' ', 1)
                        if len(parts) > 1:
                            self.user_id = parts[1].strip()
                            self.conversation_id = None  # Reset conversation
                            print(f"✅ User ID changed to: {self.user_id}")
                        else:
                            print("❌ Usage: /user <user_id>")
                        continue
                    else:
                        print(f"❌ Unknown command: {user_input}")
                        continue
                
                # Check if user is providing a job description
                job_description = None
                if "job description:" in user_input.lower():
                    parts = user_input.split("job description:", 1)
                    if len(parts) > 1:
                        job_description = parts[1].strip()
                        user_input = parts[0].strip() or "Please generate my resume"
                
                # Create chat request
                request = AgentChatRequest(
                    user_id=self.user_id,
                    message=user_input,
                    job_description=job_description,
                    conversation_id=self.conversation_id
                )
                
                print("🤖 Agent: Thinking...")
                
                # Get response from agent
                response = await self.agent.chat(request)
                
                # Update conversation ID
                self.conversation_id = response.conversation_id
                
                # Print response
                print(f"🤖 Agent: {response.response}")
                
                # Show additional data if available
                if response.resume_json:
                    print("\n📄 Generated Resume:")
                    print(json.dumps(response.resume_json, indent=2))
                
                if response.ats_score:
                    print(f"\n📊 ATS Score: {response.ats_score.final_score:.1%}")
                    if response.ats_score.missing_keywords:
                        print(f"❗ Missing Keywords: {', '.join(response.ats_score.missing_keywords[:3])}...")
                
                if response.suggestions:
                    print("\n💡 Suggestions:")
                    for i, suggestion in enumerate(response.suggestions[:3], 1):
                        print(f"  {i}. {suggestion}")
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")

async def main():
    try:
        async with CLIChat() as chat:
            await chat.run()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")

if __name__ == "__main__":
    asyncio.run(main())
