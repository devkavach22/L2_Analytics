import os
from typing import Dict
from app.folder_analyzer.metadata_store import (
    load_files_by_folder,
    load_ocr_records,
    upsert_ocr_record
)
from app.folder_analyzer.tree_graph import build_folder_tree
from app.folder_analyzer.semantic_graph import build_semantic_graph
from app.folder_analyzer.analysis_engine import *
from app.folder_analyzer.trend_analyzer import analyze_trends
from app.folder_analyzer.entity_aggregator import aggregate_entities_and_keywords
from app.folder_analyzer.nlp_engine import extract_entities_and_keywords, clean_text
# from app.folder_analyzer.analysis_engine import (
#     analyze_structure,
#     analyze_timeline,
#     analyze_folder_health,
#     analyze_content_profile
# )
# from app.generators.chart_generator import generate_chart
from app.folder_analyzer.content_indexer import index_file_content
from app.agents.folder_analysis_llm import FolderAnalysisAgent
from app.ocr_utils import extract_text_from_file


def run_folder_analysis(folder_id: str, user_id: str, folder_path: str) -> Dict:

    # STEP 1: Load files
    files = load_files_by_folder(folder_id, user_id)

    if not files:
        return { "total_files": 0, "error": "No files found"}

    # STEP 2: Load OCR cache
    ocr_map = load_ocr_records(folder_id, user_id)

    for f in files:
        file_path = os.path.normpath(f["file_path"])
        file_name = f.get("file_name") or os.path.basename(file_path)

        ocr = ocr_map.get(file_path, {})

        if ocr:
            f.update(ocr)
        else:
            try:
                with open(path, "rb") as file:
                    text = extract_text_from_file(file.read(), name)

                if text.strip():
                    upsert_ocr_record(
                        file_path=path,
                        file_name=name,
                        folder_id=folder_id,
                        user_id=user_id,
                        extracted_text=text,
                        confidence=1.0
                    )
                    f["ocr_text"] = text
                else:
                    f["ocr_text"] = ""
            except:
                f["ocr_text"] = ""

        index_file_content(f)

        # f["ocr_text"] = ocr.get("ocr_text", "")
        # f["ocr_entities"] = ocr.get("ocr_entities", [])
        # f["ocr_confidence"] = ocr.get("ocr_confidence", 0)

        # 🔥 HARD FIX: OCR fallback + persistence
        # if not f["ocr_text"].strip():
        #     try:
        #         with open(file_path, "rb") as file:
        #             extracted_text = extract_text_from_file(
        #                 file.read(),
        #                 file_name
        #             )

        #         if extracted_text.strip():
        #             f["ocr_text"] = extracted_text

        #             # Persist OCR so it never runs again
        #             upsert_ocr_record(
        #                 file_path=file_path,
        #                 file_name=file_name,
        #                 folder_id=folder_id,
        #                 user_id=user_id,
        #                 extracted_text=extracted_text,
        #                 confidence=1.0,
        #                 entities=[]
        #             )
        #         else:
        #             f["ocr_text"] = ""

        #     except Exception as e:
        #         print(f"❌ OCR failed for {file_name}: {e}")
        #         f["ocr_text"] = ""

    # STEP 3: NLP
    for f in files:
        text = f.get("ocr_text", "")
        if text.strip():
            nlp = extract_entities_and_keywords(clean_text(text))
            f["nlp_entities"] = nlp["entities"]
            f["nlp_keywords"] = nlp["keywords"]
        else:
            f["nlp_entities"] = []
            f["nlp_keywords"] = []
        # if not text.strip():
        #     f["nlp_entities"] = []
        #     f["nlp_keywords"] = []
        #     continue

        # result = extract_entities_and_keywords(clean_text(text))
        # f["nlp_entities"] = result["entities"]
        # f["nlp_keywords"] = result["keywords"]

    # STEP 4: Analysis
    structure = analyze_structure(files)
    timeline = analyze_timeline(files)
    health = analyze_folder_health(files)
    content_profile = analyze_content_profile(files)

    # STEP 5: Aggregation
    summary = aggregate_entities_and_keywords(files)
    trends = analyze_trends(files)

    # STEP 6: Graphs
    folder_tree = build_folder_tree(files)
    semantic_graph = build_semantic_graph(files)

    # ---- GROUNDED LLM ----
    evidence = "\n".join(
        f["ocr_text"][:2000]
        for f in files if f.get("ocr_text")
    )

    # STEP 7: LLM
    llm = FolderAnalysisAgent(context=evidence)
    llm_insights = {
        "summary": llm.analyze("Provide a high-level summary of this folder"),
        "risks": llm.analyze("Identify risks or sensitive content"),
        "themes": llm.analyze("Identify dominant themes")
    }

    # # STEP 8: Charts
    # charts = {
    #     "file_types": generate_chart(structure["file_types"]),
    #     "content_profile": generate_chart(content_profile),
    #     "monthly_activity": generate_chart(timeline["monthly_activity"]),
    #     "entity_distribution": generate_chart(summary["entities"])
    # }

    return {
        "structure": structure,
        "timeline": timeline,
        "health": health,
        "content_profile": content_profile,
        "entities": summary["entities"],
        "keywords": summary["keywords"],
        "trends": trends,
        "folder_tree": folder_tree,
        "semantic_graph": semantic_graph,
        # "charts": charts,
        "llm_insights": llm_insights,
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
