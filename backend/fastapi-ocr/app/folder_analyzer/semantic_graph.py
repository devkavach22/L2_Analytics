from typing import Dict, List
import numpy as np
import re
from sklearn.metrics.pairwise import cosine_similarity

SIMILARITY_THRESHOLD = 0.65


# --------------------------------------------------
# BASIC ENTITY EXTRACTORS (SAFE + FAST)
def extract_people(text: str) -> List[str]:
    return list(set(re.findall(r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b', text)))


def extract_cases(text: str) -> List[str]:
    return list(set(re.findall(r'FIR\s*\d+/?\d*|IPC\s*\d+', text)))


def extract_locations(text: str) -> List[str]:
    return list(set(re.findall(
        r'(Tihar Jail|Mandoli Jail|Delhi|Haryana|Rohini|Court|High Court)',
        text
    )))


def extract_dates(text: str) -> List[str]:
    return list(set(re.findall(r'\b\d{1,2}/\d{1,2}/\d{4}\b', text)))


# --------------------------------------------------
def build_semantic_graph(files: List[Dict]) -> Dict:
    """
    Builds a weighted semantic graph between files.
    NotebookLM-style: every node carries explainable details.
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
        text = f.get("ocr_text", "") or ""

        people = extract_people(text)
        cases = extract_cases(text)
        locations = extract_locations(text)
        dates = extract_dates(text)

        nodes.append({
            "id": f["file_id"],
            "label": f.get("file_name", "unknown"),
            "type": "file",

            # --- metrics (graph sizing, color, etc.)
            "metrics": {
                "entity_count": len(people),
                "keyword_count": len(f.get("nlp_keywords", [])),
                "content_length": len(text),
            },

            # --- 🔥 CLICKABLE DETAILS (POPUP PAYLOAD)
            "details": {
                "people": people,
                "cases": cases,
                "locations": locations,
                "dates": dates,
                "summary": (
                    f.get("short_summary")
                    or f.get("auto_summary")
                    or text[:400]
                )
            }
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
