import os
from typing import List
from sentence_transformers import SentenceTransformer

_MODEL = None


def get_embedding_model() -> SentenceTransformer:
    global _MODEL
    if _MODEL is None:
        model_name = os.getenv(
            "EMBEDDING_MODEL",
            "sentence-transformers/all-MiniLM-L6-v2"
        )
        _MODEL = SentenceTransformer(model_name)
    return _MODEL


def embed_text(text: str) -> List[float]:
    if not isinstance(text, str):
        raise ValueError("Embedding input must be string")

    text = text.strip()
    if len(text) < 20:
        return []

    model = get_embedding_model()
    embedding = model.encode(
        text,
        normalize_embeddings=True
    )

    return embedding.tolist()
