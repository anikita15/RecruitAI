import pytest
from analyzer import extract_skills, compute_keyword_score, compute_semantic_similarity, analyze

def test_extract_skills():
    text = "I have experience with Python, Java and React."
    skills = extract_skills(text.lower())
    assert "python" in skills
    assert "java" in skills
    assert "react" in skills
    assert "rust" not in skills

def test_extract_skills_multi_word():
    text = "Expert in Machine Learning and Spring Boot development."
    skills = extract_skills(text.lower())
    assert "machine learning" in skills
    assert "spring boot" in skills

def test_compute_keyword_score():
    resume_skills = {"python", "java", "react"}
    jd_skills = {"python", "java", "aws", "docker"}
    
    matched, missing, score = compute_keyword_score(resume_skills, jd_skills)
    
    assert set(matched) == {"python", "java"}
    assert set(missing) == {"aws", "docker"}
    assert score == 50.0

def test_compute_keyword_score_empty_jd():
    resume_skills = {"python"}
    jd_skills = set()
    matched, missing, score = compute_keyword_score(resume_skills, jd_skills)
    assert score == 50.0

def test_analyze_integration():
    resume = "John Doe\nSenior Python Developer with React experience."
    jd = "Seeking a Python developer who knows React and AWS."
    
    result = analyze(resume, jd)
    
    assert "score" in result
    assert result["candidate_name"] == "John Doe"
    assert "python" in result["matched_skills"]
    assert "react" in result["matched_skills"]
    assert "aws" in result["missing_skills"]
    assert isinstance(result["summary"], str)
