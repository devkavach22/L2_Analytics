import os
import io
import re
import requests
import fitz  # PyMuPDF
import easyocr
import pandas as pd
import docx2txt
import base64
from datetime import datetime
from PIL import Image
from docx import Document
from pymongo import MongoClient
from dotenv import load_dotenv
from fpdf import FPDF
from bs4 import BeautifulSoup
from typing import Optional, List, Dict, Any

# --- New Imports for Translation & Detection ---
from langdetect import detect, LangDetectException
from deep_translator import GoogleTranslator

# YouTube Transcript API
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
)

# ----------------------------
# Environment and MongoDB Setup
# ----------------------------
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
OCR_COLLECTION = os.getenv("OCR_COLLECTION", "ocrrecords")

if not MONGO_URL or not MONGO_DB_NAME:
    raise ValueError("MONGO_URL or MONGO_DB_NAME is not set in .env file.")

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[MONGO_DB_NAME]
collection = db[OCR_COLLECTION]

print(f"--- OCR Utils Connected to: {MONGO_DB_NAME} / {OCR_COLLECTION} ---")

# ----------------------------
# EasyOCR Initialization (FIXED)
# ----------------------------
print("Loading EasyOCR models (Latin & Hindi)...")
try:
    # Reader 1: Latin-based languages
    READER_LATIN = easyocr.Reader(['en', 'es', 'fr', 'de', 'it', 'pt'], gpu=False)
    
    # Reader 2: Devanagari (Hindi)
    READER_HINDI = easyocr.Reader(['hi', 'en'], gpu=False)
except Exception as e:
    print(f"⚠ EasyOCR Initialization Error: {e}")
    READER_LATIN = None
    READER_HINDI = None

# ----------------------------
# Translation & Formatting Logic
# ----------------------------
def detect_and_translate(text: str) -> str:
    """
    1. Detects language of the text.
    2. Translates to English if necessary.
    3. Returns a formatted string containing BOTH Original and Translated text.
    """
    if not text or len(text.strip()) < 5:
        return text

    try:
        try:
            detected_lang = detect(text[:1000])
        except LangDetectException:
            detected_lang = "unknown"

        print(f"🌍 Language Detected: '{detected_lang}'")

        if detected_lang == 'en':
            print("✅ Language is English. No translation needed.")
            return text

        print(f"🔄 Translation Needed (Detected '{detected_lang}'). Translating to English...")

        translator = GoogleTranslator(source='auto', target='en')
        chunks = []
        max_chunk = 4000 
        
        for i in range(0, len(text), max_chunk):
            chunk = text[i:i+max_chunk]
            try:
                translated_part = translator.translate(chunk)
                chunks.append(translated_part)
            except Exception as e:
                print(f"⚠ Chunk translation warning: {e}")
                chunks.append(chunk) # Fallback to original

        full_translation = " ".join(chunks)
        
        final_output = (
            f"[ORIGINAL TEXT ({detected_lang})]\n"
            f"{text}\n\n"
            f"--------------------------------------------------\n\n"
            f"[TRANSLATED TEXT (EN)]\n"
            f"{full_translation}"
        )
        return final_output

    except Exception as e:
        print(f"❌ Translation Critical Error: {str(e)}")
        return text

# ----------------------------
# YouTube Logic (Integrated)
# ----------------------------
def extract_video_id(url_or_id: str) -> Optional[str]:
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_id):
        return url_or_id
    
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    return None

class TranscriptFetcher:
    def __init__(self):
        self.api = YouTubeTranscriptApi()

    def fetch_transcript(self, url_or_id: str, language_codes: List[str] = None) -> str:
        if language_codes is None:
            language_codes = ["en", "hi", "es", "fr", "de", "it", "pt"]
            
        video_id = extract_video_id(url_or_id)
        if not video_id:
            return ""

        try:
            transcript_list = self.api.list(video_id)
            transcript = None

            try:
                transcript = transcript_list.find_transcript(language_codes)
            except NoTranscriptFound:
                pass
            
            if transcript is None:
                try:
                    transcript = transcript_list.find_manually_created_transcript(language_codes)
                except NoTranscriptFound:
                    pass
            
            if transcript is None:
                try:
                    print("⚠ Preferred languages not found. Fetching first available transcript...")
                    transcript = next(iter(transcript_list))
                except StopIteration:
                    return ""

            transcript_data = transcript.fetch()
            
            parts = []
            for item in transcript_data:
                text = item.get('text', '') if isinstance(item, dict) else getattr(item, 'text', '')
                if text:
                    parts.append(text.strip())
            
            raw_transcript = " ".join(parts)
            return f"--- YOUTUBE TRANSCRIPT (ID: {video_id}) ---\n{raw_transcript}"

        except (TranscriptsDisabled, NoTranscriptFound):
            return f"[Error: Transcripts disabled or not found for video {video_id}]"
        except Exception as e:
            return f"[Error fetching transcript: {str(e)}]"

yt_fetcher = TranscriptFetcher()

# ----------------------------
# Helper Functions
# ----------------------------
def ocr_image(image_bytes: bytes) -> str:
    """
    Perform OCR using both Latin and Hindi readers.
    """
    if not READER_LATIN or not READER_HINDI:
        return "OCR System not initialized properly."

    import numpy as np
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(img)
    
    results_latin = READER_LATIN.readtext(arr, detail=0)
    results_hindi = READER_HINDI.readtext(arr, detail=0)
    
    combined = []
    seen = set()
    
    # Combine results, removing duplicates
    for text in results_latin:
        if text not in seen:
            combined.append(text)
            seen.add(text)
            
    for text in results_hindi:
        if text not in seen:
            combined.append(text)
            seen.add(text)
            
    return " ".join(combined).strip()

def read_simple_text(file_bytes: bytes) -> str:
    encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252', 'ascii']
    for encoding in encodings:
        try:
            return file_bytes.decode(encoding).strip()
        except UnicodeDecodeError:
            continue
    return file_bytes.decode("utf-8", errors="ignore").strip()

def clean_web_text(text: str) -> str:
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if len(line) < 30: continue
        if re.search(r'(cookie|privacy|login|sign up|©)', line.lower()): continue
        lines.append(line)
    return "\n".join(lines)

def get_file_preview_image(file_bytes: bytes, filename: str) -> Optional[str]:
    """
    Generates a Base64 string of the 'whole image' for storage.
    - If Image: returns base64 of the image itself.
    - If PDF: renders the FIRST page as an image and returns base64.
    - Others: Returns None.
    """
    ext = os.path.splitext(filename)[1].lower()
    
    try:
        # 1. Handle Standard Images
        if ext in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
            return base64.b64encode(file_bytes).decode('utf-8')
        
        # 2. Handle PDF (Render Page 1 as Image)
        elif ext == ".pdf":
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            if len(doc) > 0:
                page = doc[0]  # Get first page
                pix = page.get_pixmap(dpi=150) # Render to image
                img_data = pix.tobytes("png")
                return base64.b64encode(img_data).decode('utf-8')
            
    except Exception as e:
        print(f"⚠ Could not generate preview image: {e}")
    
    return None

# ----------------------------
# Specific File Extractors
# ----------------------------
def extract_sql(sql_bytes: bytes) -> str:
    return read_simple_text(sql_bytes)

def extract_pdf(pdf_bytes: bytes) -> str:
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page in pdf:
        embedded_text = page.get_text().strip()
        if len(embedded_text) < 50:
            pix = page.get_pixmap(dpi=300)
            pages.append(ocr_image(pix.tobytes("png")))
        else:
            pages.append(clean_web_text(embedded_text))
    return "\n".join(pages).strip()

def extract_docx(docx_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(docx_bytes))
        lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                cells = [c.text.strip() for c in row.cells if c.text.strip()]
                if cells:
                    lines.append(" | ".join(cells))
        return "\n".join(lines)
    except:
        return docx2txt.process(io.BytesIO(docx_bytes))

def extract_xlsx(xlsx_bytes: bytes) -> str:
    try:
        return pd.read_excel(io.BytesIO(xlsx_bytes)).to_string(index=False)
    except:
        return ""

def extract_html(html_bytes: bytes) -> str:
    soup = BeautifulSoup(html_bytes, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return clean_web_text(soup.get_text("\n"))

def extract_webpage(url: str) -> str:
    try:
        if "youtube.com" in url or "youtu.be" in url:
            transcript = yt_fetcher.fetch_transcript(url)
            if transcript and not transcript.startswith("[Error"):
                return transcript
        
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        return clean_web_text(soup.get_text("\n"))
    except Exception as e:
        return f"Error extracting webpage: {str(e)}"

# ----------------------------
# Universal Extractor
# ----------------------------
def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    print(f"DEBUG: Extracting {filename} ({ext})")
    
    extracted_text = ""

    # 1. Source Routing
    if "youtube.com" in filename or "youtu.be" in filename:
        extracted_text = yt_fetcher.fetch_transcript(filename)
    elif filename.startswith("http"):
        extracted_text = extract_webpage(filename)
    elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"]:
        extracted_text = ocr_image(file_bytes)
    elif ext == ".pdf":
        extracted_text = extract_pdf(file_bytes)
    elif ext == ".docx":
        extracted_text = extract_docx(file_bytes)
    elif ext == ".xlsx":
        extracted_text = extract_xlsx(file_bytes)
    elif ext in [".html", ".htm"]:
        extracted_text = extract_html(file_bytes)
    elif ext == ".sql":
        extracted_text = extract_sql(file_bytes)
    elif ext in [".txt", ".csv", ".json", ".md", ".log", ".xml", ".yaml", ".yml"]:
        extracted_text = read_simple_text(file_bytes)
    else:
        # Fallback: OCR
        try:
            extracted_text = ocr_image(file_bytes)
        except:
            extracted_text = read_simple_text(file_bytes)

    # 2. Check for hidden YouTube links in text files
    clean_txt = extracted_text.strip()
    if len(clean_txt) < 300 and ("youtube.com" in clean_txt or "youtu.be" in clean_txt):
        vid_id = extract_video_id(clean_txt)
        if vid_id:
            print(f"DEBUG: Found YouTube Link in text ({vid_id}). Fetching transcript...")
            transcript = yt_fetcher.fetch_transcript(vid_id)
            if transcript:
                extracted_text = f"{extracted_text}\n\n{transcript}"

    # 3. Final Step: Detect Language & Translate
    print("🔄 Checking for translation needs...")
    final_output = detect_and_translate(extracted_text)
    
    return final_output

# ----------------------------
# MongoDB Save Logic (NEW)
# ----------------------------
def save_record_to_mongo(user_id: str, filename: str, extracted_text: str, file_image: Optional[str] = None) -> str:
    """
    Saves the record to MongoDB including the Base64 image/preview if available.
    """
    try:
        record = {
            "userId": user_id,
            "originalFilename": filename,
            "extractedText": extracted_text,
            "fileImage": file_image,  # Stores the Base64 image string
            "createdAt": datetime.utcnow()
        }
        result = collection.insert_one(record)
        return str(result.inserted_id)
    except Exception as e:
        print(f"❌ Database Save Error: {e}")
        return ""

def process_and_save(user_id: str, filename: str, file_bytes: bytes) -> Dict[str, Any]:
    """
    Master function to:
    1. Extract Text
    2. Generate Preview Image (The 'Whole Image')
    3. Save everything to MongoDB
    """
    print(f"🚀 Processing File: {filename} for User: {user_id}")
    
    # 1. Extract Text
    text_result = extract_text_from_file(file_bytes, filename)
    
    # 2. Generate Image Preview (Base64)
    # This captures the 'whole image' for Images or the first page for PDFs
    image_preview = get_file_preview_image(file_bytes, filename)
    
    # 3. Save to MongoDB
    record_id = save_record_to_mongo(user_id, filename, text_result, image_preview)
    
    if record_id:
        print(f"✅ Saved to MongoDB with ID: {record_id}")
    
    return {
        "success": True,
        "recordId": record_id,
        "text": text_result,
        "imagePreview": image_preview  # Return this so UI can show it immediately
    }

# ----------------------------
# MongoDB & Output Functions
# ----------------------------
def fetch_text_from_mongo(user_id: str) -> str:
    documents = collection.find({"userId": user_id})
    merged_text = [doc.get("extractedText", "") for doc in documents if doc.get("extractedText")]
    return "\n".join(merged_text).strip()

def search_mongo_by_keyword(user_id: str, keyword: str) -> str:
    if not keyword: return ""
    query = {"userId": user_id, "extractedText": {"$regex": keyword, "$options": "i"}}
    documents = list(collection.find(query))
    if not documents: return ""
    results = []
    for doc in documents:
        fname = doc.get("originalFilename") or doc.get("fileName") or "Unknown"
        text = doc.get("extractedText", "")
        results.append(f"--- SOURCE: {fname} ---\n{text}\n")
    return "\n".join(results)

def save_pdf(text: str, filename_base: str, report_type: str, image_path: str = None) -> str:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, f"AI Analysis: {report_type}", ln=True, align='C')
    pdf.ln(5)
    if image_path and os.path.exists(image_path):
        try:
            pdf.image(image_path, x=20, w=170)
            pdf.ln(5) 
        except: pass
    pdf.set_font("Arial", size=11)
    safe_text = text.encode('latin-1', 'replace').decode('latin-1')
    for line in safe_text.split("\n"):
        pdf.multi_cell(0, 7, line)
    output_dir = "static/reports"
    os.makedirs(output_dir, exist_ok=True)
    output_path = f"{output_dir}/{filename_base}.pdf"
    pdf.output(output_path)
    return output_path

def save_docx(text: str, user_id: str, report_type: str) -> str:
    doc = Document()
    doc.add_heading(f"Report: {report_type}", 0)
    for line in text.split("\n"):
        doc.add_paragraph(line)
    output_dir = "static/reports"
    os.makedirs(output_dir, exist_ok=True)
    output_path = f"{output_dir}/{user_id}_{report_type}.docx"
    doc.save(output_path)
    return output_path