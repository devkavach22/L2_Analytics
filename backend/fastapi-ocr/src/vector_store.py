import os
import sys
import re
from typing import List, Optional

import chromadb
from chromadb.config import Settings

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LCDocument

from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


class VectorStoreManager:
    """
    Global Chroma Vector Store Manager
    SINGLE DB for entire application
    """

    def __init__(self, video_id: str):
        # Only video_id needed
        self.video_id = video_id

        # Clean ID for metadata safety
        self.safe_video_id = re.sub(r"[^a-zA-Z0-9._-]", "_", video_id).strip("_")[:120]

        # 🔥 ONE GLOBAL COLLECTION FOR ALL DATA
        self.collection_name = f"{config.CHROMA_COLLECTION_NAME}_global"

        self.persist_directory = config.CHROMA_PERSIST_DIRECTORY

        # LangChain embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name=config.HUGGINGFACE_EMBEDDING_MODEL,
            encode_kwargs={"normalize_embeddings": True}
            # huggingfacehub_api_token=os.getenv("HUGGINGFACE_INFERENCE_API_TOKEN")
        )

        # LlamaIndex embeddings
        self.llama_embeddings = HuggingFaceEmbedding(
            model_name=config.HUGGINGFACE_EMBEDDING_MODEL
        )

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150
        )

        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=Settings(anonymized_telemetry=False),
        )

        self.vector_store: Optional[Chroma] = None
        self.llama_index: Optional[VectorStoreIndex] = None

    # ---------------------------------------------------------
    # CREATE VECTOR STORE (for new transcript ingestion)
    # ---------------------------------------------------------
    def create_vector_store(self, transcript_text: str) -> Chroma:
        documents = self.text_splitter.create_documents([transcript_text])

        for i, doc in enumerate(documents):
            doc.metadata = {
                'video_id': self.safe_video_id,
                'chunk_index': i,
                'source': 'youtube_transcript'
            }

        # ⚠ GLOBAL DB → DO NOT DELETE COLLECTION
        self.vector_store = self.get_or_create_store()
        self.vector_store.add_documents(documents)
        self.vector_store.persist()

        self._load_llama_index()
        return self.vector_store

    # ---------------------------------------------------------
    # LOAD STORE
    # ---------------------------------------------------------
    def load_vector_store(self) -> Optional[Chroma]:
        try:
            self.vector_store = Chroma(
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory,
                client=self.client
            )
            self._load_llama_index()
            return self.vector_store
        except:
            return None

    # ---------------------------------------------------------
    # GET OR CREATE GLOBAL STORE
    # ---------------------------------------------------------
    def get_or_create_store(self):
        if self.vector_store:
            return self.vector_store

        self.vector_store = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory,
            client=self.client
        )
        return self.vector_store

    # ---------------------------------------------------------
    # ADD DOCUMENTS LATER
    # ---------------------------------------------------------
    def add_documents(self, documents: List[LCDocument]):
        store = self.get_or_create_store()
        store.add_documents(documents)
        store.persist()
        self._load_llama_index()

    # ---------------------------------------------------------
    # LANGCHAIN RETRIEVER
    # ---------------------------------------------------------
    def get_retriever(self, k: int = None):
        if self.vector_store is None:
            raise ValueError("Vector store not initialized.")

        if k is None:
            k = config.RETRIEVAL_K

        return self.vector_store.as_retriever(search_kwargs={"k": k})

    # ---------------------------------------------------------
    # LLAMAINDEX QUERY ENGINE
    # ---------------------------------------------------------
    def get_llama_query_engine(self):
        if self.llama_index is None:
            raise ValueError("LlamaIndex not initialized")

        llm = Ollama(
            model="llama3",
            timeout=900,
            temperature=0.2,
            max_new_tokens=2048,
        )

        return self.llama_index.as_query_engine(llm=llm, similarity_top_k=3)

    # ---------------------------------------------------------
    # LOAD LLAMAINDEX FROM CHROMA
    # ---------------------------------------------------------
    def _load_llama_index(self):
        chroma_collection = self.client.get_or_create_collection(
            name=self.collection_name
        )

        vector_store = ChromaVectorStore(chroma_collection=chroma_collection)

        storage_context = StorageContext.from_defaults(vector_store=vector_store)

        self.llama_index = VectorStoreIndex.from_vector_store(
            vector_store=vector_store,
            storage_context=storage_context,
            embed_model=self.llama_embeddings,
        )

    # ---------------------------------------------------------
    # DELETE EVERYTHING (optional admin use)
    # ---------------------------------------------------------
    def delete_vector_store(self):
        try:
            self.client.delete_collection(name=self.collection_name)
            self.vector_store = None
            self.llama_index = None
        except:
            pass


# """
# Vector Store Module using ChromaDB
# """
# import os
# import sys
# from typing import List, Optional
# import chromadb
# from chromadb.config import Settings
# from langchain_community.embeddings import HuggingFaceEmbeddings
# from langchain_community.vectorstores import Chroma
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_core.documents import Document

# # Add parent directory to path for config import
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# import config


# class VectorStoreManager:
#     """Manages ChromaDB vector store for YouTube transcripts."""
    
#     def __init__(self, video_id: str):
#         """
#         Initialize vector store manager for a specific video.
        
#         Args:
#             video_id: YouTube video ID
#         """
#         self.video_id = video_id
#         self.collection_name = f"{config.CHROMA_COLLECTION_NAME}_{video_id}"
#         self.persist_directory = config.CHROMA_PERSIST_DIRECTORY
        
#         # Initialize embeddings
#         self.embeddings = HuggingFaceEmbeddings(
#             model_name=config.HUGGINGFACE_EMBEDDING_MODEL,
#             encode_kwargs={"normalize_embeddings": True}
#         )
        
#         # Initialize text splitter
#         self.text_splitter = RecursiveCharacterTextSplitter(
#             chunk_size=config.CHUNK_SIZE,
#             chunk_overlap=config.CHUNK_OVERLAP
#         )
        
#         # Initialize ChromaDB client
#         self.client = chromadb.PersistentClient(
#             path=self.persist_directory,
#             settings=Settings(anonymized_telemetry=False)
#         )
        
#         self.vector_store = None
    
#     def create_vector_store(self, transcript_text: str) -> Chroma:
#         """
#         Create vector store from transcript text.
        
#         Args:
#             transcript_text: Full transcript text
            
#         Returns:
#             Chroma vector store instance
#         """
#         # Split transcript into chunks
#         documents = self.text_splitter.create_documents([transcript_text])
        
#         # Add metadata to documents
#         for i, doc in enumerate(documents):
#             doc.metadata = {
#                 'video_id': self.video_id,
#                 'chunk_index': i,
#                 'source': 'youtube_transcript'
#             }
        
#         # Create or get collection
#         try:
#             # Try to get existing collection
#             collection = self.client.get_collection(name=self.collection_name)
#             # If exists, delete it to recreate with new data
#             self.client.delete_collection(name=self.collection_name)
#         except:
#             pass
        
#         # Create vector store
#         self.vector_store = Chroma.from_documents(
#             documents=documents,
#             embedding=self.embeddings,
#             collection_name=self.collection_name,
#             persist_directory=self.persist_directory,
#             client=self.client
#         )
        
#         return self.vector_store
    
#     def load_vector_store(self) -> Optional[Chroma]:
#         """
#         Load existing vector store if it exists.
        
#         Returns:
#             Chroma vector store instance or None if not found
#         """
#         try:
#             # Check if collection exists
#             collection = self.client.get_collection(name=self.collection_name)
            
#             # Load vector store
#             self.vector_store = Chroma(
#                 collection_name=self.collection_name,
#                 embedding_function=self.embeddings,
#                 persist_directory=self.persist_directory,
#                 client=self.client
#             )
            
#             return self.vector_store
#         except:
#             return None
    
#     def get_retriever(
#         self,
#         k: int = None,
#         search_type: str = "similarity",
#         search_kwargs: Optional[dict] = None,
#     ):
#         """
#         Get retriever from vector store.
        
#         Args:
#             k: Number of documents to retrieve (default from config)
#             search_type: Retrieval strategy ('similarity' or 'mmr')
#             search_kwargs: Additional search kwargs for the retriever
            
#         Returns:
#             Retriever instance
#         """
#         if self.vector_store is None:
#             raise ValueError("Vector store not initialized. Create or load it first.")

#         if k is None:
#             k = config.RETRIEVAL_K

#         # Default search kwargs
#         if search_kwargs is None:
#             if search_type == "mmr":
#                 # fetch_k should be >= k for MMR; use a simple multiple
#                 search_kwargs = {"k": k, "fetch_k": max(k * 4, k)}
#             else:
#                 search_kwargs = {"k": k}

#         return self.vector_store.as_retriever(
#             search_type=search_type,
#             search_kwargs=search_kwargs,
#         )
    
#     def delete_vector_store(self):
#         """Delete the vector store for this video."""
#         try:
#             self.client.delete_collection(name=self.collection_name)
#             self.vector_store = None
#         except:
#             pass
