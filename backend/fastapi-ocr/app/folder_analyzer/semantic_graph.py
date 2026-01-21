# app/folder_analyzer/semantic_graph.py

from app.folder_analyzer.graph_builder import FolderGraph
from app.folder_analyzer.content_indexer import find_similar_files

def build_semantic_graph(files, max_files=15):
    """
    FAST semantic graph using vector store search
    NO cosine matrix
    NO embedding loops
    """
    graph = FolderGraph()

    files = files[:max_files]   # 🚀 SPEED LIMIT

    for f in files:
        path = f["file_path"]
        graph.add_file(path, f["extension"])

    for f in files:
        source = f["file_path"]
        matches = find_similar_files(source, top_k=3)

        for m in matches:
            graph.link_similar(
                source,
                m["id"],
                m["score"]
            )

    return graph.export()
