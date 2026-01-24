from typing import Dict, List


def score_files(files: List[Dict], semantic_graph: Dict) -> List[Dict]:
    """
    Assigns relevance scores to files based on:
    - Graph connectivity
    - Entity density
    - Content volume
    """

    edge_map = {}
    for edge in semantic_graph.get("edges", []):
        edge_map.setdefault(edge["source"], 0)
        edge_map.setdefault(edge["target"], 0)
        edge_map[edge["source"]] += edge["weight"]
        edge_map[edge["target"]] += edge["weight"]

    scored_files = []

    for f in files:
        score = 0.0

        score += edge_map.get(f["file_id"], 0)
        score += len(f.get("nlp_entities", [])) * 0.2
        score += len(f.get("nlp_keywords", [])) * 0.1

        scored_files.append({
            "file_id": f["file_id"],
            "file_name": f.get("file_name"),
            "score": round(score, 2)
        })

    return sorted(scored_files, key=lambda x: x["score"], reverse=True)
