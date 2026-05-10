# RecruitAI — Intelligent Resume Screening System

An AI-powered platform for recruiters to upload, parse, and rank resumes against job descriptions using NLP and semantic similarity.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend dev)
- Java 17 (for local backend dev)
- Python 3.9+ (for local AI service dev)

### Quick Start (Docker)
Run the entire stack with one command:
```bash
docker-compose up --build
```
- **Frontend**: http://localhost:4000
- **Backend API**: http://localhost:8080
- **AI Microservice**: http://localhost:8000
- **MySQL**: localhost:3307

---

## 🧪 Testing

### Backend (Spring Boot)
Unit and integration tests are located in `backend/src/test`.
```bash
cd backend
mvn test
```
*Note: Requires Maven installed locally.*

### AI Microservice (Python)
Uses `pytest` for logic and API verification.
```bash
cd ai-service
# Recommended: use a virtualenv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=$PYTHONPATH:.
pytest
```

---

## 🏗️ Architecture
- **Frontend**: React (Vite), Tailwind CSS, Lucide icons, Recharts for analytics.
- **Backend**: Spring Boot, Spring Data JPA, REST API.
- **AI Service**: FastAPI, PyMuPDF (text extraction), Sentence-Transformers (semantic matching).
- **Database**: MySQL 8.0.
