import hashlib
from pathlib import Path

FINGERPRINT_FILE = ".analysis.fp"

def folder_hash(folder: Path) -> str:
    h = hashlib.md5()
    for f in sorted(folder.rglob("*")):
        if f.is_file():
            h.update(f.name.encode())
            h.update(str(f.stat().st_size).encode())
    return h.hexdigest()

def has_folder_changed(folder: Path) -> bool:
    fp = folder / FINGERPRINT_FILE
    current = folder_hash(folder)
    if not fp.exists():
        return True
    return fp.read_text() != current

def save_fingerprint(folder: Path):
    (folder / FINGERPRINT_FILE).write_text(folder_hash(folder))
