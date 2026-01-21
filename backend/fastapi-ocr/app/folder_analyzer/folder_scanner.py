import os
from datetime import datetime

def scan_folder(folder_path: str):
    files = []

    for root, _, filenames in os.walk(folder_path):
        for name in filenames:
            path = os.path.join(root, name)
            stat = os.stat(path)

            files.append({
                "file_path": path,
                "file_name": name,
                "extension": os.path.splitext(name)[1].lower(),
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime)
            })

    return files
