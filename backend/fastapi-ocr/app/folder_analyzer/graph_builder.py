import os

class FolderGraph:
    """
    Generic graph structure for:
    - Folder tree
    - Semantic similarity graph
    - Folder-level analytics & summaries
    """

    def __init__(self):
        self.nodes = {}     # node_id -> node dict
        self.edges = []     # list of edges
        self.metadata = {}  # global metadata (folder summary, insights)

    # ---------------- NODE HELPERS ----------------

    def add_folder(self, folder_path: str):
        if folder_path not in self.nodes:
            self.nodes[folder_path] = {
                "id": folder_path,
                "type": "folder",
                "label": os.path.basename(folder_path) or folder_path,
                "metadata": {}
            }

    def add_file(self, file_path: str, extension: str, metadata=None):
        self.nodes[file_path] = {
            "id": file_path,
            "type": "file",
            "label": os.path.basename(file_path),
            "extension": extension,
            "metadata": metadata or {}
        }

    # ---------------- METADATA HELPERS ----------------

    def add_folder_metadata(self, folder_path: str, metadata: dict):
        """
        Attach aggregated metadata to a folder node.
        SAFE: auto-creates folder if missing.
        """
        # if folder_path not in self.nodes:
        #     self.add_folder(folder_path)
        if folder_path in self.nodes:
            self.nodes[folder_path].setdefault("metadata", {})
            self.nodes[folder_path]["metadata"].update(metadata)

    # def set_global_metadata(self, metadata: dict):
    #     """
    #     Attach global-level metadata:
    #     - auto_summary
    #     - insights
    #     - risks
    #     - themes
    #     """
    #     self.metadata.update(metadata)

    # ---------------- EDGE HELPERS ----------------

    def link_parent_child(self, parent: str, child: str):
        self.edges.append({
            "source": parent,
            "target": child,
            "type": "contains"
        })

    def link_similar(self, source: str, target: str, score: float):
        self.edges.append({
            "source": source,
            "target": target,
            "type": "semantic_similarity",
            "weight": round(float(score), 4)
        })

    # ---------------- EXPORT ----------------

    def export(self):
        """
        Frontend-friendly export format
        """
        return {
            "nodes": list(self.nodes.values()),
            "edges": self.edges
            # "metadata": self.metadata
        }