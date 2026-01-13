import os
import hashlib

def file_hash(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def scan_folder(folder_path):
    files = []

    for root, _, filenames in os.walk(folder_path):
        for name in filenames:
            path = os.path.join(root, name)
            stat = os.stat(path)

            files.append({
                "name": name,
                "path": path,
                "size": stat.st_size,
                "modified": stat.st_mtime,
                "hash": file_hash(path),
                "ext": name.split(".")[-1].lower()
            })

    return files
