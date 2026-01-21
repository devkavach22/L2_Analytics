from collections import Counter, defaultdict
from datetime import datetime


# ---------------- BASIC STRUCTURE ----------------

def analyze_structure(files):
    ext_counter = Counter(f.get("extension", "unknown") for f in files)

    total_size = sum(f.get("size_bytes", 0) for f in files)
    total_files = len(files) or 1  # avoid division by zero

    return {
        "total_files": len(files),
        "file_types": dict(ext_counter),
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "avg_file_size_kb": round((total_size / total_files) / 1024, 2)
    }


# ---------------- FILE ACTIVITY INTELLIGENCE ----------------

def analyze_timeline(files):
    timeline = []

    monthly_activity = defaultdict(int)

    for f in files:
        modified_at = f.get("modified_at")
        if not modified_at:
            continue

        timeline.append({
            "file": f.get("file_name"),
            "modified_at": modified_at
        })

        key = modified_at.strftime("%Y-%m")
        monthly_activity[key] += 1

    timeline.sort(key=lambda x: x["modified_at"])

    return {
        "timeline": timeline,
        "monthly_activity": dict(monthly_activity)
    }


# ---------------- FOLDER HEALTH INTELLIGENCE ----------------

def analyze_folder_health(files):
    safe_files = [
        f for f in files
        if "size_bytes" in f and f.get("modified_at")
    ]

    large_files = sorted(
        safe_files,
        key=lambda x: x.get("size_bytes", 0),
        reverse=True
    )[:10]

    old_files = [
        f for f in safe_files
        if (datetime.utcnow() - f["modified_at"]).days > 365
    ]

    return {
        "largest_files": [
            {
                "file": f.get("file_name"),
                "size_mb": round(f.get("size_bytes", 0) / (1024 * 1024), 2)
            }
            for f in large_files
        ],
        "old_unused_files": len(old_files)
    }


# ---------------- CONTENT TYPE INTELLIGENCE ----------------

def analyze_content_profile(files):
    categories = defaultdict(int)

    for f in files:
        ext = f.get("extension", "").lower()

        if ext in [".csv", ".xlsx"]:
            categories["datasets"] += 1
        elif ext in [".pdf", ".docx"]:
            categories["documents"] += 1
        elif ext in [".jpg", ".png", ".jpeg"]:
            categories["images"] += 1
        elif ext in [".py", ".js"]:
            categories["code"] += 1
        else:
            categories["other"] += 1

    return dict(categories)
