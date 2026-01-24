from typing import Dict, List
from collections import Counter
from datetime import datetime


def build_charts(files: List[Dict]) -> Dict:
    entity_counter = Counter()
    keyword_counter = Counter()
    timeline_counter = Counter()

    for f in files:
        # Entities
        entities = f.get("nlp_entities", [])
        entity_counter.update(
            e if isinstance(e, str) else e.get("text")
            for e in entities
            if e
        )

        # Keywords
        keywords = f.get("nlp_keywords", [])
        keyword_counter.update(
            k[0] if isinstance(k, (list, tuple)) else k
            for k in keywords
        )

        # Timeline
        created = f.get("created_at")
        if isinstance(created, datetime):
            timeline_counter[created.strftime("%Y-%m")] += 1

    return {
        "entity_frequency": entity_counter.most_common(20),
        "keyword_frequency": keyword_counter.most_common(20),
        "timeline_activity": dict(sorted(timeline_counter.items())),
    }



# from typing import Dict, List
# from collections import Counter
# from datetime import datetime


# # -------------------------------------------------
# # INTERNAL NORMALIZERS (CRITICAL)
# # -------------------------------------------------

# def _normalize_entities(entities) -> List[str]:
#     """
#     Converts NLP entity objects into hashable strings
#     for chart aggregation.

#     Supported formats:
#     - {"text": "...", "label": "..."}
#     - string
#     """
#     normalized = []

#     for e in entities or []:
#         if isinstance(e, dict):
#             # Prefer entity text (user-visible)
#             value = e.get("text") or e.get("label")
#             if value:
#                 normalized.append(value)
#         elif isinstance(e, str):
#             normalized.append(e)

#     return normalized


# def _normalize_keywords(keywords) -> List[str]:
#     """
#     Converts keyword outputs into hashable strings.

#     Supported formats:
#     - ("keyword", count)
#     - string
#     """
#     normalized = []

#     for k in keywords or []:
#         if isinstance(k, tuple) and len(k) > 0:
#             normalized.append(k[0])
#         elif isinstance(k, str):
#             normalized.append(k)

#     return normalized


# # -------------------------------------------------
# # CHART BUILDER
# # -------------------------------------------------

# def build_charts(files: List[Dict]) -> Dict:
#     """
#     Builds UI-ready chart datasets from analyzed files.

#     Output is stable, normalized, and frontend-safe.
#     """

#     entity_counter = Counter()
#     keyword_counter = Counter()
#     timeline_counter = Counter()

#     for f in files:
#         # -----------------------------
#         # ENTITY DISTRIBUTION
#         # -----------------------------
#         entity_counter.update(
#             _normalize_entities(f.get("nlp_entities"))
#         )

#         # -----------------------------
#         # KEYWORD DISTRIBUTION
#         # -----------------------------
#         keyword_counter.update(
#             _normalize_keywords(f.get("nlp_keywords"))
#         )

#         # -----------------------------
#         # TIMELINE ACTIVITY
#         # -----------------------------
#         created = f.get("created_at")

#         if isinstance(created, datetime):
#             month_key = created.strftime("%Y-%m")
#             timeline_counter[month_key] += 1

#     # -------------------------------------------------
#     # FINAL UI PAYLOAD
#     # -------------------------------------------------
#     return {
#         "entity_frequency": entity_counter.most_common(20),
#         "keyword_frequency": keyword_counter.most_common(20),
#         "timeline_activity": dict(sorted(timeline_counter.items()))
#     }
