import os
from app.folder_analyzer.graph_builder import FolderGraph


def build_folder_tree(files):
    graph = FolderGraph()

    for f in files:
        file_path = f.get("file_path")
        if not file_path:
            continue

        folder_path = os.path.dirname(file_path)

        graph.add_folder(folder_path)

        graph.add_file(
            file_path=file_path,
            extension=f.get("extension", "unknown"),
            metadata={
                "mongo_id": f.get("_id"),
                # "ocr_text": f.get("ocr_text", ""),
                # "ocr_entities": f.get("ocr_entities", []),
                "ocr_confidence": f.get("ocr_confidence", 0),
                "nlp_entities": f.get("nlp_entities", []),
                "nlp_keywords": f.get("nlp_keywords", []),
                "size_kb": f.get("size_kb")
            }
        )

        graph.link_parent_child(folder_path, file_path)

    return graph.export()
