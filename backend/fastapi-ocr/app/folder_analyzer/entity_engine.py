import re
from collections import defaultdict, Counter
from typing import Dict, List


# ----------------------------------
# ENTITY EXTRACTION
# ----------------------------------
def extract_entities(text: str) -> List[Dict]:
    patterns = {
        "PERSON": r"\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2}\b",
        "DATE": r"\b\d{1,2}/\d{1,2}/\d{4}\b",
        "LEGAL_CASE": r"FIR\s?\d+/?\d*",
        "ACCOUNT": r"\b\d{12,20}\b",
        "ORG": r"(Delhi Police|Police Department|SPECIAL BRANCH)",
        "LOCATION": r"(Tihar Jail|Rohini Jail|Delhi|New Delhi)"
    }

    entities = []
    for label, pattern in patterns.items():
        for match in re.findall(pattern, text, re.IGNORECASE):
            entities.append({
                "text": match.strip(),
                "type": label,
                "confidence": 0.9,
                "source": "regex"
            })

    unique = {(e["text"], e["type"]): e for e in entities}
    return list(unique.values())


# ----------------------------------
# KEYWORDS
# ----------------------------------
def extract_keywords(text: str) -> List[str]:
    base = ["court", "police", "criminal", "prisoner", "legal", "case"]
    text_lower = text.lower()
    return list({w for w in base if w in text_lower})


# ----------------------------------
# PER FILE ENTITY TABLE
# ----------------------------------
def build_entity_table(entities: List[Dict]) -> List[Dict]:
    counter = Counter((e["text"], e["type"]) for e in entities)
    table = []
    for (text, etype), count in counter.items():
        table.append({
            "entity": text,
            "type": etype,
            "mentions": count
        })
    return sorted(table, key=lambda x: x["mentions"], reverse=True)[:5]


# ----------------------------------
# RELATIONSHIP GRAPH
# ----------------------------------
def build_relationship_graph(files: List[Dict]) -> Dict:
    graph = defaultdict(set)

    for f in files:
        ents = f.get("nlp_entities", [])
        texts = [e["text"] for e in ents]

        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                graph[texts[i]].add(texts[j])
                graph[texts[j]].add(texts[i])

    return {k: list(v)[:5] for k, v in graph.items()}
