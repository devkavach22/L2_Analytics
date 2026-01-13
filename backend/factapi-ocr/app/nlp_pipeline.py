# app/nlp_pipeline.py
import os
import re
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
OCR_COLLECTION = os.getenv("OCR_COLLECTION", "ocrrecords")

client = MongoClient(MONGO_URL)
db = client[MONGO_DB_NAME]
collection = db[OCR_COLLECTION]

def clean_text(text: str) -> str:
    """
    Basic text cleaning to prepare for LLM.
    """
    if not text:
        return ""
    # Remove excessive newlines and whitespace
    text = text.replace("\n", " ")
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def fetch_related_text(keyword: str):
    """
    Fetch all documents whose extractedText contains the keyword.
    """
    if not keyword:
        return []

    results = collection.find(
        {"extractedText": {"$regex": keyword, "$options": "i"}}
    )

    return [doc.get("extractedText", "") for doc in results]