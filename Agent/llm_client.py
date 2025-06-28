import logging
import httpx
import json
import config

logger = logging.getLogger(__name__)

class LLMError(Exception):
    pass

async def invoke_gemini(client: httpx.AsyncClient, prompt: str, enforce_json: bool = True) -> str:
    if not config.GEMINI_API_KEY:
        raise LLMError("GEMINI_API_KEY environment variable is not set")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{config.GEMINI_MODEL}:generateContent?key={config.GEMINI_API_KEY}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": config.GENERATION_TEMPERATURE,
            "maxOutputTokens": config.GENERATION_MAX_TOKENS,
        },
    }
    if enforce_json:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    headers = {"Content-Type": "application/json"}
    logger.info(f"Invoking Gemini API with model {config.GEMINI_MODEL}")

    try:
        response = await client.post(url, json=payload, headers=headers, timeout=60.0)
        response.raise_for_status()
        response_data = response.json()

        generated_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
        logger.info("Successfully generated content from Gemini API")
        return generated_text.strip()

    except (httpx.HTTPStatusError, httpx.RequestError) as e:
        error_msg = f"Gemini API request failed: {e}"
        try:
            error_detail = e.response.json()
            error_msg += f" | Details: {error_detail}"
        except: pass
        logger.error(error_msg)
        raise LLMError(error_msg) from e

    except (KeyError, IndexError) as e:
        error_msg = f"Failed to parse Gemini response: {e}. Response: {response_data}"
        logger.error(error_msg)
        raise LLMError(error_msg) from e