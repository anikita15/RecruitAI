"""
main.py
-------
FastAPI microservice for AI-powered resume analysis.

Endpoints:
  POST /extract-text  — Extract plain text from an uploaded file (PDF/DOCX)
  POST /analyze       — Score a resume against a job description
  GET  /health        — Health check
"""

import os
import logging
import tempfile
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from resume_parser import extract_text
from analyzer import analyze, get_model

# ──────────────────────────────────────────────────────────────────────────────
# Logging configuration
# ──────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Lifespan — warm up the ML model at startup so first request is fast
# ──────────────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== AI Resume Screening Service starting up ===")
    try:
        get_model()   # Pre-load sentence-transformer model
        logger.info("ML model warmed up successfully")
    except Exception as e:
        logger.warning(f"Model warm-up failed (will retry on first request): {e}")
    yield
    logger.info("=== AI Service shutting down ===")


# ──────────────────────────────────────────────────────────────────────────────
# FastAPI app setup
# ──────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Resume Screening AI Service",
    description="NLP microservice for resume parsing and candidate scoring",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────────────────────
# Request / Response models
# ──────────────────────────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    resume_text: str
    job_description: str
    mode: str = "semantic" # 'semantic' or 'llm'


class AnalyzeResponse(BaseModel):
    score: float
    matched_skills: List[str]
    missing_skills: List[str]
    summary: str
    candidate_name: Optional[str] = None


class ExtractTextResponse(BaseModel):
    text: str
    char_count: int


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Simple health check endpoint used by Spring Boot and Docker."""
    return {"status": "ok", "service": "resume-screening-ai"}


@app.post("/extract-text", response_model=ExtractTextResponse)
async def extract_text_endpoint(file: UploadFile = File(...)):
    """
    Accepts a PDF or DOCX file upload and returns the extracted plain text.
    Saves to a temp file, extracts, then cleans up.
    """
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use PDF or DOCX."
        )

    # Determine file extension
    original_name = file.filename or "resume"
    ext = os.path.splitext(original_name)[1] or ".pdf"

    # Write upload to a temp file so parsers can open it by path
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        text = extract_text(tmp_path)
        logger.info(f"Extracted {len(text)} chars from {original_name}")
        return ExtractTextResponse(text=text, char_count=len(text))
    except Exception as e:
        logger.error(f"Text extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_endpoint(request: AnalyzeRequest):
    """
    Analyzes a resume (plain text) against a job description and returns:
    - A match score (0–100)
    - Matched and missing skills
    - AI-generated summary
    - Extracted candidate name
    """
    if not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text cannot be empty")
    if not request.job_description.strip():
        raise HTTPException(status_code=400, detail="job_description cannot be empty")

    try:
        result = analyze(request.resume_text, request.job_description, mode=request.mode)
        return AnalyzeResponse(**result)
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ──────────────────────────────────────────────────────────────────────────────
# Entry point (for local dev: python main.py)
# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
