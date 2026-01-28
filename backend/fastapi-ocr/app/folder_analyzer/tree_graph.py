import os
from collections import Counter, defaultdict
from typing import Any, List, Tuple
from app.folder_analyzer.graph_builder import FolderGraph

def top_k(counter_data: Any, k: int = 5) -> List[Tuple[str, int]]:
    """Returns top-k items from Counter/dict/list"""
    if not counter_data:
        return []

    counter = Counter()
    if isinstance(counter_data, Counter):
        counter = counter_data
    elif isinstance(counter_data, dict):
        counter = Counter({str(k): int(v) for k, v in counter_data.items()})
    elif isinstance(counter_data, list):
        for item in counter_data:
            if isinstance(item, (list, tuple)) and len(item) == 2:
                counter[str(item[0])] += int(item[1])
            elif isinstance(item, str):
                counter[item] += 1
    return counter.most_common(k)

def _labels(top_items: List[Tuple[str, int]]) -> List[str]:
    return [str(k) for k, _ in top_items]

# -------------------------------
# BUILD FOLDER TREE
# -------------------------------
def build_folder_tree(files):
    graph = FolderGraph()

    folder_entities = Counter()
    folder_keywords = Counter()
    entity_details = defaultdict(dict)  # text -> {type, description, documents}
    total_size_kb = 0
    folder_path = None

    for f in files:
        file_path = f.get("file_path")
        if not file_path:
            continue

        folder_path = os.path.dirname(file_path)
        graph.add_folder(folder_path)

        size_kb = float(f.get("size_kb") or 0)
        total_size_kb += size_kb

        # -------------------------------
        # Process entities
        # -------------------------------
        for e in f.get("nlp_entities", []):
            text = e.get("text")
            label = e.get("label")
            description = e.get("description", "")
            if not text:
                continue

            # Add to global folder counter
            folder_entities[text] += 1

            # Save full entity info
            if text not in entity_details:
                entity_details[text] = {
                    "type": label or "OTHER",
                    "description": description,
                    "documents": []
                }
            if f.get("file_name") not in entity_details[text]["documents"]:
                entity_details[text]["documents"].append(f.get("file_name"))

        # -------------------------------
        # Process keywords
        # -------------------------------
        for kw in f.get("nlp_keywords", []):
            folder_keywords[kw] += 1

        # -------------------------------
        # Add file node
        # -------------------------------
        graph.add_file(
            file_path=file_path,
            extension=f.get("extension", "unknown"),
            metadata={
                "mongo_id": str(f.get("_id")),
                "size_kb": size_kb,
                "ocr_confidence": f.get("ocr_confidence", 0),
                "top_entities": top_k(folder_entities),
                "top_keywords": top_k(folder_keywords),
            }
        )

        graph.link_parent_child(folder_path, file_path)

    # ---------- FOLDER SUMMARY ----------
    if folder_path:
        top_entities = top_k(folder_entities)
        top_keywords = top_k(folder_keywords)

        auto_summary = (
            f"{len(files)} files detected. "
            f"Dominant entities: {', '.join(_labels(top_entities)) or 'None'}. "
            f"Key themes include: {', '.join(_labels(top_keywords)) or 'None'}."
        )

        graph.add_folder_metadata(folder_path, {
            "auto_summary": auto_summary,
            "stats": {
                "file_count": len(files),
                "total_size_kb": round(total_size_kb, 2),
                "top_entities": top_entities,
                "top_keywords": top_keywords,
                "entity_details": entity_details  # Full info
            }
        })

    return graph.export()
