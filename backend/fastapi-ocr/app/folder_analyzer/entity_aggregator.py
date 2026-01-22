from collections import Counter


def aggregate_entities_and_keywords(files):
    entity_counter = Counter()
    keyword_counter = Counter()

    for f in files:
        for ent in f.get("nlp_entities", []):
            entity_counter[ent["text"]] += 1

        for kw, freq in f.get("nlp_keywords", []):
            keyword_counter[kw] += freq

    return {
        "entities": dict(entity_counter.most_common(20)),
        "keywords": dict(keyword_counter.most_common(20))
    }
