from collections import Counter

def analyze_files(files):
    total_size = sum(f["size"] for f in files)
    file_types = Counter(f["ext"] for f in files)

    categories = Counter()
    risks = []

    for f in files:
        text = f.get("content", "").lower()

        if "invoice" in text:
            f["category"] = "Finance"
        elif "agreement" in text:
            f["category"] = "Legal"
        else:
            f["category"] = "General"

        categories[f["category"]] += 1

        if f["size"] == 0:
            f["risk"] = "Empty file"
            risks.append(f["name"])

    return {
        "total_files": len(files),
        "total_size": total_size,
        "file_types": dict(file_types),
        "dominant_category": categories.most_common(1)[0][0] if categories else None,
        "risks": risks
    }
