from typing import Dict, List
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


SIMILARITY_THRESHOLD = 0.65


def build_semantic_graph(files: List[Dict]) -> Dict:
    """
    Builds a weighted semantic graph between files.
    Safe, explainable, UI-ready.
    """

    nodes = []
    edges = []

    valid_files = [
        f for f in files
        if isinstance(f.get("embedding"), list)
        and all(isinstance(x, (int, float)) for x in f["embedding"])
    ]

    if len(valid_files) < 2:
        return {"nodes": [], "edges": []}

    embeddings = np.array([f["embedding"] for f in valid_files])
    if not embeddings.size:
        return {"nodes": [], "edges": []}

    similarity_matrix = cosine_similarity(embeddings)

    # ---------- Nodes ----------
    for idx, f in enumerate(valid_files):
        nodes.append({
            "id": f["file_id"],
            "label": f.get("file_name", "unknown"),
            "entity_count": len(f.get("nlp_entities", [])),
            "keyword_count": len(f.get("nlp_keywords", [])),
            "content_length": len(f.get("ocr_text", "")),
        })

    # ---------- Edges ----------
    for i in range(len(valid_files)):
        for j in range(i + 1, len(valid_files)):
            score = similarity_matrix[i][j]

            if score >= SIMILARITY_THRESHOLD:
                edges.append({
                    "source": valid_files[i]["file_id"],
                    "target": valid_files[j]["file_id"],
                    "weight": round(float(score), 3),
                    "relationship": "semantic_similarity"
                })

    return {
        "nodes": nodes,
        "edges": edges
    }
