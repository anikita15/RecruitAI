"""
resume_parser.py
----------------
Handles extraction of plain text from PDF and DOCX resume files.
Uses PyMuPDF (fitz) for PDFs and python-docx for DOCX files.
"""

import os
import fitz  # PyMuPDF
from docx import Document
import logging

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts all text from a PDF file using PyMuPDF.
    Handles multi-page documents and cleans whitespace.
    """
    try:
        text_parts = []
        with fitz.open(file_path) as doc:
            for page in doc:
                text_parts.append(page.get_text("text"))
        raw = "\n".join(text_parts)
        return _clean_text(raw)
    except Exception as e:
        logger.error(f"PDF extraction failed for {file_path}: {e}")
        return ""


def extract_text_from_docx(file_path: str) -> str:
    """
    Extracts all text from a DOCX file using python-docx.
    Iterates through paragraphs and table cells.
    """
    try:
        doc = Document(file_path)
        parts = []

        # Extract paragraph text
        for para in doc.paragraphs:
            if para.text.strip():
                parts.append(para.text.strip())

        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        parts.append(cell.text.strip())

        return _clean_text("\n".join(parts))
    except Exception as e:
        logger.error(f"DOCX extraction failed for {file_path}: {e}")
        return ""


def extract_text(file_path: str) -> str:
    """
    Auto-detects file type and extracts text accordingly.
    Returns empty string if the file type is unsupported.
    """
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return ""

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path)
    else:
        logger.warning(f"Unsupported file type: {ext}")
        return ""


def _clean_text(text: str) -> str:
    """
    Removes excessive whitespace and normalizes line endings.
    """
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]  # Drop empty lines
    return " ".join(lines)
