class FolderGraph:
    """
    Generic graph structure for:
    - Folder tree
    - Semantic similarity graph
    """

    def __init__(self):
        self.nodes = {}   # node_id -> {type, label, extra}
        self.edges = []   # {source, target, type, weight}

    # ---------------- NODE HELPERS ----------------

    def add_folder(self, folder_path: str):
        if folder_path not in self.nodes:
            self.nodes[folder_path] = {
                "id": folder_path,
                "type": "folder",
                "label": folder_path.split("/")[-1] or folder_path
            }

    def add_file(self, file_path: str, extension: str = ""):
        if file_path not in self.nodes:
            self.nodes[file_path] = {
                "id": file_path,
                "type": "file",
                "label": file_path.split("/")[-1],
                "extension": extension
            }

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
            "weight": round(score, 4)
        })

    # ---------------- EXPORT ----------------

    def export(self):
        """
        Export graph in frontend-friendly format
        """
        return {
            "nodes": list(self.nodes.values()),
            "edges": self.edges
        }
