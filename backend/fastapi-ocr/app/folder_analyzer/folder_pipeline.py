import os
from typing import Dict, List

from app.folder_analyzer.metadata_store import load_files_with_ocr, upsert_ocr_record
from app.folder_analyzer.tree_graph import build_folder_tree
from app.folder_analyzer.semantic_graph import build_semantic_graph
from app.folder_analyzer.file_scoring import score_files
from app.folder_analyzer.charts_builder import build_charts

from app.folder_analyzer.analysis_engine import (
    analyze_structure,
    analyze_timeline,
    analyze_folder_health,
    analyze_content_profile
)

from app.folder_analyzer.trend_analyzer import analyze_trends
from app.folder_analyzer.embedding_engine import embed_text
from app.folder_analyzer.content_indexer import index_folder_to_vector_store
from app.agents.folder_analysis_llm import FolderAnalysisAgent
from app.ocr_utils import extract_text_from_file

# 🔥 ENTITY ENGINE
from app.folder_analyzer.entity_engine import (
    extract_entities,
    extract_keywords,
    build_entity_table,
    build_relationship_graph
)


# -------------------------------------------------
# VECTOR CONTEXT BUILDER (PRESERVED)
# -------------------------------------------------
def build_folder_context(files: List[Dict]) -> str:
    sections = []
    for f in files:
        text = f.get("ocr_text", "").strip()
        if not text:
            continue

        sections.append(
            f"FILE: {f.get('file_name')}\n"
            f"SIZE_KB: {f.get('size_kb')}\n"
            f"CONTENT:\n{text[:2000]}"
        )

    return "\n\n---\n\n".join(sections)


# -------------------------------------------------
# MAIN FOLDER ANALYSIS PIPELINE
# -------------------------------------------------
def run_folder_analysis(folder_id: str, user_id: str, folder_path: str) -> Dict:
    files: List[Dict] = load_files_with_ocr(folder_id, user_id)

    if not files:
        return {"total_files": 0, "error": "No files found"}

    # -------------------------------------------------
    # OCR + NLP EXTRACTION
    # -------------------------------------------------
    for f in files:
        file_path = f.get("file_path")
        file_name = f.get("file_name") or "unknown"

        # OCR fallback (PRESERVED)
        if not f.get("ocr_text") and file_path and os.path.exists(file_path):
            try:
                with open(file_path, "rb") as fp:
                    text = extract_text_from_file(fp.read(), file_name)

                f["ocr_text"] = text.strip()

                upsert_ocr_record(
                    file_id=f["file_id"],
                    file_name=file_name,
                    folder_id=folder_id,
                    user_id=user_id,
                    extracted_text=f["ocr_text"],
                    confidence=1.0,
                    entities=[]
                )

            except Exception:
                f["ocr_text"] = ""

        text = f.get("ocr_text", "").strip()

        # 🔥 ENTITY + KEYWORD EXTRACTION
        entities = extract_entities(text) if text else []
        keywords = extract_keywords(text) if text else []

        f["nlp_entities"] = entities
        f["nlp_keywords"] = keywords

        # 🔥 ENTITY TABLE (TOP 5)
        f["entity_table"] = build_entity_table(entities)

        # 🔥 EMBEDDINGS
        f["embedding"] = embed_text(text) if len(text) > 20 else None

        # 🔥 NEW: BASIC FILE DETAILS (CLICK POPUP READY)
        f["file_details"] = {
            "file_id": f.get("file_id"),
            "file_name": file_name,
            "size_kb": f.get("size_kb"),
            "content_length": len(text),
            "entity_count": len(entities),
            "keyword_count": len(keywords),
            "entities": entities[:10],
            "keywords": keywords[:10]
        }

    # -------------------------------------------------
    # VECTOR STORE INDEXING
    # -------------------------------------------------
    folder_context = build_folder_context(files)
    index_folder_to_vector_store(folder_id, user_id, context=folder_context)

    # -------------------------------------------------
    # ENTITY GRAPH + RELATIONSHIPS
    # -------------------------------------------------
    relationship_graph = build_relationship_graph(files)

    file_entities_output = {
        f["file_name"]: f.get("entity_table", [])[:5]
        for f in files
    }

    # 🔥 NEW: FILE DETAIL MAP (FOR GRAPH CLICKS)
    file_details_map = {
        f["file_id"]: f.get("file_details", {})
        for f in files
    }

    # -------------------------------------------------
    # NON-LLM ANALYSIS
    # -------------------------------------------------
    structure = analyze_structure(files)
    timeline = analyze_timeline(files)
    health = analyze_folder_health(files)
    content_profile = analyze_content_profile(files)
    trends = analyze_trends(files)

    folder_tree = build_folder_tree(files)
    semantic_graph = build_semantic_graph(files)
    file_scores = score_files(files, semantic_graph)
    charts = build_charts(files)

    # -------------------------------------------------
    # LLM INTELLIGENCE
    # -------------------------------------------------
    llm = FolderAnalysisAgent()
    llm_result = llm.analyze(folder_id=folder_id)

    llm_insights = {
        "summary_text": llm_result.get("summary", ""),
        "entity_graph": llm_result.get("entity_graph", {})
    }

    # -------------------------------------------------
    # FINAL RESPONSE (STRUCTURED + UI READY)
    # -------------------------------------------------
    return {
        "auto_summary": llm_insights["summary_text"],

        # 🔥 CORE ANALYTICS
        "structure": structure,
        "timeline": timeline,
        "health": health,
        "content_profile": content_profile,
        "trends": trends,

        # 🔥 ENTITY INTELLIGENCE
        "file_entities": file_entities_output,
        "file_details": file_details_map,
        "relationships": relationship_graph,

        # 🔥 VISUALIZATION
        "folder_tree": folder_tree,
        "semantic_graph": semantic_graph,
        "llm_entity_graph": llm_insights["entity_graph"],
        "file_scores": file_scores,
        "charts": charts,

        "total_files": len(files)
    }




# import os
# import asyncio

# from app.folder_analyzer.folder_scanner import scan_folder
# from app.folder_analyzer.metadata_store import load_ocr_records
# from app.folder_analyzer.tree_graph import build_folder_tree
# from app.folder_analyzer.semantic_graph import build_semantic_graph
# from app.folder_analyzer.trend_analyzer import analyze_trends
# from app.folder_analyzer.entity_aggregator import aggregate_entities_and_keywords
# from app.folder_analyzer.nlp_engine import extract_entities_and_keywords, clean_text
# from app.folder_analyzer.analysis_engine import (
#     analyze_structure,
#     analyze_timeline,
#     analyze_folder_health,
#     analyze_content_profile
# )
# from app.generators.chart_generator import generate_chart
# from app.agents.folder_analysis_llm import FolderAnalysisAgent
# from typing import Dict
# from app.folder_analyzer.metadata_store import load_files_by_folder


# def run_folder_analysis(folder_id: str, user_id: str, folder_path: str) -> Dict:

#     # STEP 1: Scan filesystem
#     files = load_files_by_folder(folder_id, user_id)

#     # STEP 2: Load OCR records
#     ocr_map = load_ocr_records(folder_id, user_id)

#     for f in files:
#         path = os.path.normpath(f["file_path"])
#         ocr = ocr_map.get(path, {})

#         f["ocr_text"] = ocr.get("ocr_text", "")
#         f["ocr_entities"] = ocr.get("ocr_entities", [])
#         f["ocr_confidence"] = ocr.get("ocr_confidence", 0)

#         if not f["ocr_text"].strip():
#             try:
#                 with open(f["file_path"], "rb") as file:
#                     f["ocr_text"] = extract_text_from_file(file.read(), f["file_name"])
#                     if not f["ocr_text"].strip():
#                         print(f"⚠️ OCR empty for {f['file_name']}")
#             except Exception as e:
#                 print(f"❌ OCR extraction failed for {f['file_name']}: {e}")
#                 f["ocr_text"] = ""

#     # STEP 3: NLP (entities + keywords)
#     for f in files:
#         text = f.get("ocr_text", "")
#         if not text.strip():
#             f["nlp_entities"] = []
#             f["nlp_keywords"] = []
#             continue

#         result = extract_entities_and_keywords(clean_text(text))
#         f["nlp_entities"] = result["entities"]
#         f["nlp_keywords"] = result["keywords"]

#     # STEP 4: Structural Analysis
#     structure = analyze_structure(files)
#     timeline = analyze_timeline(files)
#     health = analyze_folder_health(files)
#     content_profile = analyze_content_profile(files)

#     # STEP 5: Semantic Aggregation
#     nlp_summary = aggregate_entities_and_keywords(files)
#     entities = nlp_summary["entities"]
#     keywords = nlp_summary["keywords"]
#     trends = analyze_trends(files)

#     # STEP 6: Graphs
#     folder_tree = build_folder_tree(files)
#     semantic_graph = build_semantic_graph(files)

#     llm_agent = FolderAnalysisAgent()
#     llm_insights = {
#         "summary": llm_agent.analyze(
#             "Provide a high-level summary of this folder"
#         ),
#         "risks": llm_agent.analyze(
#             "Identify risks, sensitive content, or compliance issues"
#         ),
#         "themes": llm_agent.analyze(
#             "What are the dominant themes across these files?"
#         )
#     }

#     # STEP 7: Charts
#     charts = {
#         "file_types": generate_chart(structure["file_types"]),
#         "content_profile": generate_chart(content_profile),
#         "monthly_activity": generate_chart(timeline["monthly_activity"]),
#         "entity_distribution": generate_chart(entities)
#     }

#     return {
#         "structure": structure,
#         "timeline": timeline,
#         "health": health,
#         "content_profile": content_profile,
#         "entities": entities,
#         "keywords": keywords,
#         "trends": trends,
#         "folder_tree": folder_tree,
#         "semantic_graph": semantic_graph,
#         "charts": charts,
#         "total_files": len(files)
#     }

# from app.folder_analyzer.folder_scanner import scan_folder
# from app.folder_analyzer.content_indexer import index_file_content
# from app.folder_analyzer.metadata_store import (
#     save_file_metadata,
#     load_ocr_records
# )
# from app.folder_analyzer.analysis_engine import (
#     analyze_structure,
#     analyze_timeline,
#     analyze_folder_health,
#     analyze_content_profile,
#     analyze_entities
# )
# from app.folder_analyzer.semantic_graph import build_semantic_graph
# from app.folder_analyzer.tree_graph import build_folder_tree
# from app.folder_analyzer.trend_analyzer import analyze_trends
# from app.generators.chart_generator import generate_chart


# def run_folder_analysis(folder_path: str):

#     # ---------------- Scan ----------------
#     files = scan_folder(folder_path)

#     # ---------------- Load OCR ----------------
#     ocr_map = load_ocr_records()

#     for f in files:
#         ocr = ocr_map.get(f["file_path"])
#         if ocr:
#             f.update(ocr)

#     save_file_metadata(files)

#     # ---------------- Indexing ----------------
#     indexed = 0
#     errors = []

#     for f in files:
#         try:
#             if index_file_content(f):
#                 indexed += 1
#         except Exception as e:
#             errors.append({"file": f["file_path"], "error": str(e)})

#     # ---------------- Analysis ----------------
#     structure = analyze_structure(files)
#     timeline = analyze_timeline(files)
#     health = analyze_folder_health(files)
#     content_profile = analyze_content_profile(files)
#     entities = analyze_entities(files)
#     trends = analyze_trends(files)

#     semantic_graph = build_semantic_graph(files)
#     folder_tree = build_folder_tree(files)

#     # ---------------- Charts ----------------
#     charts = {
#         "file_types": generate_chart(structure["file_types"]),
#         "content_profile": generate_chart(content_profile),
#         "monthly_activity": generate_chart(timeline["monthly_activity"]),
#         "entity_distribution": generate_chart(entities)
#     }

#     return {
#         "structure": structure,
#         "timeline": timeline,
#         "health": health,
#         "content_profile": content_profile,
#         "entities": entities,
#         "trends": trends,
#         "folder_tree": folder_tree,
#         "semantic_graph": semantic_graph,
#         "charts": charts,
#         "indexed_count": indexed,
#         "total_files": len(files),
#         "indexing_errors": errors
#     }
