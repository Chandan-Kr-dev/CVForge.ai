# Unified configuration
import os
from dotenv import load_dotenv

# Force load .env file and override any existing environment variables
load_dotenv(override=True)

# --- General App Config ---
APP_NAME = "CVisionary Unified Service"
APP_VERSION = "2.0.0"

# --- MongoDB Config ---
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable not set.")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "test")

print(f"[CONFIG] FastAPI using DB: {MONGO_DB_NAME} at {MONGO_URI}")

# --- Unified Model Config ---
# We use the specialized model for ALL embedding and scoring tasks.
MODEL_NAME = "anass1209/resume-job-matcher-all-MiniLM-L6-v2"
EMBEDDING_DIM = 384 # This model uses 384 dimensions

# --- LLM Config ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GENERATION_TEMPERATURE = float(os.getenv("GENERATION_TEMPERATURE", "0.7"))
GENERATION_MAX_TOKENS = int(os.getenv("GENERATION_MAX_TOKENS", "2048"))