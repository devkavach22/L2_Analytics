# app/folder_analyzer/folder_pipeline.py
from app.folder_analyzer.folder_scanner import scan_folder
from app.folder_analyzer.content_indexer import index_file_content, find_similar_files
from app.folder_analyzer.metadata_store import save_file_metadata, get_analysis_job
from app.folder_analyzer.analysis_engine import (
    analyze_structure,
    analyze_timeline,
    analyze_folder_health,
    analyze_content_profile
)
from app.folder_analyzer.tree_graph import build_folder_tree
from app.folder_analyzer.graph_builder import FolderGraph
from app.generators.chart_generator import generate_chart


def run_folder_analysis(folder_path: str):

    # ---------------- Scan ----------------
    files = scan_folder(folder_path)
    save_file_metadata(files)

    # ---------------- Indexing ----------------
    indexed_files = set()
    indexing_errors = []

    for f in files:
        try:
            result = index_file_content(f)
            if result:
                indexed_files.add(f["file_path"])
        except Exception as e:
            indexing_errors.append({
                "file": f.get("file_path"),
                "error": str(e)
            })

    # ---------------- Intelligence ----------------
    structure = analyze_structure(files)
    timeline = analyze_timeline(files)
    health = analyze_folder_health(files)
    content_profile = analyze_content_profile(files)

    # ---------------- Semantic Graph (FAST DEMO MODE) ----------------
    semantic_graph_builder = FolderGraph()

    MAX_FILES = 5  # 🚀 demo speed
    files_subset = files[:MAX_FILES]

    for f in files_subset:
        semantic_graph_builder.add_file(
            f["file_path"],
            f.get("extension", "unknown")
        )

    for f in files_subset:
        if f["file_path"] not in indexed_files:
            continue

        matches = find_similar_files(f["file_path"], top_k=2)

        for m in matches:
            semantic_graph_builder.link_similar(
                f["file_path"],
                m["id"],
                m["score"]
            )

    semantic_graph = semantic_graph_builder.export()

    # ---------------- Folder Tree ----------------
    folder_tree = build_folder_tree(files)

    # ---------------- Charts ----------------
    charts = {
        "file_types": generate_chart(structure["file_types"]),
        "content_profile": generate_chart(content_profile),
        "monthly_activity": generate_chart(timeline["monthly_activity"])
    }

    # ---------------- RETURN ONLY ----------------
    return {
        "structure": structure,
        "timeline": timeline,
        "health": health,
        "content_profile": content_profile,
        "folder_tree": folder_tree,
        "semantic_graph": semantic_graph,
        "charts": charts,
        "indexed_count": len(indexed_files),
        "total_files": len(files),
        "indexing_errors": indexing_errors
    }

