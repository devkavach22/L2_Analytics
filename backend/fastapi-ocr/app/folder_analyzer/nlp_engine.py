import re
from typing import Dict, List

def extract_entities_and_keywords(text: str) -> Dict:
    """
    Extract structured entities with classification and description.
    Returns:
        {
            "entities": [
                {"text": ..., "label": ..., "description": ...},
                ...
            ],
            "keywords": [str, ...]
        }
    """

    entities = []
    keywords = []

    # ---------------------------
    # PERSON (simple pattern)
    # ---------------------------
    person_matches = re.findall(r"\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2}\b", text)
    for p in person_matches:
        entities.append({"text": p, "label": "PERSON", "description": "Matched PERSON regex pattern"})

    # ---------------------------
    # ORG
    # ---------------------------
    org_patterns = [r"Delhi Police", r"Police Department", r"SPECIAL BRANCH", r"District/Unit"]
    for pat in org_patterns:
        for match in re.findall(pat, text, re.IGNORECASE):
            entities.append({"text": match, "label": "ORG", "description": f"Matched ORG regex: {pat}"})

    # ---------------------------
    # DATE
    # ---------------------------
    dates = re.findall(r"\b\d{1,2}/\d{1,2}/\d{4}\b", text)
    for d in dates:
        entities.append({"text": d, "label": "DATE", "description": "Matched DATE regex pattern"})

    # ---------------------------
    # LEGAL CASE (FIR)
    # ---------------------------
    firs = re.findall(r"FIR\s?\d+/?\d*", text, re.IGNORECASE)
    for f in firs:
        entities.append({"text": f, "label": "LEGAL_CASE", "description": "Matched LEGAL_CASE regex pattern"})

    # ---------------------------
    # ACCOUNT NUMBERS
    # ---------------------------
    accounts = re.findall(r"\b\d{12,20}\b", text)
    for a in accounts:
        entities.append({"text": a, "label": "ACCOUNT", "description": "Matched ACCOUNT regex pattern"})

    # ---------------------------
    # LOCATIONS
    # ---------------------------
    loc_patterns = [r"Rohini Jail", r"Tihar Jail", r"Delhi", r"New Delhi"]
    for pat in loc_patterns:
        for match in re.findall(pat, text, re.IGNORECASE):
            entities.append({"text": match, "label": "LOCATION", "description": f"Matched LOCATION regex: {pat}"})

    # ---------------------------
    # KEYWORDS
    # ---------------------------
    base_keywords = ["court", "police", "criminal", "dossier", "prisoner", "adjourn", "district"]
    for word in base_keywords:
        if word.lower() in text.lower():
            keywords.append(word)

    # Remove duplicates (text + label)
    unique_entities = {(e["text"], e["label"]): e for e in entities}

    return {
        "entities": list(unique_entities.values()),
        "keywords": list(set(keywords))
    }
