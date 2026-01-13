import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pymongo import MongoClient
from dotenv import load_dotenv

from langchain_huggingface import (
    HuggingFaceEmbeddings,
    ChatHuggingFace,
    HuggingFaceEndpoint,
)
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# -------------------------------------------------
# ENV + DB SETUP
# -------------------------------------------------

load_dotenv()

client = MongoClient(os.getenv("MONGO_URL"))
db = client[os.getenv("MONGO_DB_NAME")]
vector_collection = db["vector_store"]

embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# -------------------------------------------------
# VECTOR STORE
# -------------------------------------------------

def get_store():
    return MongoDBAtlasVectorSearch(
        collection=vector_collection,
        embedding=embedding,
        index_name="universal_index",
    )

# -------------------------------------------------
# LLM
# -------------------------------------------------

def get_llm():
    return ChatHuggingFace(
        llm=HuggingFaceEndpoint(
            repo_id=os.getenv("HUGGINGFACE_LLM_MODEL"),
            huggingfacehub_api_token=os.getenv("HUGGINGFACE_API_TOKEN"),
            max_new_tokens=384,
            temperature=0.3,
        )
    )

# -------------------------------------------------
# 🔥 FAST RAG REPORT (EXISTING LOGIC – UNTOUCHED)
# -------------------------------------------------

def generate_rag_report(topic, user_id, k=4):
    store = get_store()
    docs = store.similarity_search(
        topic,
        k=k,
        pre_filter={"user_id": {"$eq": user_id}},
    )

    if not docs:
        return "No relevant data found."

    context = "\n\n".join(d.page_content for d in docs[:3])

    llm = get_llm()
    prompt = PromptTemplate.from_template(
        "Create a concise professional report using ONLY this context:\n{context}"
    )

    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"context": context})

async def generate_rag_report_async(*args):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, generate_rag_report, *args)

# -------------------------------------------------
# ✅ REQUIRED FUNCTION (FIXES STARTUP ERROR)
# -------------------------------------------------

def chat_with_video(
    question: str,
    user_id: str,
    video_url: str,
    answer_language: str = "en",
    answer_tone: str = "neutral",
    answer_style: str = "auto",
    use_multi_query: bool = False,  # kept for backward compatibility
    k: int = 4,
):
    """
    Backward-compatible and FAST.
    Required to prevent FastAPI import crash.
    """

    store = get_store()
    docs = store.similarity_search(
        question,
        k=k,
        pre_filter={
            "user_id": {"$eq": user_id},
            "source": {"$eq": video_url},
        },
    )

    if not docs:
        return "I don't have enough information to answer this."

    # Keep context small for speed
    context = "\n\n".join(d.page_content for d in docs[:3])

    llm = get_llm()

    prompt = PromptTemplate(
        template="""
You are a helpful assistant.
Answer ONLY using the provided context.

Language: {language}
Tone: {tone}
Style: {style}

Context:
{context}

Question:
{question}

Answer:
""",
        input_variables=[
            "context",
            "question",
            "language",
            "tone",
            "style",
        ],
    )

    chain = prompt | llm | StrOutputParser()

    return chain.invoke({
        "context": context,
        "question": question,
        "language": answer_language,
        "tone": answer_tone,
        "style": answer_style,
    })

# -------------------------------------------------
# OPTIONAL ASYNC WRAPPER
# -------------------------------------------------

async def chat_with_video_async(*args, **kwargs):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None, chat_with_video, *args
    )



# # app/rag_engine.py

# import os
# import asyncio
# from pymongo import MongoClient
# from dotenv import load_dotenv

# # ---------------- EXISTING IMPORTS ----------------
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_mongodb import MongoDBAtlasVectorSearch

# # ---------------- RAG CHAIN IMPORTS ----------------
# from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser

# load_dotenv()

# # =========================================================
# # 1. CONFIGURATION
# # =========================================================
# MONGO_URL = os.getenv("MONGO_URL")
# DB_NAME = os.getenv("MONGO_DB_NAME")
# COLLECTION_NAME = "vector_store"
# INDEX_NAME = "vector_index"

# HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
# HUGGINGFACE_LLM_MODEL = os.getenv(
#     "HUGGINGFACE_LLM_MODEL",
#     "meta-llama/Llama-3.1-8B-Instruct"
# )
# HUGGINGFACE_EMBEDDING_MODEL = os.getenv(
#     "HUGGINGFACE_EMBEDDING_MODEL",
#     "intfloat/e5-small-v2"
# )

# LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", 0.2))
# LLM_MAX_NEW_TOKENS = int(os.getenv("LLM_MAX_NEW_TOKENS", 512))

# client = MongoClient(MONGO_URL)
# db = client[DB_NAME]
# vector_collection = db[COLLECTION_NAME]

# # =========================================================
# # 2. EMBEDDINGS & VECTOR STORE
# # =========================================================
# embedding_model = HuggingFaceEmbeddings(
#     model_name=HUGGINGFACE_EMBEDDING_MODEL
# )

# def get_vector_store():
#     return MongoDBAtlasVectorSearch(
#         collection=vector_collection,
#         embedding=embedding_model,
#         index_name=INDEX_NAME,
#         relevance_score_fn="cosine",
#     )

# # =========================================================
# # 3. LLM INITIALIZATION
# # =========================================================
# def _initialize_llm():
#     if not HUGGINGFACE_API_TOKEN:
#         raise ValueError("HUGGINGFACE_API_TOKEN missing")

#     endpoint = HuggingFaceEndpoint(
#         repo_id=HUGGINGFACE_LLM_MODEL,
#         huggingfacehub_api_token=HUGGINGFACE_API_TOKEN,
#         temperature=LLM_TEMPERATURE,
#         max_new_tokens=LLM_MAX_NEW_TOKENS,
#     )
#     return ChatHuggingFace(llm=endpoint)

# # =========================================================
# # 4. STORAGE
# # =========================================================
# def store_embeddings(text_content, metadata):
#     if not text_content or len(text_content.strip()) < 10:
#         return None

#     splitter = RecursiveCharacterTextSplitter(
#         chunk_size=500,
#         chunk_overlap=100,
#         separators=["\n\n", "\n", ".", " ", ""]
#     )

#     docs = splitter.create_documents(
#         [text_content],
#         metadatas=[metadata]
#     )

#     store = get_vector_store()
#     store.add_documents(docs)
#     return True

# async def store_embeddings_async(text_content, metadata):
#     loop = asyncio.get_running_loop()
#     return await loop.run_in_executor(
#         None, store_embeddings, text_content, metadata
#     )

# # =========================================================
# # 5. RETRIEVAL LOGIC
# # =========================================================

# def _fetch_docs(query, user_id, source=None, k=5):
#     """
#     Internal helper to get raw documents. 
#     Used by both simple retrieval and multi-query logic.
#     """
#     store = get_vector_store()

#     filter_query = {"user_id": {"$eq": user_id}}

#     if source:
#         filter_query["source"] = {"$eq": source}

#     # Perform similarity search
#     return store.similarity_search(
#         query,
#         k=k,
#         pre_filter=filter_query
#     )

# def generate_multi_queries(original_question, llm):
#     """
#     Generates alternative search queries using the LLM to improve retrieval coverage.
#     """
#     instruction = (
#         "Generate 3 alternative search queries that would help retrieve transcript "
#         "segments relevant to answering the following question about a YouTube video. "
#         "Return only the queries, one per line, without numbering or bullets.\n\n"
#         f"Original question:\n{original_question}"
#     )

#     try:
#         raw = llm.invoke(instruction)
#         # Handle different response types (content attribute vs string)
#         text = getattr(raw, "content", str(raw))
#         lines = [ln.strip("-• ").strip() for ln in text.splitlines()]
#         queries = [q for q in lines if q]
#     except Exception:
#         # Fallback to empty list if LLM fails
#         queries = []

#     # Always include the original question
#     queries.append(original_question)

#     # Deduplicate preserving order
#     seen = set()
#     unique_queries = []
#     for q in queries:
#         if q not in seen:
#             seen.add(q)
#             unique_queries.append(q)

#     return unique_queries

# def retrieve_context(query, user_id, source=None, k=5):
#     """
#     Standard retrieval returning a string (backward compatibility).
#     """
#     docs = _fetch_docs(query, user_id, source, k)
#     if not docs:
#         return ""
#     return "\n\n".join(d.page_content for d in docs)

# async def retrieve_context_async(query, user_id, source=None, k=5):
#     loop = asyncio.get_running_loop()
#     return await loop.run_in_executor(
#         None, retrieve_context, query, user_id, source, k
#     )

# # =========================================================
# # 6. VIDEO-AWARE RAG CHAT
# # =========================================================
# def chat_with_video(
#     question: str,
#     user_id: str,
#     video_url: str,
#     answer_language: str = "en",
#     answer_tone: str = "neutral",
#     answer_style: str = "auto",
#     use_multi_query: bool = False,
#     k: int = 5,
# ):
#     """
#     Chat with a specific video using RAG.
#     """
#     llm = _initialize_llm()

#     # --- Step 1: Retrieval (Simple vs Multi-Query) ---
#     final_docs = []
    
#     if use_multi_query:
#         # Generate variations
#         queries = generate_multi_queries(question, llm)
#         seen_contents = set()
        
#         for q in queries:
#             docs = _fetch_docs(q, user_id, source=video_url, k=k)
#             for doc in docs:
#                 content = getattr(doc, "page_content", "")
#                 if content and content not in seen_contents:
#                     seen_contents.add(content)
#                     final_docs.append(doc)
#     else:
#         # Standard single query
#         final_docs = _fetch_docs(question, user_id, source=video_url, k=k)

#     if not final_docs:
#         return "I don't have enough information from this video to answer that."

#     # Format context
#     context = "\n\n".join(d.page_content for d in final_docs)

#     # --- Step 2: Generation ---
#     prompt = PromptTemplate(
#         template="""
#             You are a helpful assistant that answers questions based on YouTube video transcripts.
#             Answer ONLY from the provided transcript context.
#             If the context is insufficient to answer the question, politely say that you don't have enough information.

#             You must answer in the language: {language}
#             Your tone should be: {tone}
#             Your answer style should be: {style}

#             Context:
#             {context}

#             Question: {question}

#             Answer:
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

# # =========================================================
# # 7. ASYNC ORCHESTRATION
# # =========================================================
# async def chat_with_video_async(*args, **kwargs):
#     loop = asyncio.get_running_loop()
#     return await loop.run_in_executor(
#         None, chat_with_video, *args, **kwargs
#     )


# # app/rag_engine.py
# import os
# from pymongo import MongoClient
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_mongodb import MongoDBAtlasVectorSearch
# from dotenv import load_dotenv

# load_dotenv()

# MONGO_URL = os.getenv("MONGO_URL")
# DB_NAME = os.getenv("MONGO_DB_NAME")
# COLLECTION_NAME = "vector_store"
# INDEX_NAME = "vector_index"

# client = MongoClient(MONGO_URL)
# db = client[DB_NAME]
# vector_collection = db[COLLECTION_NAME]

# # Initialize Embeddings
# embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# def get_vector_store():
#     return MongoDBAtlasVectorSearch(
#         collection=vector_collection,
#         embedding=embedding_model,
#         index_name=INDEX_NAME,
#         relevance_score_fn="cosine",
#     )

# def store_embeddings(text_content, metadata):
#     if not text_content or len(text_content.strip()) < 10:
#         return None

#     print("🧩 RAG: Splitting text for vector storage...")
#     text_splitter = RecursiveCharacterTextSplitter(
#         chunk_size=1000,
#         chunk_overlap=200,
#         separators=["\n\n", "\n", ".", " ", ""]
#     )
#     docs = text_splitter.create_documents([text_content], metadatas=[metadata])

#     vector_store = get_vector_store()
#     vector_store.add_documents(docs)
#     print(f"✔ RAG: Stored {len(docs)} vector chunks in MongoDB.")
#     return True

# def retrieve_context(query, user_id, k=5):
#     vector_store = get_vector_store()
    
#     # Filter by User ID for security
#     results = vector_store.similarity_search(
#         query, 
#         k=k,
#         pre_filter={"user_id": {"$eq": user_id}} 
#     )
    
#     if not results:
#         return ""

#     context = "\n\n".join([doc.page_content for doc in results])
#     return context