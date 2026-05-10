"""
analyzer.py
-----------
Core AI analysis engine for resume-to-job-description matching.

Pipeline:
  1. Skill extraction from resume and JD using a curated skill list + NLP
  2. Keyword overlap matching (fast, deterministic)
  3. Semantic similarity scoring using sentence-transformers
  4. Weighted final score combining keyword + semantic scores
  5. Summary generation
"""

import re
import os
import json
import logging
from typing import List, Tuple, Optional
from sentence_transformers import SentenceTransformer, util
from openai import OpenAI

logger = logging.getLogger(__name__)

# ── OpenAI Client Configuration ──
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# ──────────────────────────────────────────────────────────────────────────────
# Load sentence-transformer model once at module level (cached after first load)
# ──────────────────────────────────────────────────────────────────────────────
_MODEL_NAME = "all-MiniLM-L6-v2"
_model: Optional[SentenceTransformer] = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info(f"Loading sentence-transformer model: {_MODEL_NAME}")
        _model = SentenceTransformer(_MODEL_NAME)
        logger.info("Model loaded successfully")
    return _model


# ──────────────────────────────────────────────────────────────────────────────
# Curated technology & soft skill vocabulary
# ──────────────────────────────────────────────────────────────────────────────
SKILL_VOCABULARY = {
    # Languages
    "python", "java", "javascript", "typescript", "kotlin", "scala", "go", "rust",
    "c", "c++", "c#", "ruby", "php", "swift", "r", "matlab", "bash", "shell",
    # Web
    "react", "reactjs", "angular", "vue", "nextjs", "nodejs", "express", "fastapi",
    "flask", "django", "spring", "spring boot", "hibernate", "rest", "graphql",
    "html", "css", "tailwind", "bootstrap", "sass",
    # Data / AI / ML
    "machine learning", "deep learning", "nlp", "natural language processing",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "matplotlib",
    "data science", "data analysis", "computer vision", "transformers", "bert", "gpt",
    "llm", "rag", "langchain", "openai", "huggingface",
    # Cloud / DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform",
    "jenkins", "github actions", "ci/cd", "devops", "linux", "git",
    # Databases
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "cassandra", "dynamodb", "firebase", "sqlite",
    # Architecture / Patterns
    "microservices", "api", "rest api", "soap", "kafka", "rabbitmq",
    "event driven", "design patterns", "solid", "tdd", "agile", "scrum",
    # Soft skills
    "leadership", "communication", "teamwork", "problem solving", "critical thinking",
    "project management", "time management", "collaboration",
}


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def analyze(resume_text: str, job_description: str, mode: str = "semantic") -> dict:
    """
    Dispatcher for analysis. Supported modes: 'semantic', 'llm'.
    """
    if mode == "llm" and client:
        return analyze_with_llm(resume_text, job_description)
    
    # Fallback/Default: Semantic Analysis
    return analyze_semantic(resume_text, job_description)


def analyze_semantic(resume_text: str, job_description: str) -> dict:
    """
    Original semantic analysis pipeline.
    """
    resume_lower = resume_text.lower()
    jd_lower = job_description.lower()

    # Step 1: Extract skills
    resume_skills = extract_skills(resume_lower)
    jd_skills = extract_skills(jd_lower)

    # Step 2: Compute keyword overlap score (0-100)
    matched_skills, missing_skills, keyword_score = compute_keyword_score(
        resume_skills, jd_skills
    )

    # Step 3: Compute semantic similarity score (0-100)
    semantic_score = compute_semantic_similarity(resume_text, job_description)

    # Step 4: Weighted final score
    final_score = round((0.4 * keyword_score) + (0.6 * semantic_score), 2)
    final_score = max(0.0, min(100.0, final_score))

    # Step 5: Extract candidate name
    candidate_name = extract_candidate_name(resume_text)

    # Step 6: Generate summary
    summary = generate_summary(
        candidate_name, final_score, matched_skills, missing_skills, semantic_score
    )

    return {
        "score": final_score,
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "summary": summary,
        "candidate_name": candidate_name,
    }


def analyze_with_llm(resume_text: str, job_description: str) -> dict:
    """
    Deep analysis using OpenAI GPT-4o-mini.
    """
    try:
        logger.info("Starting LLM analysis...")
        
        system_prompt = (
            "You are an expert technical recruiter. Analyze the provided resume against the job description. "
            "Return a JSON object with: "
            "1. 'score' (0-100 float): How well the candidate matches the role requirements. "
            "2. 'matched_skills' (list of strings): Skills the candidate definitely has. "
            "3. 'missing_skills' (list of strings): Skills critical for the JD but missing from the resume. "
            "4. 'summary' (string): A 2-3 sentence recruiter pitch explaining the fit, including transferable skills. "
            "5. 'candidate_name' (string): The candidate's name extracted from the resume."
        )
        
        user_prompt = f"### JOB DESCRIPTION:\n{job_description}\n\n### RESUME:\n{resume_text}"
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Validation/Sanity Checks
        result["score"] = float(result.get("score", 50))
        result["matched_skills"] = list(result.get("matched_skills", []))
        result["missing_skills"] = list(result.get("missing_skills", []))
        result["summary"] = str(result.get("summary", "Analysis completed via LLM."))
        result["candidate_name"] = str(result.get("candidate_name", "Unknown Candidate"))
        
        return result
        
    except Exception as e:
        logger.error(f"LLM Analysis failed: {e}. Falling back to semantic mode.")
        return analyze_semantic(resume_text, job_description)


# ──────────────────────────────────────────────────────────────────────────────
# Skill extraction
# ──────────────────────────────────────────────────────────────────────────────

def extract_skills(text: str) -> set:
    """
    Scans text for known skills from the vocabulary.
    Handles multi-word phrases and common variants.
    """
    found = set()
    for skill in SKILL_VOCABULARY:
        # Use word-boundary regex to avoid partial matches
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text):
            found.add(skill)
    return found


# ──────────────────────────────────────────────────────────────────────────────
# Keyword overlap scoring
# ──────────────────────────────────────────────────────────────────────────────

def compute_keyword_score(
    resume_skills: set, jd_skills: set
) -> Tuple[List[str], List[str], float]:
    """
    Computes a score based on what fraction of JD skills appear in the resume.
    Returns (matched, missing, score_0_to_100).
    """
    if not jd_skills:
        return list(resume_skills), [], 50.0  # No JD skills = neutral score

    matched = resume_skills & jd_skills
    missing = jd_skills - resume_skills

    score = (len(matched) / len(jd_skills)) * 100.0
    return list(matched), list(missing), round(score, 2)


# ──────────────────────────────────────────────────────────────────────────────
# Semantic similarity scoring
# ──────────────────────────────────────────────────────────────────────────────

def compute_semantic_similarity(resume_text: str, jd_text: str) -> float:
    """
    Uses sentence-transformers to encode both texts and computes cosine similarity.
    Returns a score from 0 to 100.
    """
    try:
        model = get_model()

        # Truncate to avoid token limits (most models handle ~512 tokens)
        resume_chunk = resume_text[:3000]
        jd_chunk = jd_text[:2000]

        embeddings = model.encode([resume_chunk, jd_chunk], convert_to_tensor=True)
        cosine_sim = util.cos_sim(embeddings[0], embeddings[1]).item()

        # cos_sim is in [-1, 1]; convert to [0, 100]
        score = ((cosine_sim + 1) / 2) * 100
        return round(score, 2)
    except Exception as e:
        logger.error(f"Semantic similarity computation failed: {e}")
        return 50.0  # Neutral fallback


# ──────────────────────────────────────────────────────────────────────────────
# Candidate name extraction (heuristic)
# ──────────────────────────────────────────────────────────────────────────────

def extract_candidate_name(text: str) -> str:
    """
    Attempts to extract a candidate name from the first few lines of the resume.
    Assumes names appear at the top before contact info.
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    # Heuristic: first non-empty line that looks like a proper name
    name_pattern = re.compile(r"^[A-Z][a-z]+(\s[A-Z][a-z]+){1,3}$")
    for line in lines[:8]:
        if name_pattern.match(line) and len(line.split()) >= 2:
            return line
    return "Unknown Candidate"


# ──────────────────────────────────────────────────────────────────────────────
# Summary generation
# ──────────────────────────────────────────────────────────────────────────────

def generate_summary(
    name: str,
    score: float,
    matched: List[str],
    missing: List[str],
    semantic_score: float,
) -> str:
    """
    Generates a human-readable explanation of the match result.
    """
    grade = (
        "an excellent" if score >= 80
        else "a strong" if score >= 65
        else "a moderate" if score >= 45
        else "a weak"
    )

    matched_str = (
        ", ".join(matched[:6]) + ("..." if len(matched) > 6 else "")
        if matched else "none"
    )
    missing_str = (
        ", ".join(missing[:5]) + ("..." if len(missing) > 5 else "")
        if missing else "none"
    )

    return (
        f"{name} is {grade} match for this role with a score of {score:.1f}/100. "
        f"Semantic alignment with the job description is {semantic_score:.1f}%. "
        f"Matched skills: {matched_str}. "
        f"Missing skills: {missing_str}."
    )
