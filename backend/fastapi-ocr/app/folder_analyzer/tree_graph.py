import os
from app.folder_analyzer.graph_builder import FolderGraph


def build_folder_tree(files):
    """
    Builds a folder → file hierarchy graph safely.
    Does NOT rely on 'folder' key.
    """

    graph = FolderGraph()

    for f in files:
        file_path = f.get("file_path")
        extension = f.get("extension", "unknown")

        if not file_path:
            continue

        # 🔥 Derive folder safely from file path
        folder_path = os.path.dirname(file_path)

        # Add nodes
        graph.add_folder(folder_path)
        graph.add_file(file_path, extension)

        # Link folder → file
        graph.link_parent_child(folder_path, file_path)

    return graph.export()
