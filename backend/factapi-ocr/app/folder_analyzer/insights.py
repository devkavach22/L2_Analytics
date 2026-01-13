def generate_insights(stats):
    insights = [
        f"📁 {stats['total_files']} documents analyzed",
        f"💾 Total size: {round(stats['total_size'] / 1024, 2)} KB",
        f"🏷 Dominant category: {stats['dominant_category']}"
    ]

    if stats.get("risks"):
        insights.append("⚠️ Some files may be empty or invalid")

    return insights
