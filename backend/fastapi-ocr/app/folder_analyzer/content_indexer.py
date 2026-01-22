import os
from typing import List, Optional
from langchain_core.documents import Document

from src.vector_store import VectorStoreManager
# from app.ocr_utils import extract_text_from_file

VECTOR_NAMESPACE = "folder-analysis"


# ---------------------------------------------------
# FILE INDEXING (OCR + INTERNAL OCR DATA)
# ---------------------------------------------------

def index_file_content(file_record: dict) -> Optional[dict]:
    text = file_record.get("ocr_text", "").strip()
    if len(text) < 30:
        return None

    manager = VectorStoreManager(VECTOR_NAMESPACE)
    store = manager.get_or_create_store()

    doc = Document(
        page_content=text,
        metadata={
            "file_path": file_record["file_path"],
            "file_name": file_record.get("file_name"),
            "extension": file_record.get("extension")
        }
    )

    store.add_documents([doc])
    store.persist()

    return {"file_path": file_record["file_path"], "indexed": True}

# ---------------------------------------------------
# SEMANTIC SEARCH (FAST + SMART QUERY)
# ---------------------------------------------------

def find_similar_files(file_path: str, top_k: int = 3) -> List[dict]:
    manager = VectorStoreManager(VECTOR_NAMESPACE)
    store = manager.get_or_create_store()

    query = os.path.splitext(os.path.basename(file_path))[0].replace("_", " ")

    results = store.similarity_search_with_relevance_scores(query, k=top_k + 1)

    matches = []
    for doc, score in results:
        target = doc.metadata.get("file_path")
        if target and target != file_path:
            matches.append({"id": target, "score": round(score, 3)})

    return matches[:top_k]
