def build_charts(stats):
    return {
        "fileTypeDistribution": {
            "labels": list(stats["file_types"].keys()),
            "values": list(stats["file_types"].values())
        },
        "categoryDistribution": {
            "labels": [stats["dominant_category"]],
            "values": [stats["total_files"]]
        }
    }
