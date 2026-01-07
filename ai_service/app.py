
import os
import re
import json
import time
import logging
import uuid
from pathlib import Path
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv

# New SDK Import
from google import genai
from google.genai import types

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
PROMPT_DIR = BASE_DIR / "prompts"
LOG_DIR = BASE_DIR / "logs"

# Create logs directory if it doesn't exist
LOG_DIR.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / "ai_service.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Separate logger for API requests/responses
api_logger = logging.getLogger("api_calls")
api_handler = logging.FileHandler(LOG_DIR / "api_calls.log")
api_handler.setFormatter(logging.Formatter('%(asctime)s | %(message)s'))
api_logger.addHandler(api_handler)
api_logger.setLevel(logging.DEBUG)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = Flask(__name__)
CORS(app)

# ============================================================================
# CIRCUIT BREAKER STATE
# ============================================================================
# Circuit breaker state
circuit_breaker = {
    "failures": 0,
    "last_failure": None,
    "is_open": False,
    "threshold": 5, 
    "reset_timeout": 60
}

# ============================================================================
# REQUEST HISTORY
# ============================================================================
# Request history for debugging
request_history = []
MAX_HISTORY = 10

def add_to_history(entry):
    request_history.append(entry)
    if len(request_history) > MAX_HISTORY:
        request_history.pop(0)

# ============================================================================
# DEFAULT CONTEXT VALUES
# ============================================================================
# Default Context Values
DEFAULTS = {
    "user_name": "User",
    "track_theme": "General Productivity",
    "current_level": "1",
    "time_of_day": "Day",
    "available_time": "flexible",
    "recent_tasks": "None",
    "pending_tasks": "None",
    "patterns": "None",
    "accomplishments": "None",
    "recent_accomplishments": "None",
    "reflection": "None",
    "reflection_snippet": "None",
    "highlights": "None",
    "challenges": "None",
    "next_focus": "None",
    "mood": "Neutral",
    "streak_days": "0",
    "tasks_completed_today": "0",
    "recent_wins": "None",
    "stumbling_blocks": "None",
    "challenge_category": "General",
    "difficulty": "Easy",
    "tasks_completed": "None",
    "challenges_faced": "None",
    "performance_trend": "Stable",
    "availability": "Flexible"
}

# ============================================================================
# ERROR HANDLING
# ============================================================================
# Error Messages
ERROR_MESSAGES = {
    "INVALID_API_KEY": "API key is invalid or expired.",
    "QUOTA_EXCEEDED": "API quota exceeded.",
    "RATE_LIMITED": "Too many requests.",
    "SERVICE_UNAVAILABLE": "Gemini service unavailable.",
    "CIRCUIT_OPEN": "Service temporarily disabled.",
    "TIMEOUT": "Request timed out.",
    "UNKNOWN": "An unexpected error occurred."
}

def get_error_type(exception):
    error_str = str(exception).lower()
    if "401" in error_str or "api key" in error_str:
        return "INVALID_API_KEY"
    elif "429" in error_str or "quota" in error_str:
        return "QUOTA_EXCEEDED"
    elif "503" in error_str or "unavailable" in error_str:
        return "SERVICE_UNAVAILABLE"
    elif "timeout" in error_str:
        return "TIMEOUT"
    return "UNKNOWN"

def check_circuit_breaker():
    if not circuit_breaker["is_open"]:
        return True
    if circuit_breaker["last_failure"]:
        elapsed = time.time() - circuit_breaker["last_failure"]
        if elapsed > circuit_breaker["reset_timeout"]:
            logger.info("Circuit breaker reset after timeout")
            circuit_breaker["is_open"] = False
            circuit_breaker["failures"] = 0
            return True
    return False

def record_failure():
    circuit_breaker["failures"] += 1
    circuit_breaker["last_failure"] = time.time()
    if circuit_breaker["failures"] >= circuit_breaker["threshold"]:
        circuit_breaker["is_open"] = True
        logger.warning(f"Circuit breaker OPENED after {circuit_breaker['failures']} failures")

def record_success():
    circuit_breaker["failures"] = 0
    circuit_breaker["is_open"] = False

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def ensure_client():
    """Initialize and return Gemini API client"""
    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key missing")
    return genai.Client(api_key=GEMINI_API_KEY)

def load_prompt(template_name: str) -> str:
    template_path = PROMPT_DIR / template_name
    if not template_path.exists():
        raise FileNotFoundError(f"Prompt template '{template_name}' not found.")
    return template_path.read_text(encoding="utf-8")

def render_prompt(template_name: str, context: dict) -> str:
    template = load_prompt(template_name)
    return template.format(**context)

class GeminiAPIError(Exception):
    def __init__(self, error_type, message):
        self.error_type = error_type
        self.message = message
        self.user_message = ERROR_MESSAGES.get(error_type, ERROR_MESSAGES["UNKNOWN"])
        super().__init__(self.user_message)

class CircuitBreakerOpen(Exception):
    pass

# ============================================================================
# GEMINI API INTEGRATION
# ============================================================================

def generate_text_with_retry(prompt_text, endpoint_name="unknown", max_retries=3):
    """Generate text using Gemini API with retry logic and circuit breaker"""
    request_id = str(uuid.uuid4())[:8]
    
    if not check_circuit_breaker():
        logger.warning(f"[{request_id}] Circuit breaker is OPEN")
        raise CircuitBreakerOpen("Circuit breaker is open")
    
    logger.info(f"[{request_id}] Request to Gemini: {endpoint_name}")
    api_logger.info(f"[{request_id}] PROMPT: {prompt_text[:200]}...")
    
    client = ensure_client()
    last_exception = None
    
    # Model Config
    MODEL_NAME = "gemini-2.5-flash" 
    
    for attempt in range(1, max_retries + 1):
        start_time = time.time()
        try:
            logger.info(f"[{request_id}] Attempt {attempt}/{max_retries}")
            
            # New SDK usage - Simple call first
            response = client.models.generate_content(
                model=MODEL_NAME, 
                contents=prompt_text
            )
            
            elapsed = time.time() - start_time
            response_text = response.text
            
            logger.info(f"[{request_id}] SUCCESS in {elapsed:.2f}s")
            api_logger.info(f"[{request_id}] OUTPUT: {response_text[:200]}...")
            
            add_to_history({
                "request_id": request_id,
                "endpoint": endpoint_name,
                "timestamp": datetime.now().isoformat(),
                "status": "success",
                "response_time": round(elapsed, 2),
            })
            
            record_success()
            return response_text
            
        except Exception as exc:
            elapsed = time.time() - start_time
            error_type = get_error_type(exc)
            last_exception = exc
            
            logger.exception(f"[{request_id}] Failed with traceback: {error_type} - {str(exc)}")
            
            if error_type in ["INVALID_API_KEY", "QUOTA_EXCEEDED"]:
                 record_failure()
                 raise GeminiAPIError(error_type, str(exc))
            
            if attempt < max_retries:
                time.sleep(2 ** (attempt - 1))
    
    record_failure()
    raise GeminiAPIError(get_error_type(last_exception), str(last_exception))

# ============================================================================
# RESPONSE PARSING
# ============================================================================

def parse_json_response(text):
    """
    Parse JSON response from AI with multiple fallback strategies.
    
    Strategy:
    1. Try direct JSON parse (if AI returns clean JSON)
    2. Extract from markdown code block (```json ... ```)
    3. Extract JSON object from text (find first { to last })
    4. Try fixing common issues (newlines, single quotes)
    5. Return error object with raw text
    """
    text = text.strip()
    
    def try_parse(content):
        """Helper to safely attempt JSON parsing"""
        try:
            return json.loads(content)
        except (json.JSONDecodeError, ValueError):
            return None
    
    # Strategy 1: Direct parse (AI returned clean JSON)
    result = try_parse(text)
    if result:
        return result
    
    # Strategy 2: Extract from markdown code block
    markdown_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if markdown_match:
        result = try_parse(markdown_match.group(1))
        if result:
            return result
    
    # Strategy 3: Extract JSON object from text
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    if start_idx != -1 and end_idx > start_idx:
        json_str = text[start_idx:end_idx + 1]
        
        # Try as-is
        result = try_parse(json_str)
        if result:
            return result
        
        # Strategy 4: Fix common issues
        # Fix unescaped newlines
        result = try_parse(json_str.replace('\n', '\\n'))
        if result:
            return result
        
        # Fix single quotes (common AI mistake)
        result = try_parse(json_str.replace("'", '"'))
        if result:
            return result
    
    # Strategy 5: All parsing failed, return error with raw text
    return {"raw_response": text, "parse_error": True}

def parse_track_response(text):
    """Parse track generation response"""
    return parse_json_response(text)

# ============================================================================
# API ROUTES
# ============================================================================

@app.get("/health")
def health(): return jsonify({"status": "ok"})

@app.get("/api-status")
def api_status():
    return jsonify({
        "service": "ai_service",
        "configured": bool(GEMINI_API_KEY),
        "sdk": "google-genai v1.0+"
    })

def handle_ai_error(exc, endpoint_name):
    # Log the full traceback for any exception handled here
    logger.exception(f"[{endpoint_name}] HANDLED ERROR: {type(exc).__name__} - {str(exc)}")
    if isinstance(exc, GeminiAPIError):
        return jsonify({"error": exc.user_message, "retry": False}), 503
    return jsonify({"error": f"{type(exc).__name__}: {str(exc)}"}), 500

@app.post("/generate/track")
def generate_track():
    """Generate personalized track level using AI"""
    try:
        # Parse and validate request data
        data = request.get_json(force=True) or {}
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except:
                data = {}
        if not isinstance(data, dict):
            data = {}
        
        # Extract and validate context
        client_context = data.get("context", {})
        if not isinstance(client_context, dict):
            client_context = {}

        # Merge with defaults
        context = {**DEFAULTS, **client_context, **data}
        if "context" in context:
            del context["context"]
        
        # Generate AI response
        prompt = render_prompt("track_prompt.txt", context)
        text = generate_text_with_retry(prompt, "generate/track")
        
        # Return response with parsed data
        return jsonify({"track": text, "parsed": parse_track_response(text)})
    except Exception as e:
        return handle_ai_error(e, "generate/track")

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    port = int(os.getenv("FLASK_RUN_PORT", 8000))
    debug_mode = bool(int(os.getenv("FLASK_DEBUG", "0")))
    logger.info(f"Starting AI Service on port {port} (debug={debug_mode})")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)