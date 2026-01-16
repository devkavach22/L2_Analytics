# app/tools/text_cleaner.py
import re
from .llm_loader import load_llm


def clean_text(text: str):
    """
    Hybrid cleaning:
    1. Regex cleanup
    2. Agentic LLM rewrite into normalized format
    """

    # -------- Basic regex-based cleanup --------
    text = text.replace("\n", " ")
    text = re.sub(r"[^\w\s.,:/-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    # -------- Agentic LLM normalization --------
    system = "You are a text-normalization agent designed to clean OCR output."

    prompt = f"""
Normalize the text extracted from OCR:
- Fix spacing
- Fix common scanning errors
- Ensure readable English
- DO NOT summarize or remove meaning
TEXT:
{text}
"""

    normalized = llm(prompt, system)
    return normalized
