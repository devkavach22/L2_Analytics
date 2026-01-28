from collections import defaultdict


def format_entities_by_type(entity_list):
    grouped = defaultdict(list)

    for e in entity_list:
        grouped[e["type"]].append(e["text"])

    # remove duplicates per type
    return {k: list(set(v)) for k, v in grouped.items()}
