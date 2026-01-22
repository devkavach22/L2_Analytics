from app.folder_analyzer.graph_builder import FolderGraph
from app.folder_analyzer.content_indexer import find_similar_files


def build_semantic_graph(files, max_files=15):
    graph = FolderGraph()
    files = files[:max_files]

    for f in files:
        graph.add_file(f["file_path"], f.get("extension", ""))

    for f in files:
        # source = f["file_path"]
        matches = find_similar_files(f["file_path"], top_k=3)

        for m in matches:
            graph.link_similar(f["file_path"], m["id"], m["score"])

    return graph.export()
