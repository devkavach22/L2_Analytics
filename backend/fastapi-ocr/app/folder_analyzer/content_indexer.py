import os
from langchain_core.documents import Document

from app.folder_analyzer.data_cleaner import clean_ocr_text, is_valid_ocr
from app.folder_analyzer.embedding_engine import embed_text
from src.vector_store import VectorStoreManager
from app.folder_analyzer.metadata_store import load_files_with_ocr


def index_folder_to_vector_store(folder_id: str, user_id: str, context: str):
    db_name = os.getenv("MONGO_DB_NAME", "authDB")
    store = VectorStoreManager(db_name).get_or_create_store()

    from app.folder_analyzer.metadata_store import load_files_with_ocr
    files = load_files_with_ocr(folder_id, user_id)

    documents = []
    embeddings = []

    for f in files:
        raw_text = f.get("ocr_text", "")
        if not isinstance(raw_text, str):
            continue

        text = clean_ocr_text(raw_text)
        if not is_valid_ocr(text):
            continue

        embedding = embed_text(text)
        if not embedding:
            continue

        documents.append(
            Document(
                page_content=text,
                metadata={
                    "file_id": str(f.get("file_id")),
                    "file_name": f.get("file_name"),
                    "folder_id": folder_id,
                    "user_id": user_id,
                }
            )
        )
        embeddings.append(embedding)

    if documents:
        store.add_documents(documents, embeddings=embeddings)


# def index_file_content(file_record: dict) -> Optional[dict]:
#     text = file_record.get("ocr_text", "").strip()
#     if len(text) < 30:
#         return None

#     manager = VectorStoreManager(VECTOR_NAMESPACE)
#     store = manager.get_or_create_store()

#     doc = Document(
#         page_content=text,
#         metadata={
#             "file_path": file_record["file_path"],
#             "file_name": file_record.get("file_name"),
#             "extension": file_record.get("extension")
#         }
#     )

#     store.add_documents([doc])
#     store.persist()

#     return {"file_path": file_record["file_path"], "indexed": True}

# # ---------------------------------------------------
# # SEMANTIC SEARCH (FAST + SMART QUERY)
# # ---------------------------------------------------

# def find_similar_files(file_path: str, top_k: int = 3) -> List[dict]:
#     manager = VectorStoreManager(VECTOR_NAMESPACE)
#     store = manager.get_or_create_store()

#     query = os.path.splitext(os.path.basename(file_path))[0].replace("_", " ")

#     results = store.similarity_search_with_relevance_scores(query, k=top_k + 1)

#     matches = []
#     for doc, score in results:
#         target = doc.metadata.get("file_path")
#         if target and target != file_path:
#             matches.append({"id": target, "score": round(score, 3)})

#     return matches[:top_k]
