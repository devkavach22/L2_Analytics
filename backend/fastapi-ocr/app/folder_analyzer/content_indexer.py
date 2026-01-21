import os
from typing import List
from langchain_core.documents import Document

from src.vector_store import VectorStoreManager
from app.ocr_utils import extract_text_from_file

VECTOR_NAMESPACE = "folder-analysis"


# ---------------------------------------------------
# FILE INDEXING (NO DB, NO MONGODB)
# ---------------------------------------------------

def index_file_content(file_record: dict):
    """
    Index file content safely.
    Uses OCR only.
    No MongoDB.
    """
    try:
        file_path = file_record.get("file_path")
        if not file_path or not os.path.exists(file_path):
            return None

        filename = file_record.get("file_name") or os.path.basename(file_path)

        # ---- Read file
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        # ---- OCR extraction
        text = extract_text_from_file(file_bytes, filename)

        # ---- HARD SAFETY
        if not text or len(text.strip()) < 30:
            print(f"⚠️ Skipped empty OCR: {file_path}")
            return None

        # ---- Global vector store
        manager = VectorStoreManager(VECTOR_NAMESPACE)
        store = manager.get_or_create_store()

        doc = Document(
            page_content=text.strip(),
            metadata={
                "file_path": file_path,
                "file_name": filename,
                "source": "folder_analysis"
            }
        )

        store.add_documents([doc])
        store.persist()

        return {
            "file_path": file_path,
            "status": "indexed",
            "content_length": len(text)
        }

    except Exception as e:
        print(f"❌ Indexing failed for {file_record.get('file_path')}: {e}")
        return None


# ---------------------------------------------------
# SEMANTIC SEARCH (FAST)
# ---------------------------------------------------

def find_similar_files(file_path: str, top_k: int = 3) -> List[dict]:
    """
    Uses filename-based query for speed.
    """
    try:
        manager = VectorStoreManager(VECTOR_NAMESPACE)
        store = manager.get_or_create_store()

        query = os.path.splitext(os.path.basename(file_path))[0]

        results = store.similarity_search_with_relevance_scores(
            query=query,
            k=top_k
        )

        matches = []

        for doc, score in results:
            target = doc.metadata.get("file_path")
            if not target or target == file_path:
                continue

            matches.append({
                "id": target,
                "score": round(float(score), 3)
            })

        return matches

    except Exception as e:
        print(f"❌ Similarity search failed for {file_path}: {e}")
        return []
