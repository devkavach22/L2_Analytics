from collections import Counter
from typing import List, Dict


def aggregate_entities_and_keywords(files: List[Dict], top_k: int = 5) -> Dict:
    entity_counter = Counter()
    keyword_counter = Counter()

    for f in files:
        # ---- ENTITIES ----
        for ent in f.get("nlp_entities", []):
            if isinstance(ent, dict) and ent.get("text"):
                entity_counter[ent["text"]] += 1

        # ---- KEYWORDS ----
        for kw, count in f.get("nlp_keywords", []):
            keyword_counter[kw] += count

    return {
        "entities": dict(entity_counter.most_common(top_k)),
        "keywords": dict(keyword_counter.most_common(top_k))
    }
