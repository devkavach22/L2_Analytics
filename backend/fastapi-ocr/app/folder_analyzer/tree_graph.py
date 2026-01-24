import os
from collections import Counter
from typing import Any, List, Tuple
from app.folder_analyzer.graph_builder import FolderGraph


def top_k(counter_data: Any, k: int = 5) -> List[Tuple[str, int]]:
    """
    Always returns: List[(str, int)]
    Handles Counter, dict, list[(key,count)], list[str]
    """

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
                k, v = item
                counter[str(k)] += int(v)
            elif isinstance(item, str):
                counter[item] += 1

    return counter.most_common(k)


def _labels(top_items: List[Tuple[str, int]]) -> List[str]:
    return [str(k) for k, _ in top_items]


# 🔥 NEW — SAFE NORMALIZATION
def normalize_terms(items):
    """
    Converts NLP entities/keywords into plain string list.
    Handles:
    - "Delhi"
    - {"text": "Delhi", "label": "GPE"}
    - {"word": "Police"}
    - ("Delhi", 3)
    """
    results = []

    for item in items or []:
        if isinstance(item, str):
            results.append(item)

        elif isinstance(item, dict):
            results.append(
                item.get("text")
                or item.get("word")
                or item.get("label")
                or ""
            )

        elif isinstance(item, (list, tuple)) and len(item) > 0:
            results.append(str(item[0]))

    return [r for r in results if r]


def build_folder_tree(files):
    graph = FolderGraph()

    folder_entities = Counter()
    folder_keywords = Counter()
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

        # ✅ FIX — NORMALIZE BEFORE COUNTER
        entity_texts = normalize_terms(f.get("nlp_entities"))
        keyword_texts = normalize_terms(f.get("nlp_keywords"))

        file_entities = Counter(entity_texts)
        file_keywords = Counter(keyword_texts)

        folder_entities.update(file_entities)
        folder_keywords.update(file_keywords)

        graph.add_file(
            file_path=file_path,
            extension=f.get("extension", "unknown"),
            metadata={
                "mongo_id": str(f.get("_id")),
                "size_kb": size_kb,
                "ocr_confidence": f.get("ocr_confidence", 0),
                "top_entities": top_k(file_entities),
                "top_keywords": top_k(file_keywords),
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
            }
        })

    return graph.export()
