import logging
import uuid
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
import numpy as np
from pymongo import MongoClient
from pymongo.collection import Collection
from sentence_transformers import SentenceTransformer, util
import nltk
import config

logger = logging.getLogger(__name__)

class EmbeddingState:
    def __init__(self):
        self.model: Optional[SentenceTransformer] = None
        self.mongo_client: Optional[MongoClient] = None
        self.db = None

state = EmbeddingState()

def load_model():
    """Load the sentence transformer model if not already loaded."""
    if state.model is None:
        logger.info(f"Loading sentence transformer model: {config.MODEL_NAME}")
        state.model = SentenceTransformer(config.MODEL_NAME)
        logger.info("Model loaded successfully.")
    return state.model

def embed_texts(texts: List[str]) -> np.ndarray:
    if state.model is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")
    embeddings = state.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.astype(np.float32)

def embed_text(text: str) -> np.ndarray:
    return embed_texts([text])[0]

def init_db():
    """Initialize MongoDB connection if not already connected."""
    if state.mongo_client is None:
        logger.info("Connecting to MongoDB Atlas...")
        state.mongo_client = MongoClient(config.MONGO_URI)
        state.db = state.mongo_client[config.MONGO_DB_NAME]
        try:
            state.mongo_client.admin.command('ping')
            logger.info("MongoDB connection successful.")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise

def get_chunks_collection() -> Collection:
    if state.db is None: init_db()
    return state.db["chunks"]

def chunk_text(text: str, max_words: int = 150) -> List[str]:
    if not text or not text.strip(): return []
    try:
        sentences = nltk.sent_tokenize(text)
    except LookupError:
        logger.info("Downloading NLTK 'punkt' tokenizer...")
        nltk.download("punkt", quiet=True)
        sentences = nltk.sent_tokenize(text)
    chunks, current_chunk, current_word_count = [], [], 0
    for sentence in sentences:
        words = len(sentence.split())
        if current_word_count + words > max_words and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk, current_word_count = [sentence], words
        else:
            current_chunk.append(sentence)
            current_word_count += words
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    return chunks

def index_user_profile(user_id: str) -> int:
    profiles_collection = state.db["profiles"]
    profile_data = profiles_collection.find_one({"user_id": user_id})
    if not profile_data:
        raise ValueError(f"Profile for user_id '{user_id}' not found.")
    text_fields = []
    for key in ['fullName', 'summary', 'bio', 'headline']:
        if profile_data.get(key): 
            text_fields.append((key, '0', str(profile_data[key])))
    for key in ['email', 'phone']:
        if profile_data.get(key):
            text_fields.append((key, '0', str(profile_data[key])))
    if profile_data.get('skills'):
        text_fields.append(('skills', '0', ', '.join(profile_data['skills'])))
    for i, exp in enumerate(profile_data.get('experience', [])):
        exp_text_parts = []
        if exp.get('position'): exp_text_parts.append(f"Position: {exp['position']}")
        if exp.get('company'): exp_text_parts.append(f"Company: {exp['company']}")
        if exp.get('duration'): exp_text_parts.append(f"Duration: {exp['duration']}")
        if exp.get('location'): exp_text_parts.append(f"Location: {exp['location']}")
        if exp.get('description'): exp_text_parts.append(f"Description: {exp['description']}")
        if exp_text_parts:
            text_fields.append(('experience', str(i), '. '.join(exp_text_parts)))
    for i, edu in enumerate(profile_data.get('education', [])):
        edu_text_parts = []
        if edu.get('degree'): edu_text_parts.append(f"Degree: {edu['degree']}")
        if edu.get('institution'): edu_text_parts.append(f"Institution: {edu['institution']}")
        if edu.get('duration'): edu_text_parts.append(f"Duration: {edu['duration']}")
        if edu.get('location'): edu_text_parts.append(f"Location: {edu['location']}")
        if edu_text_parts:
            text_fields.append(('education', str(i), '. '.join(edu_text_parts)))
    if profile_data.get('certifications'):
        cert_text = ', '.join(profile_data['certifications'])
        text_fields.append(('certifications', '0', cert_text))
    if not text_fields: return 0
    chunks_collection = get_chunks_collection()
    chunks_collection.delete_many({"user_id": user_id, "index_namespace": "profile"})
    total_chunks = 0
    for source_type, source_id, text in text_fields:
        chunks = chunk_text(text)
        if not chunks: continue
        embeddings = embed_texts(chunks)
        docs = []
        for i, chunk in enumerate(chunks):
            docs.append({
                "_id": str(uuid.uuid4()), "user_id": user_id, "index_namespace": "profile",
                "source_type": source_type, "source_id": f"{source_id}_{i}", "text": chunk,
                "embedding": embeddings[i].tolist(), "created_at": datetime.now(timezone.utc)
            })
        if docs:
            chunks_collection.insert_many(docs)
            total_chunks += len(docs)
    state.db["users"].update_one(
        {"user_id": user_id},
        {"$set": {"embeddings_last_updated": datetime.now(timezone.utc)}},
        upsert=True
    )
    return total_chunks

def retrieve_chunks(user_id: str, query_text: str, top_k: int, namespace: str = "profile") -> List[Dict[str, Any]]:
    if not state.db["users"].find_one({"user_id": user_id}):
        logger.info(f"User '{user_id}' not indexed. Triggering autonomous indexing...")
        index_user_profile(user_id)
        logger.info(f"Autonomous indexing for user '{user_id}' complete.")
    query_vector = embed_text(query_text).tolist()
    pipeline = [
        {"$vectorSearch": {
            "index": "vector_index", "path": "embedding", "queryVector": query_vector,
            "numCandidates": top_k * 10, "limit": top_k, 
            "filter": {"user_id": user_id, "index_namespace": namespace},
        }},
        {"$project": {
            "chunk_id": "$_id", "text": 1, "source_type": 1, "source_id": 1,
            "score": {"$meta": "vectorSearchScore"}
        }}
    ]
    semantic_results = list(get_chunks_collection().aggregate(pipeline))
    essential_source_types = ["fullName", "email", "phone"]
    essential_chunks = list(get_chunks_collection().find({
        "user_id": user_id, 
        "index_namespace": namespace,
        "source_type": {"$in": essential_source_types}
    }, {"chunk_id": "$_id", "text": 1, "source_type": 1, "source_id": 1}).limit(5))
    for chunk in essential_chunks:
        chunk["score"] = 1.0
    seen_chunks = set()
    combined_results = []
    for chunk in essential_chunks:
        chunk_id = str(chunk["chunk_id"])
        if chunk_id not in seen_chunks:
            combined_results.append(chunk)
            seen_chunks.add(chunk_id)
    for chunk in semantic_results:
        chunk_id = str(chunk["chunk_id"])
        if chunk_id not in seen_chunks:
            combined_results.append(chunk)
            seen_chunks.add(chunk_id)
    max_results = min(top_k + len(essential_chunks), 15)
    return combined_results[:max_results]

def compute_semantic_score(text1: str, text2: str) -> float:
    embeddings = embed_texts([text1, text2])
    cosine_score = util.cos_sim(embeddings[0], embeddings[1]).item()
    return (cosine_score + 1) / 2