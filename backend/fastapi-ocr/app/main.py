import os
import sys
import subprocess
import traceback
import re
import json
import time
import threading
import queue
from typing import Optional, Dict
import asyncio

import requests
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from datetime import datetime

# ------------------------------------------------------------
# PATH SETUP
# ------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# ------------------------------------------------------------
# IMPORTS (EXISTING)
# ------------------------------------------------------------
try:
    import config
    from src import transcript_fetcher
    from src import vector_store
    from src import rag_chain
    from src import utils
    from .ocr_utils import extract_text_from_file, collection as mongo_ocr_col
    from .agent_orchestrator import AgenticReportPipeline
    from .rag_engine import chat_with_video
    from .nlp_pipeline import perform_ner
except ImportError as e:
    print(f"❌ Startup Import Error: {e}")

# ------------------------------------------------------------
# NEW IMPORTS (FOLDER AI)
# ------------------------------------------------------------
from app.folder_analyzer.folder_pipeline import run_folder_analysis
from app.folder_analyzer.metadata_store import (
    create_analysis_job,
    update_analysis_status,
    get_analysis_job
)
from .folder_analyzer.insight_engine import ask_folder_ai

# ------------------------------------------------------------
# STREAM QUEUE (GLOBAL)
# ------------------------------------------------------------
STREAM_QUEUE = queue.Queue()

# ============================================================
# FASTAPI INIT
# ============================================================
app = FastAPI(title="AI Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# UTILS
# ============================================================
def start_ollama_server():
    try:
        requests.get("http://localhost:11434/api/tags", timeout=2)
        print("✔ Ollama server already running.")
    except Exception:
        print("⧗ Starting Ollama server...")
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            shell=True
        )

@app.on_event("startup")
async def startup_event():
    start_ollama_server()

def clean_ai_response(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"\n{3,}", "\n\n", text).strip()

def stream(event: str, data):
    STREAM_QUEUE.put({"event": event, "data": data})

# ============================================================
# MODELS (EXISTING)
# ============================================================
class ChatRequest(BaseModel):
    user_id: str
    query: str
    link: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    entities: dict = {}

class IngestRequest(BaseModel):
    user_id: str
    url: str

class ReportRequest(BaseModel):
    user_id: str
    report_type: str
    keyword: Optional[str] = None
    new_file_text: Optional[str] = None
    filename: Optional[str] = None

# ============================================================
# NEW MODELS (FOLDER AI)
# ============================================================

class FolderAnalyzeRequest(BaseModel):
    folder_path: str
    user_id: str

# class FolderQuestionRequest(BaseModel):
#     analysis_id: str
#     question: str

# ============================================================
# CHAT WORKER (UNCHANGED)
# ============================================================
def chat_worker(payload: ChatRequest) -> dict:
    if not payload.query:
        raise HTTPException(status_code=400, detail="Query is required")

    context_id = payload.user_id

    if payload.link:
        context_id = utils.extract_video_id(payload.link)

    manager = vector_store.VectorStoreManager(context_id)

    if payload.link:
        fetcher = transcript_fetcher.TranscriptFetcher()
        transcript = fetcher.fetch_transcript(payload.link)
        manager.create_vector_store(transcript)

    if not manager.load_vector_store():
        raise HTTPException(status_code=404, detail="No context found")

    retriever = manager.get_retriever()
    rag = rag_chain.RAGChain(retriever)
    answer = rag.query(payload.query)

    entities = perform_ner(answer)

    return {
        "answer": clean_ai_response(answer),
        "entities": entities
    }

# ============================================================
# NOTEBOOKLM REPORT STREAM WORKER (UNCHANGED)
# ============================================================
def report_stream_worker(req: ReportRequest):
    try:
        stream("status", "started")
        stream("text", "Initializing NotebookLM report engine...")

        pipeline = AgenticReportPipeline()

        for step in range(1, 4):
            time.sleep(0.8)
            stream("text", f"Processing step {step}/3")

        result = pipeline.run(
            user_id=req.user_id,
            report_type=req.report_type,
            new_file_text=req.new_file_text,
            notebooklm_mode=True
        )

        stream("result", result)
        stream("status", "completed")

    except Exception as e:
        traceback.print_exc()
        stream("error", str(e))

    finally:
        stream("done", True)

# ============================================================
# FOLDER AI BACKGROUND WORKER
# ============================================================
async def process_folder_analysis(analysis_id: str, folder_path: str):
    try:
        update_analysis_status(
            analysis_id,
            status="RUNNING",
            step="Analyzing folder"
        )

        result = await asyncio.to_thread(
            run_folder_analysis,
            folder_path
        )

        update_analysis_status(
            analysis_id,
            status="COMPLETED",
            step="Graphs & charts generated",
            result=result
        )

    except Exception as e:
        update_analysis_status(
            analysis_id,
            status="FAILED",
            error=str(e)
        )



# ============================================================
# EXISTING ENDPOINTS (UNCHANGED)
# ============================================================
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    return await run_in_threadpool(chat_worker, payload)

@app.post("/agentic-report")
async def agentic_report(req: ReportRequest):

    def event_generator():
        threading.Thread(
            target=report_stream_worker,
            args=(req,),
            daemon=True
        ).start()

        while True:
            event = STREAM_QUEUE.get()
            yield f"data: {json.dumps(event)}\n\n"
            if event.get("event") == "done":
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

@app.post("/ingest")
async def ingest_link(req: IngestRequest):
    video_id = utils.extract_video_id(req.url)
    fetcher = transcript_fetcher.TranscriptFetcher()
    transcript_text = fetcher.fetch_transcript(video_id)

    manager = vector_store.VectorStoreManager(video_id)
    manager.create_vector_store(transcript_text)

    return {"success": True, "video_id": video_id}

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    file_body = await file.read()
    text = extract_text_from_file(file_body, file.filename)
    return {"success": True, "filename": file.filename, "text": text}

# ============================================================
# NEW FOLDER AI ENDPOINTS
# ============================================================

@app.post("/folder/analyze")
async def analyze_folder(
    req: FolderAnalyzeRequest,
    background_tasks: BackgroundTasks
):
    """
    Starts folder analysis asynchronously.
    """
    analysis_id = create_analysis_job(
        folder_id=req.folder_path,
        user_id=req.user_id
    )

    background_tasks.add_task(
        process_folder_analysis,
        analysis_id,
        req.folder_path
    )

    return {
        "analysis_id": analysis_id,
        "status": "PENDING",
        "message": "Folder analysis started"
    }


async def process_folder_analysis(analysis_id: str, folder_path: str):
    try:
        update_analysis_status(
            analysis_id,
            status="RUNNING",
            step="Analyzing folder"
        )

        result = await asyncio.to_thread(
            run_folder_analysis,
            folder_path
        )

        update_analysis_status(
            analysis_id,
            status="COMPLETED",
            step="Graphs & charts generated",
            result=result
        )

    except Exception as e:
        update_analysis_status(
            analysis_id,
            status="FAILED",
            error=str(e)
        )



@app.get("/folder/status/{analysis_id}")
async def get_folder_status(analysis_id: str):
    job = get_analysis_job(analysis_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job["_id"] = str(job["_id"])
    return job

@app.post("/folder/ask")
def ask_folder(req: FolderAnalyzeRequest):

    job = get_analysis_job(req.analysis_id)

    if not job or job["status"] != "COMPLETED":
        raise HTTPException(status_code=400, detail="Folder analysis not completed")

    context = job["result"]

    answer = ask_folder_ai(context, req.question)

    return {
        "question": req.question,
        "answer": answer
    }


# (OCR and agentic-report endpoints remain as they were)

# # app/main.py
# import os
# import subprocess
# from typing import List, Optional 
# from fastapi import FastAPI, File, UploadFile, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel

# from .ocr_utils import extract_text_from_file
# from .agent_orchestrator import AgenticReportPipeline
# from .rag_engine import chat_with_video


# # ============================================================
# # SAFE OLLAMA AUTO-STARTUP (WINDOWS + LINUX COMPATIBLE)
# # ============================================================
# def start_ollama_server():
#     """
#     Ensures Ollama is running.
#     On Windows & Linux this runs non-blocking and prevents
#     startup hang or multiple server instances.
#     """
#     try:
#         import requests
#         requests.get("http://localhost:11434/api/tags", timeout=2)
#         print("✔ Ollama server already running.")
#         return
#     except Exception:
#         print("⧗ Ollama server not running. Starting...")

#     # Start ollama serve in background
#     subprocess.Popen(
#         ["ollama", "serve"],
#         stdout=subprocess.DEVNULL,
#         stderr=subprocess.DEVNULL,
#         shell=True  # required for Windows
#     )

#     print("✔ Ollama server started in background.")


# # ------------------------------------------------------------
# # FASTAPI INITIALIZATION
# # ------------------------------------------------------------
# app = FastAPI(title="OCR + Agentic NLP Microservice")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], 
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # ============================================================
# # START OLLAMA ON FASTAPI STARTUP
# # ============================================================
# @app.on_event("startup")
# async def startup_event():
#     start_ollama_server()


# # ============================================================
# # OCR ENDPOINT (DO NOT MODIFY — EXACTLY AS REQUIRED)
# # ============================================================
# @app.post("/ocr")
# async def ocr_endpoint(file: UploadFile = File(...)):
#     filename = file.filename
#     file_body = await file.read()

#     try:
#         text = extract_text_from_file(file_body, filename)
#         return {"success": True, "filename": filename, "text": text}
#     except Exception as e:
#         return {"success": False, "error": str(e)}


# # ============================================================
# # AGENTIC NLP REPORT ENDPOINT (UPDATED MODEL)
# # ============================================================
# class ReportRequest(BaseModel):
#     user_id: str
#     report_type: str
#     keyword: Optional[str] = None
#     new_file_text: Optional[str] = None

# @app.post("/agentic-report")
# async def agentic_report(req: ReportRequest):
#     """
#     Runs full Agentic AI pipeline.
#     Now accepts 'new_file_text' directly from Node.js so we don't rely solely on DB.
#     """
#     try:
#         pipeline = AgenticReportPipeline()
#         result = pipeline.run(
#             user_id=req.user_id,
#             report_type=req.report_type,
#             keyword=req.keyword,
#             new_file_text=req.new_file_text
#         )

#         return JSONResponse(content=result)

#     except Exception as e:
#         return JSONResponse(
#             {"success": False, "error": str(e)},
#             status_code=500
#         )

# class ChatRequest(BaseModel):
#     user_id: str
#     query: str
#     link: Optional[str] = None

# class ChatResponse(BaseModel):
#     answer: str

# @app.post("/chat", response_model=ChatResponse)
# def chat_endpoint(payload: ChatRequest):
#     try:
#         if not payload.query:
#             raise HTTPException(status_code=400, detail="Query is required")

#         answer = chat_with_video(
#             question=payload.query,
#             user_id=payload.user_id,
#             video_url=payload.link
#         )

#         return {"answer": answer}

#     except HTTPException:
#         raise
#     except Exception as e:
#         print("❌ Python Chat Error:", str(e))
#         raise HTTPException(
#             status_code=500,
#             detail="Failed to generate answer"
#         )

# # app/main.py
# import os
# import subprocess
# # CHANGE 1: Import Optional here
# from typing import List, Optional 
# from fastapi import FastAPI, File, UploadFile
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel

# from .ocr_utils import extract_text_from_file
# # from .agent_orchestrator import AgenticReportPipeline
# from .agent_orchestrator import AgenticReportPipeline
# from fastapi import HTTPException
# from .rag_engine import chat_with_video


# # ============================================================
# # SAFE OLLAMA AUTO-STARTUP (WINDOWS + LINUX COMPATIBLE)
# # ============================================================
# def start_ollama_server():
#     """
#     Ensures Ollama is running.
#     On Windows & Linux this runs non-blocking and prevents
#     startup hang or multiple server instances.
#     """
#     try:
#         import requests
#         requests.get("http://localhost:11434/api/tags", timeout=2)
#         print("✔ Ollama server already running.")
#         return
#     except Exception:
#         print("⧗ Ollama server not running. Starting...")

#     # Start ollama serve in background
#     subprocess.Popen(
#         ["ollama", "serve"],
#         stdout=subprocess.DEVNULL,
#         stderr=subprocess.DEVNULL,
#         shell=True  # required for Windows
#     )

#     print("✔ Ollama server started in background.")


# # ------------------------------------------------------------
# # FASTAPI INITIALIZATION
# # ------------------------------------------------------------
# app = FastAPI(title="OCR + Agentic NLP Microservice")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], 
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # ============================================================
# # START OLLAMA ON FASTAPI STARTUP
# # ============================================================
# @app.on_event("startup")
# async def startup_event():
#     start_ollama_server()


# # ============================================================
# # OCR ENDPOINT (DO NOT MODIFY — EXACTLY AS REQUIRED)
# # ============================================================
# @app.post("/ocr")
# async def ocr_endpoint(file: UploadFile = File(...)):
#     filename = file.filename
#     file_body = await file.read()

#     try:
#         text = extract_text_from_file(file_body, filename)
#         return {"success": True, "filename": filename, "text": text}
#     except Exception as e:
#         return {"success": False, "error": str(e)}


# # ============================================================
# # AGENTIC NLP REPORT ENDPOINT (UPDATED MODEL)
# # ============================================================
# class ReportRequest(BaseModel):
#     user_id: str
#     report_type: str
#     keyword: Optional[str] = None
#     new_file_text: Optional[str] = None  # <--- THIS WAS MISSING!

# @app.post("/agentic-report")
# async def agentic_report(req: ReportRequest):
#     """
#     Runs full Agentic AI pipeline.
#     Now accepts 'new_file_text' directly from Node.js so we don't rely solely on DB.
#     """
#     try:
#         pipeline = AgenticReportPipeline()
#         result = pipeline.run(
#             user_id=req.user_id,
#             report_type=req.report_type,
#             keyword=req.keyword,
#             new_file_text=req.new_file_text # Pass the text to the orchestrator
#         )

#         return JSONResponse(content=result)

#     except Exception as e:
#         return JSONResponse(
#             {"success": False, "error": str(e)},
#             status_code=500
#         )
# class ChatRequest(BaseModel):
#     user_id: str
#     query: str
#     link: Optional[str] = None

# class ChatResponse(BaseModel):
#     answer: str

# @app.post("/chat", response_model=ChatResponse)
# def chat_endpoint(payload: ChatRequest):
#     try:
#         if not payload.query:
#             raise HTTPException(status_code=400, detail="Query is required")

#         answer = chat_with_video(
#             question=payload.query,
#             user_id=payload.user_id,
#             video_url=payload.link
#         )

#         return {"answer": answer}

#     except HTTPException:
#         raise
#     except Exception as e:
#         print("❌ Python Chat Error:", str(e))
#         raise HTTPException(
#             status_code=500,
#             detail="Failed to generate answer"
#         )