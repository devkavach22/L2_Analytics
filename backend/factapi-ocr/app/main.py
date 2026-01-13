import os
import subprocess
import sys
import traceback
import re
import json
import time
import threading
import queue 
from typing import Optional,Dict
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse,StreamingResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import requests
from .folder_analyzer.scanner import scan_folder
from .folder_analyzer.extractor import extract_content
from .folder_analyzer.analyzer import analyze_files
from .folder_analyzer.charts import build_charts
from .folder_analyzer.insights import generate_insights


# ------------------------------------------------------------
# PATH SETUP (ORIGINAL)
# ------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# ------------------------------------------------------------
# IMPORTS (ORIGINAL)
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
except ImportError as e:
    print(f"❌ Startup Import Error: {e}")

STREAM_QUEUE = queue.Queue()


# ============================================================
# UTILS (ORIGINAL)
# ============================================================
def clean_ai_response(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

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

def sanitize(obj):
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize(v) for v in obj]
    if hasattr(obj, "item"):
        return obj.item()
    return obj

# ============================================================
# STREAM UTILITIES (ORIGINAL)
# ============================================================
def stream(event: str, data):
    """
    Send event to:
    1. stdout (CLI / logs)
    2. STREAM_QUEUE (SSE frontend)
    """
    payload = {"event": event, "data": data}
    print(json.dumps(payload))
    sys.stdout.flush()
    STREAM_QUEUE.put(payload)

def stream_related(data):
    stream("related", data)

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

@app.on_event("startup")
async def startup_event():
    start_ollama_server()

class FolderAnalyzeRequest(BaseModel):
    folder_path: str


# ============================================================
# MODELS (ORIGINAL)
# ============================================================
class ChatRequest(BaseModel):
    user_id: str
    query: str
    link: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str

class IngestRequest(BaseModel):
    user_id: str
    url: str

class ReportRequest(BaseModel):
    user_id: str
    report_type: str
    keyword: Optional[str] = None
    new_file_text: Optional[str] = None

# ============================================================
# FOLDER ANALYSIS – ADVANCED ENGINE (NEW)
# ============================================================
FOLDER_ANALYSIS_CACHE: Dict[str, dict] = {}

def resolve_folder_path(folder_id: str) -> str:
    folder_path = os.path.join(UPLOAD_BASE, folder_id)
    if not os.path.exists(folder_path):
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder_path

def compute_folder_signature(files: list) -> str:
    payload = sorted(f"{f['name']}:{f['size']}" for f in files)
    return str(hash("|".join(payload)))

# ============================================================
# WORKERS
# ============================================================

def generate_related_content(req: ReportRequest):
    time.sleep(2)
    stream_related([
        f"Key compliance point for {req.report_type}",
        f"Risk factors related to {req.keyword or 'context'}",
        "Suggested next actions"
    ])

def report_worker(req: ReportRequest) -> dict:
    stream("status", "started")
    stream("text", "Initializing report pipeline...")

    # 🔥 PARALLEL RELATED CONTENT
    threading.Thread(
        target=generate_related_content,
        args=(req,),
        daemon=True
    ).start()

    pipeline = AgenticReportPipeline()

    for step in range(1, 6):
        time.sleep(1)
        stream("text", f"Processing step {step}/5")

    result = pipeline.run(
        user_id=req.user_id,
        report_type=req.report_type,
        keyword=req.keyword,
        new_file_text=req.new_file_text
    )
    stream("result",result)
    stream("status", "completed")
    stream("done",True)
    return result
    

def chat_worker(payload: ChatRequest) -> dict:
    if not payload.query:
        raise HTTPException(status_code=400, detail="Query is required")

    active_context_id = None

    if payload.link:
        active_context_id = utils.extract_video_id(payload.link)
    else:
        last_record = mongo_ocr_col.find_one(
            {"userId": payload.user_id},
            sort=[("createdAt", -1)]
        )
        if last_record:
            active_context_id = (
                utils.extract_video_id(last_record.get("originalFilename", ""))
                or payload.user_id
            )

    context_id = active_context_id or payload.user_id
    print(f"💬 Chat | Context: {context_id}")

    manager = vector_store.VectorStoreManager(context_id)
    print(manager)

    if payload.link and active_context_id:
        fetcher = transcript_fetcher.TranscriptFetcher()
        transcript = fetcher.fetch_transcript(payload.link)
        if not transcript:
            raise HTTPException(status_code=404, detail="Transcript not found")
        manager.create_vector_store(transcript)

    if not manager.load_vector_store():
        manager = vector_store.VectorStoreManager(payload.user_id)
        if not manager.load_vector_store():
            raise HTTPException(
                status_code=404,
                detail="No active context found. Provide a link first."
            )

    retriever = manager.get_retriever()
    rag = rag_chain.RAGChain(retriever)
    raw_answer = rag.query(payload.query)

    return {"answer": clean_ai_response(raw_answer)}

# ============================================================
# ENDPOINTS (ORIGINAL)
# ============================================================
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    try:
        return await run_in_threadpool(chat_worker, payload)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/agentic-report")
# async def agentic_report(req: ReportRequest):
#     try:
#         result = await run_in_threadpool(report_worker, req)
#         return JSONResponse(content=result)
#     except Exception as e:
#         traceback.print_exc()
#         stream("status", "failed")
#         stream("error", str(e))
#         return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/agentic-report")
async def agentic_report(req: ReportRequest):
    def event_generator():
        threading.Thread(
            target=report_worker,
            args=(req,),
            daemon=True
        ).start()
        while True:
            # event=STREAM_QUEUE.get()
            # yield f"data:{json.dumps(event)}\n\n"

            # if event.get("event") == "done":
            #     break
            try:
                event = STREAM_QUEUE.get(timeout=120)
                yield f"data: {json.dumps(event)}\n\n"

                if event.get("event") == "done":
                    break

            except queue.Empty:
                yield "data: {\"event\":\"ping\",\"data\":\"keep-alive\"}\n\n"
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

@app.post("/ingest")
async def ingest_link(req: IngestRequest):
    try:
        video_id = utils.extract_video_id(req.url)
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")

        fetcher = transcript_fetcher.TranscriptFetcher()
        transcript_text = fetcher.fetch_transcript(video_id)

        manager = vector_store.VectorStoreManager(video_id)
        manager.create_vector_store(transcript_text)

        return {"success": True, "video_id": video_id}
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    filename = file.filename
    file_body = await file.read()
    try:
        text = extract_text_from_file(file_body, filename)
        return {"success": True, "filename": filename, "text": text}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/folder/analyze")
async def analyze_folder(req: FolderAnalyzeRequest):
    folder_path = resolve_folder_path(req.folder_id)

    files = scan_folder(folder_path)
    if not files:
        return {
            "success": True,
            "data": {
                "status": "empty",
                "overview": {},
                "charts": {},
                "insights": ["📂 Folder is empty"],
                "files": []
            }
        }

    signature = compute_folder_signature(files)
    cached = FOLDER_ANALYSIS_CACHE.get(req.folder_id)

    if cached and cached["signature"] == signature and not req.force:
        return cached["response"]

    for f in files:
        f["content"] = extract_content(f)

    stats = analyze_files(files)

    response = {
        "success": True,
        "data": {
            "status": "analyzed",
            "folderId": req.folder_id,
            "overview": {
                "total_files": stats["total_files"],
                "total_size": stats["total_size"],
                "file_types": stats["file_types"]
            },
            "charts": build_charts(stats),
            "insights": generate_insights(stats),
            "files": [
                {"name": f["name"], "type": f["ext"], "size": f["size"]}
                for f in files
            ]
        }
    }

    FOLDER_ANALYSIS_CACHE[req.folder_id] = {
        "signature": signature,
        "response": sanitize(response)
    }

    return sanitize(response)



# ============================================================
# CLI STREAM MODE (UNCHANGED)
# ============================================================
if __name__ == "__main__":
    if "--stream" in sys.argv:
        stream("status", "started")
        for i in range(1, 6):
            time.sleep(1)
            stream("text", f"Generating report section {i}")
        stream("status", "completed")



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