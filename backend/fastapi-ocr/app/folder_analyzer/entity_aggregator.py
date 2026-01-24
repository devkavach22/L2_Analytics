from collections import defaultdict, Counter
from typing import List, Dict


def aggregate_entities_and_keywords(files: List[Dict]) -> Dict:
    """
    Aggregates entities with TYPE classification and keyword frequencies.
    Returns structured entity table.
    """

    entity_table = defaultdict(Counter)
    keyword_counter = Counter()

    for f in files:
        # ---------------------------
        # ENTITIES (WITH TYPES)
        # ---------------------------
        for ent in f.get("nlp_entities", []):
            if isinstance(ent, dict):
                text = ent.get("text")
                label = ent.get("label") or ent.get("type")

                if text and label:
                    entity_table[label][text] += 1

        # ---------------------------
        # KEYWORDS
        # ---------------------------
        for kw in f.get("nlp_keywords", []):
            if isinstance(kw, str):
                keyword_counter[kw] += 1
            elif isinstance(kw, dict):
                keyword_counter[kw.get("text")] += 1

    # Convert to API-ready format
    structured_entities = {}

    for entity_type, counter in entity_table.items():
        structured_entities[entity_type] = [
            {"text": text, "count": count}
            for text, count in counter.most_common(20)
        ]

    return {
        "entities": structured_entities,
        "keywords": dict(keyword_counter.most_common(50))
    }
