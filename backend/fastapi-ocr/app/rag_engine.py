# app/rag_engine.py

import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pymongo import MongoClient
from dotenv import load_dotenv

# ---------------- EXISTING IMPORTS ----------------
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_mongodb import MongoDBAtlasVectorSearch

# ---------------- RAG CHAIN IMPORTS ----------------
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# ---------------- NEW (SAFE) IMPORT ----------------
from langchain.callbacks.base import BaseCallbackHandler

# ---------------- REPORT GENERATION IMPORTS ----------------
try:
    from .generators.report_generator import render_html_report
except ImportError:
    try:
        from report_generator import render_html_report
    except ImportError:
        print("Warning: report_generator module not found.")
        def render_html_report(data, report_type, user_id):
            return f"PDF generator missing. Content: {data.get('title')}"

# ---------------- OPENAI IMPORTS (OPTIONAL) ----------------
try:
    from langchain_openai import OpenAIEmbeddings, ChatOpenAI
except ImportError:
    OpenAIEmbeddings = None
    ChatOpenAI = None

load_dotenv()

# =========================================================
# CONFIGURATION (UNCHANGED)
# =========================================================
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("MONGO_DB_NAME")
COLLECTION_NAME = "vector_store"
INDEX_NAME = "universal_index"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
HUGGINGFACE_LLM_MODEL = os.getenv(
    "HUGGINGFACE_LLM_MODEL",
    "meta-llama/Llama-3.1-8B-Instruct"
)
HUGGINGFACE_EMBEDDING_MODEL = os.getenv(
    "HUGGINGFACE_EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2"
)

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 500))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 100))
RETRIEVAL_K = int(os.getenv("RETRIEVAL_K", 4))
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", 0.4))
LLM_MAX_NEW_TOKENS = int(os.getenv("LLM_MAX_NEW_TOKENS", 512))

client = MongoClient(MONGO_URL)
db = client[DB_NAME]
vector_collection = db[COLLECTION_NAME]

# =========================================================
# EMBEDDINGS & VECTOR STORE (UNCHANGED)
# =========================================================
def _get_embedding_model():
    if OPENAI_API_KEY and OpenAIEmbeddings:
        return OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
    return HuggingFaceEmbeddings(model_name=HUGGINGFACE_EMBEDDING_MODEL)

embedding_model = _get_embedding_model()

def get_vector_store():
    return MongoDBAtlasVectorSearch(
        collection=vector_collection,
        embedding=embedding_model,
        index_name=INDEX_NAME,
        relevance_score_fn="cosine",
    )

# =========================================================
# LLM INITIALIZATION (EXTENDED FOR STREAMING)
# =========================================================
def _initialize_llm(callbacks=None):
    if OPENAI_API_KEY and ChatOpenAI:
        return ChatOpenAI(
            openai_api_key=OPENAI_API_KEY,
            model_name="gpt-4o-mini",
            temperature=LLM_TEMPERATURE,
            streaming=bool(callbacks),
            callbacks=callbacks
        )

    endpoint = HuggingFaceEndpoint(
        repo_id=HUGGINGFACE_LLM_MODEL,
        huggingfacehub_api_token=HUGGINGFACE_API_TOKEN,
        temperature=LLM_TEMPERATURE,
        max_new_tokens=LLM_MAX_NEW_TOKENS,
        streaming=bool(callbacks)
    )

    return ChatHuggingFace(llm=endpoint, callbacks=callbacks)

# =========================================================
# INTERNAL RETRIEVAL (UNCHANGED)
# =========================================================
def _fetch_docs(query, user_id, source=None, k=RETRIEVAL_K, strict_source=True):
    store = get_vector_store()
    filter_query = {"user_id": {"$eq": user_id}}
    if strict_source and source:
        filter_query["source"] = {"$eq": source}
    return store.similarity_search(query, k=k, pre_filter=filter_query)

# =========================================================
# 🔥 NEW: STREAMING CALLBACK
# =========================================================
class StreamingCallback(BaseCallbackHandler):
    def __init__(self, on_token):
        self.on_token = on_token

    def on_llm_new_token(self, token: str, **kwargs):
        if self.on_token:
            self.on_token(token)

# =========================================================
# 🔥 NEW: LONG-FORM GENERATION (USED BY main.py)
# =========================================================
def generate_long_form_answer(
    query: str,
    user_id: str,
    stream_callback=None,
    k: int = RETRIEVAL_K
):
    """
    Streaming-friendly RAG generation for reports / canvas UI.
    """
    docs = _fetch_docs(
        query=query,
        user_id=user_id,
        source=None,
        k=k,
        strict_source=False
    )

    if not docs:
        return "No relevant information found."

    context = "\n\n".join(d.page_content for d in docs)

    callbacks = []
    if stream_callback:
        callbacks.append(StreamingCallback(stream_callback))

    llm = _initialize_llm(callbacks=callbacks)

    prompt = PromptTemplate(
        template="""
You are a professional report writer.

Write a structured, factual report using ONLY the context.

Context:
{context}

Topic:
{question}

Report:
""",
        input_variables=["context", "question"]
    )

    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"context": context, "question": query})

# =========================================================
# 4. STORAGE
# =========================================================
def store_embeddings(text_content, metadata):
    if not text_content or len(text_content.strip()) < 10:
        return None

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " ", ""]
    )

    docs = splitter.create_documents([text_content], metadatas=[metadata])
    store = get_vector_store()
    store.add_documents(docs)
    print(f"✔ RAG: Stored {len(docs)} chunks for source: {metadata.get('source', 'unknown')}")
    return True

async def store_embeddings_async(text_content, metadata):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, store_embeddings, text_content, metadata)

# =========================================================
# 5. RETRIEVAL LOGIC (OPTIMIZED)
# =========================================================

def _fetch_docs(query, user_id, source=None, k=RETRIEVAL_K, strict_source=True):
    """Internal helper to get raw documents."""
    store = get_vector_store()
    filter_query = {"user_id": {"$eq": user_id}}
    
    if strict_source and source:
        filter_query["source"] = {"$eq": source}

    return store.similarity_search(query, k=k, pre_filter=filter_query)

def generate_multi_queries(original_question, llm):
    instruction = (
        "Generate 3 alternative search queries for: \n"
        f"{original_question}\n"
        "Return one per line."
    )
    try:
        raw = llm.invoke(instruction)
        text = getattr(raw, "content", str(raw))
        lines = [ln.strip("-• ").strip() for ln in text.splitlines()]
        queries = [q for q in lines if q]
    except Exception:
        queries = []

    queries.append(original_question)
    return list(dict.fromkeys(queries))

# =========================================================
# 6. CHAT & REPORT FUNCTIONS
# =========================================================

def chat_with_video(
    question: str,
    user_id: str,
    video_url: str,
    answer_language: str = "en",
    answer_tone: str = "neutral",
    answer_style: str = "auto",
    use_multi_query: bool = False,
    k: int = RETRIEVAL_K,
):
    llm = _initialize_llm()

    final_docs = []
    queries = [question]
    
    if use_multi_query:
        queries = generate_multi_queries(question, llm)

    seen_contents = set()

    def fetch_strict(q):
        return _fetch_docs(q, user_id, source=video_url, k=k, strict_source=True)

    def fetch_relaxed(q):
        return _fetch_docs(q, user_id, source=None, k=k, strict_source=False)

    with ThreadPoolExecutor() as executor:
        strict_results = list(executor.map(fetch_strict, queries))

    for docs in strict_results:
        for doc in docs:
            if doc.page_content not in seen_contents:
                seen_contents.add(doc.page_content)
                final_docs.append(doc)

    if not final_docs and video_url:
        print("⚠️ No strict matches. Parallel relaxed search...")
        with ThreadPoolExecutor() as executor:
            relaxed_results = list(executor.map(fetch_relaxed, queries))
            
        for docs in relaxed_results:
            for doc in docs:
                if doc.page_content not in seen_contents:
                    seen_contents.add(doc.page_content)
                    final_docs.append(doc)

    if not final_docs:
        return "I don't have enough information to answer that."

    context = "\n\n".join(d.page_content for d in final_docs)

    prompt_text = f"""
            You are a helpful assistant. Answer ONLY based on the context.
            Language: {answer_language}. Tone: {answer_tone}. Style: {answer_style}.

            Context:
            {{context}}

            Question: {{question}}

            Answer:
            """

    prompt = PromptTemplate(template=prompt_text, input_variables=["context", "question"])
    chain = prompt | llm | StrOutputParser()

    return chain.invoke({"context": context, "question": question})


def generate_rag_report(topic: str, user_id: str, report_format: str = "detailed", k: int = 4):
    llm = _initialize_llm()
    queries = generate_multi_queries(topic, llm)
    
    final_docs = []
    seen_contents = set()

    def fetch_global(q):
        return _fetch_docs(q, user_id, source=None, k=k, strict_source=False)

    with ThreadPoolExecutor() as executor:
        results = list(executor.map(fetch_global, queries))

    for docs in results:
        for doc in docs:
            if doc.page_content not in seen_contents:
                seen_contents.add(doc.page_content)
                final_docs.append(doc)

    if not final_docs:
        return "Insufficient data found in your knowledge base."

    context = "\n\n".join(d.page_content for d in final_docs)

    prompt_text = f"""
    You are an expert AI Analyst. 
    Create a {report_format} report on the topic: "{{topic}}".
    Base your report ONLY on the following Context.

    Context:
    {{context}}

    Report Structure:
    1. Executive Summary
    2. Key Findings & Insights
    3. Detailed Analysis
    4. Conclusion

    Format the output in clean Markdown.
    """

    prompt = PromptTemplate(template=prompt_text, input_variables=["context", "topic"])
    chain = prompt | llm | StrOutputParser()

    return chain.invoke({"context": context, "topic": topic})

# =========================================================
# 7. ASYNC ORCHESTRATION
# =========================================================
async def chat_with_video_async(*args, **kwargs):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, chat_with_video, *args, **kwargs)

async def generate_rag_report_async(*args, **kwargs):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, generate_rag_report, *args, **kwargs)

# =========================================================
# 8. LAW-ENFORCEMENT CASE REPORT GENERATION (ADDED)
# =========================================================

CASE_REPORT_PROMPTS = {
    "master_criminal_profile": """
    Create a Master Criminal Profile using ONLY the context.
    Rules: Do not speculate. Use neutral, law-enforcement tone.

    Structure:
    1. Executive Summary
    2. Identity & Background (Name, Aliases, DOB, Physical Desc)
    3. Criminal History & Modus Operandi (MO)
    4. Known Associates & Gang Affiliations
    5. Psychological & Behavioral Risk Indicators
    6. Current Legal Status & Recommendations

    Context:
    {context}
    """,

    "fir_case_analysis": """
    Create an FIR & Case Analytical Summary.
    Structure:
    1. Case Overview (FIR No, Date, Station)
    2. Timeline of Events (Chronological)
    3. Charges & Sections (IPC/Legal Codes)
    4. Evidence Summary (Physical, Digital, Witness)
    5. Investigation Gaps & Leads

    Context:
    {context}
    """,

    "interrogation_intelligence": """
    Create an Interrogation Intelligence Report.
    Rules: Do NOT conclude guilt. Highlight inconsistencies.

    Structure:
    1. Subject Overview
    2. Key Admissions & Denials
    3. Contradictions & Inconsistencies
    4. Behavioral Observations (Stress, Defensiveness)
    5. New Investigative Leads generated

    Context:
    {context}
    """,

    "custody_movement": """
    Create a Prison & Custody Movement Report.
    Structure:
    1. Current Status
    2. Custody Timeline (Arrest, Remand, Jail Transfers)
    3. Medical & Conduct Record
    4. Court Production History
    5. Security Alerts

    Context:
    {context}
    """,

    "gang_network": """
    Create a Gang Network & Association Report.
    Structure:
    1. Network Overview & Hierarchy
    2. Key Individuals & Roles
    3. Relationship Mapping (Proven vs Suspected)
    4. Shared Activities & Areas of Operation
    5. Threat Assessment

    Context:
    {context}
    """,

    "court_ready_summary": """
    Create a Court-Ready Legal Summary (Charge Sheet Helper).
    Structure:
    1. Accused Details
    2. Summary of Allegations
    3. Marshaled Evidence (Connecting Accused to Crime)
    4. Procedural Compliance Check
    5. Witness List Summary

    Context:
    {context}
    """
}

def generate_case_report(
    report_type: str,
    user_id: str,
    k: int = 4
):
    """
    Generates court-safe, law-enforcement reports using the RAG engine.
    """
    llm = _initialize_llm()

    # Reuse existing retrieval function
    # Search broadly using the report type name to gather relevant case files
    search_term = report_type.replace("_", " ")
    docs = _fetch_docs(
        query=search_term,
        user_id=user_id,
        source=None,
        k=k,
        strict_source=False
    )

    if not docs:
        return "No sufficient data found in the knowledge base to generate this report."

    context = "\n\n".join(d.page_content for d in docs)

    # Select Prompt based on report type
    # Normalize report_type string
    normalized_type = report_type.lower().replace(" ", "_")
    
    # Fallback mechanisms for prompt selection
    selected_prompt = CASE_REPORT_PROMPTS.get("fir_case_analysis") # Default
    for key in CASE_REPORT_PROMPTS:
        if key in normalized_type:
            selected_prompt = CASE_REPORT_PROMPTS[key]
            break

    prompt = PromptTemplate(
        template=selected_prompt,
        input_variables=["context"]
    )

    print(f"👮‍♂️ Generating Law Enforcement Report: {report_type}")
    
    # Generate Content
    chain = prompt | llm | StrOutputParser()
    report_text = chain.invoke({"context": context})

    # Prepare data for PDF generation
    # FIX: Ensure data structure matches what render_html_report likely expects (from agent_orchestrator usage)
    clean_report_type = report_type.strip()
    
    data = {
        "title": clean_report_type.replace("_", " ").title(),
        "executive_summary": "Automated Law Enforcement Analysis generated from Vector Knowledge Base.",
        "report": report_text,
        "final_report_text": report_text # Added for consistency with AgenticReportPipeline
    }

    # Pass the REPORTS_DIR explicitly
    # FIX: Removed 'folder_path' to match render_html_report signature
    saved_file_path = render_html_report(
        data=data,
        report_type=clean_report_type,
        user_id=str(user_id)
        # folder_path=REPORTS_DIR # <-- REMOVED TO FIX ERROR
    )

    # 5. Construct URL
    if saved_file_path and os.path.exists(saved_file_path):
        filename = os.path.basename(saved_file_path)
        return {
            "success": True,
            "report_text": report_text,
            "download_link": f"{REPORTS_URL_PREFIX}{filename}"
        }
    
    return {"success": False, "report_text": report_text, "error": "File generation failed"}

async def generate_case_report_async(report_type: str, user_id: str, k: int = 4):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, generate_case_report, report_type, user_id, k)

    
# import os
# import asyncio
# from concurrent.futures import ThreadPoolExecutor
# from pymongo import MongoClient
# from dotenv import load_dotenv

# from langchain_huggingface import (
#     HuggingFaceEmbeddings,
#     ChatHuggingFace,
#     HuggingFaceEndpoint,
# )
# from langchain_mongodb import MongoDBAtlasVectorSearch
# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser

# # -------------------------------------------------
# # ENV + DB SETUP
# # -------------------------------------------------

# load_dotenv()

# client = MongoClient(os.getenv("MONGO_URL"))
# db = client[os.getenv("MONGO_DB_NAME")]
# vector_collection = db["vector_store"]

# embedding = HuggingFaceEmbeddings(
#     model_name="sentence-transformers/all-MiniLM-L6-v2"
# )

# # -------------------------------------------------
# # VECTOR STORE
# # -------------------------------------------------

# def get_store():
#     return MongoDBAtlasVectorSearch(
#         collection=vector_collection,
#         embedding=embedding,
#         index_name="universal_index",
#     )

# # -------------------------------------------------
# # LLM
# # -------------------------------------------------

# def get_llm():
#     return ChatHuggingFace(
#         llm=HuggingFaceEndpoint(
#             repo_id=os.getenv("HUGGINGFACE_LLM_MODEL"),
#             huggingfacehub_api_token=os.getenv("HUGGINGFACE_API_TOKEN"),
#             max_new_tokens=384,
#             temperature=0.3,
#         )
#     )

# # -------------------------------------------------
# # 🔥 FAST RAG REPORT (EXISTING LOGIC – UNTOUCHED)
# # -------------------------------------------------

# def generate_rag_report(topic, user_id, k=4):
#     store = get_store()
#     docs = store.similarity_search(
#         topic,
#         k=k,
#         pre_filter={"user_id": {"$eq": user_id}},
#     )

#     if not docs:
#         return "No relevant data found."

#     context = "\n\n".join(d.page_content for d in docs[:3])

#     llm = get_llm()
#     prompt = PromptTemplate.from_template(
#         "Create a concise professional report using ONLY this context:\n{context}"
#     )

#     chain = prompt | llm | StrOutputParser()
#     return chain.invoke({"context": context})

# async def generate_rag_report_async(*args):
#     loop = asyncio.get_running_loop()
#     return await loop.run_in_executor(None, generate_rag_report, *args)

# # -------------------------------------------------
# # ✅ REQUIRED FUNCTION (FIXES STARTUP ERROR)
# # -------------------------------------------------

# def chat_with_video(
#     question: str,
#     user_id: str,
#     video_url: str,
#     answer_language: str = "en",
#     answer_tone: str = "neutral",
#     answer_style: str = "auto",
#     use_multi_query: bool = False,  # kept for backward compatibility
#     k: int = 4,
# ):
#     """
#     Backward-compatible and FAST.
#     Required to prevent FastAPI import crash.
#     """

#     store = get_store()
#     docs = store.similarity_search(
#         question,
#         k=k,
#         pre_filter={
#             "user_id": {"$eq": user_id},
#             "source": {"$eq": video_url},
#         },
#     )

#     if not docs:
#         return "I don't have enough information to answer this."

#     # Keep context small for speed
#     context = "\n\n".join(d.page_content for d in docs[:3])

#     llm = get_llm()

#     prompt = PromptTemplate(
#         template="""
# You are a helpful assistant.
# Answer ONLY using the provided context.

# Language: {language}
# Tone: {tone}
# Style: {style}

# Context:
# {context}

# Question:
# {question}

# Answer:
# """,
#         input_variables=[
#             "context",
#             "question",
#             "language",
#             "tone",
#             "style",
#         ],
#     )

#     chain = prompt | llm | StrOutputParser()

#     return chain.invoke({
#         "context": context,
#         "question": question,
#         "language": answer_language,
#         "tone": answer_tone,
#         "style": answer_style,
#     })

# # -------------------------------------------------
# # OPTIONAL ASYNC WRAPPER
# # -------------------------------------------------

# async def chat_with_video_async(*args, **kwargs):
#     loop = asyncio.get_running_loop()
#     return await loop.run_in_executor(
#         None, chat_with_video, *args
#     )



# # # app/rag_engine.py

# # import os
# # import asyncio
# # from pymongo import MongoClient
# # from dotenv import load_dotenv

# # # ---------------- EXISTING IMPORTS ----------------
# # from langchain_huggingface import HuggingFaceEmbeddings
# # from langchain_text_splitters import RecursiveCharacterTextSplitter
# # from langchain_mongodb import MongoDBAtlasVectorSearch

# # # ---------------- RAG CHAIN IMPORTS ----------------
# # from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
# # from langchain_core.prompts import PromptTemplate
# # from langchain_core.output_parsers import StrOutputParser

# # load_dotenv()

# # # =========================================================
# # # 1. CONFIGURATION
# # # =========================================================
# # MONGO_URL = os.getenv("MONGO_URL")
# # DB_NAME = os.getenv("MONGO_DB_NAME")
# # COLLECTION_NAME = "vector_store"
# # INDEX_NAME = "vector_index"

# # HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
# # HUGGINGFACE_LLM_MODEL = os.getenv(
# #     "HUGGINGFACE_LLM_MODEL",
# #     "meta-llama/Llama-3.1-8B-Instruct"
# # )
# # HUGGINGFACE_EMBEDDING_MODEL = os.getenv(
# #     "HUGGINGFACE_EMBEDDING_MODEL",
# #     "intfloat/e5-small-v2"
# # )

# # LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", 0.2))
# # LLM_MAX_NEW_TOKENS = int(os.getenv("LLM_MAX_NEW_TOKENS", 512))

# # client = MongoClient(MONGO_URL)
# # db = client[DB_NAME]
# # vector_collection = db[COLLECTION_NAME]

# # # =========================================================
# # # 2. EMBEDDINGS & VECTOR STORE
# # # =========================================================
# # embedding_model = HuggingFaceEmbeddings(
# #     model_name=HUGGINGFACE_EMBEDDING_MODEL
# # )

# # def get_vector_store():
# #     return MongoDBAtlasVectorSearch(
# #         collection=vector_collection,
# #         embedding=embedding_model,
# #         index_name=INDEX_NAME,
# #         relevance_score_fn="cosine",
# #     )

# # # =========================================================
# # # 3. LLM INITIALIZATION
# # # =========================================================
# # def _initialize_llm():
# #     if not HUGGINGFACE_API_TOKEN:
# #         raise ValueError("HUGGINGFACE_API_TOKEN missing")

# #     endpoint = HuggingFaceEndpoint(
# #         repo_id=HUGGINGFACE_LLM_MODEL,
# #         huggingfacehub_api_token=HUGGINGFACE_API_TOKEN,
# #         temperature=LLM_TEMPERATURE,
# #         max_new_tokens=LLM_MAX_NEW_TOKENS,
# #     )
# #     return ChatHuggingFace(llm=endpoint)

# # # =========================================================
# # # 4. STORAGE
# # # =========================================================
# # def store_embeddings(text_content, metadata):
# #     if not text_content or len(text_content.strip()) < 10:
# #         return None

# #     splitter = RecursiveCharacterTextSplitter(
# #         chunk_size=500,
# #         chunk_overlap=100,
# #         separators=["\n\n", "\n", ".", " ", ""]
# #     )

# #     docs = splitter.create_documents(
# #         [text_content],
# #         metadatas=[metadata]
# #     )

# #     store = get_vector_store()
# #     store.add_documents(docs)
# #     return True

# # async def store_embeddings_async(text_content, metadata):
# #     loop = asyncio.get_running_loop()
# #     return await loop.run_in_executor(
# #         None, store_embeddings, text_content, metadata
# #     )

# # # =========================================================
# # # 5. RETRIEVAL LOGIC
# # # =========================================================

# # def _fetch_docs(query, user_id, source=None, k=5):
# #     """
# #     Internal helper to get raw documents. 
# #     Used by both simple retrieval and multi-query logic.
# #     """
# #     store = get_vector_store()

# #     filter_query = {"user_id": {"$eq": user_id}}

# #     if source:
# #         filter_query["source"] = {"$eq": source}

# #     # Perform similarity search
# #     return store.similarity_search(
# #         query,
# #         k=k,
# #         pre_filter=filter_query
# #     )

# # def generate_multi_queries(original_question, llm):
# #     """
# #     Generates alternative search queries using the LLM to improve retrieval coverage.
# #     """
# #     instruction = (
# #         "Generate 3 alternative search queries that would help retrieve transcript "
# #         "segments relevant to answering the following question about a YouTube video. "
# #         "Return only the queries, one per line, without numbering or bullets.\n\n"
# #         f"Original question:\n{original_question}"
# #     )

# #     try:
# #         raw = llm.invoke(instruction)
# #         # Handle different response types (content attribute vs string)
# #         text = getattr(raw, "content", str(raw))
# #         lines = [ln.strip("-• ").strip() for ln in text.splitlines()]
# #         queries = [q for q in lines if q]
# #     except Exception:
# #         # Fallback to empty list if LLM fails
# #         queries = []

# #     # Always include the original question
# #     queries.append(original_question)

# #     # Deduplicate preserving order
# #     seen = set()
# #     unique_queries = []
# #     for q in queries:
# #         if q not in seen:
# #             seen.add(q)
# #             unique_queries.append(q)

# #     return unique_queries

# # def retrieve_context(query, user_id, source=None, k=5):
# #     """
# #     Standard retrieval returning a string (backward compatibility).
# #     """
# #     docs = _fetch_docs(query, user_id, source, k)
# #     if not docs:
# #         return ""
# #     return "\n\n".join(d.page_content for d in docs)

# # async def retrieve_context_async(query, user_id, source=None, k=5):
# #     loop = asyncio.get_running_loop()
# #     return await loop.run_in_executor(
# #         None, retrieve_context, query, user_id, source, k
# #     )

# # # =========================================================
# # # 6. VIDEO-AWARE RAG CHAT
# # # =========================================================
# # def chat_with_video(
# #     question: str,
# #     user_id: str,
# #     video_url: str,
# #     answer_language: str = "en",
# #     answer_tone: str = "neutral",
# #     answer_style: str = "auto",
# #     use_multi_query: bool = False,
# #     k: int = 5,
# # ):
# #     """
# #     Chat with a specific video using RAG.
# #     """
# #     llm = _initialize_llm()

# #     # --- Step 1: Retrieval (Simple vs Multi-Query) ---
# #     final_docs = []
    
# #     if use_multi_query:
# #         # Generate variations
# #         queries = generate_multi_queries(question, llm)
# #         seen_contents = set()
        
# #         for q in queries:
# #             docs = _fetch_docs(q, user_id, source=video_url, k=k)
# #             for doc in docs:
# #                 content = getattr(doc, "page_content", "")
# #                 if content and content not in seen_contents:
# #                     seen_contents.add(content)
# #                     final_docs.append(doc)
# #     else:
# #         # Standard single query
# #         final_docs = _fetch_docs(question, user_id, source=video_url, k=k)

# #     if not final_docs:
# #         return "I don't have enough information from this video to answer that."

# #     # Format context
# #     context = "\n\n".join(d.page_content for d in final_docs)

# #     # --- Step 2: Generation ---
# #     prompt = PromptTemplate(
# #         template="""
# #             You are a helpful assistant that answers questions based on YouTube video transcripts.
# #             Answer ONLY from the provided transcript context.
# #             If the context is insufficient to answer the question, politely say that you don't have enough information.

# #             You must answer in the language: {language}
# #             Your tone should be: {tone}
# #             Your answer style should be: {style}

# #             Context:
# #             {context}

# #             Question: {question}

# #             Answer:
# # """,
# #         input_variables=[
# #             "context",
# #             "question",
# #             "language",
# #             "tone",
# #             "style",
# #         ],
# #     )

# #     chain = prompt | llm | StrOutputParser()

# #     return chain.invoke({
# #         "context": context,
# #         "question": question,
# #         "language": answer_language,
# #         "tone": answer_tone,
# #         "style": answer_style,
# #     })

# # # =========================================================
# # # 7. ASYNC ORCHESTRATION
# # # =========================================================
# # async def chat_with_video_async(*args, **kwargs):
# #     loop = asyncio.get_running_loop()
# #     return await loop.run_in_executor(
# #         None, chat_with_video, *args, **kwargs
# #     )


# # # app/rag_engine.py
# # import os
# # from pymongo import MongoClient
# # from langchain_huggingface import HuggingFaceEmbeddings
# # from langchain_text_splitters import RecursiveCharacterTextSplitter
# # from langchain_mongodb import MongoDBAtlasVectorSearch
# # from dotenv import load_dotenv

# # load_dotenv()

# # MONGO_URL = os.getenv("MONGO_URL")
# # DB_NAME = os.getenv("MONGO_DB_NAME")
# # COLLECTION_NAME = "vector_store"
# # INDEX_NAME = "vector_index"

# # client = MongoClient(MONGO_URL)
# # db = client[DB_NAME]
# # vector_collection = db[COLLECTION_NAME]

# # # Initialize Embeddings
# # embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# # def get_vector_store():
# #     return MongoDBAtlasVectorSearch(
# #         collection=vector_collection,
# #         embedding=embedding_model,
# #         index_name=INDEX_NAME,
# #         relevance_score_fn="cosine",
# #     )

# # def store_embeddings(text_content, metadata):
# #     if not text_content or len(text_content.strip()) < 10:
# #         return None

# #     print("🧩 RAG: Splitting text for vector storage...")
# #     text_splitter = RecursiveCharacterTextSplitter(
# #         chunk_size=1000,
# #         chunk_overlap=200,
# #         separators=["\n\n", "\n", ".", " ", ""]
# #     )
# #     docs = text_splitter.create_documents([text_content], metadatas=[metadata])

# #     vector_store = get_vector_store()
# #     vector_store.add_documents(docs)
# #     print(f"✔ RAG: Stored {len(docs)} vector chunks in MongoDB.")
# #     return True

# # def retrieve_context(query, user_id, k=5):
# #     vector_store = get_vector_store()
    
# #     # Filter by User ID for security
# #     results = vector_store.similarity_search(
# #         query, 
# #         k=k,
# #         pre_filter={"user_id": {"$eq": user_id}} 
# #     )
    
# #     if not results:
# #         return ""

# #     context = "\n\n".join([doc.page_content for doc in results])
# #     return context