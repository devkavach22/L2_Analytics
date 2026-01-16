from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path

from .scanner import scan_folder
from .extractor import extract_content
from .analyzer import analyze_files
from .charts import build_charts
from .insights import generate_insights
from .fingerprint import has_folder_changed, save_fingerprint
from .utils import sanitize

router = APIRouter()

BASE_UPLOAD_DIR = Path.cwd() / "uploads"

class FolderAnalyzeRequest(BaseModel):
    user_id: str
    folder_id: str
    deep_analysis: bool = True
    generate_charts: bool = True


@router.post("/folder/analyze/{folder_id}")
async def analyze_folder(folder_id: str, req: FolderAnalyzeRequest):

    folder_path = BASE_UPLOAD_DIR / req.user_id / folder_id

    if not folder_path.exists():
        raise HTTPException(400, "Folder does not exist")

    # 🔹 Change detection
    if not has_folder_changed(folder_path):
        return sanitize({
            "success": True,
            "data": {
                "status": "cached",
                "message": "No changes detected since last analysis"
            }
        })

    # 🔹 Scan
    files = scan_folder(folder_path)

    if not files:
        return sanitize({
            "success": True,
            "data": {
                "status": "empty",
                "overview": {},
                "charts": {},
                "insights": ["📂 Folder is empty"],
                "files": []
            }
        })

    # 🔹 Content extraction
    if req.deep_analysis:
        for f in files:
            f["content"] = extract_content(f)

    # 🔹 Core intelligence
    stats = analyze_files(files)

    save_fingerprint(folder_path)

    response = {
        "status": "analyzed",
        "overview": {
            "total_files": stats["total_files"],
            "total_size": stats["total_size"],
            "file_types": stats["file_types"],
            "dominant_category": stats["dominant_category"]
        },
        "charts": build_charts(stats) if req.generate_charts else {},
        "insights": generate_insights(stats),
        "files": [
            {
                "name": f["name"],
                "type": f["ext"],
                "size": f["size"],
                "category": f.get("category"),
                "risk": f.get("risk")
            }
            for f in files
        ]
    }

    return sanitize({"success": True, "data": response})
