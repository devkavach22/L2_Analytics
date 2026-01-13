import re
from collections import Counter

CRIME_KEYWORDS = [
    "murder", "kill", "weapon", "knife", "gun", "threat",
    "assault", "rape", "robbery", "extortion", "kidnap"
]

AGGRESSION_WORDS = ["kill", "die", "threat", "attack", "revenge"]

def analyze_document(text: str) -> dict:
    text_l = text.lower()

    words = re.findall(r"\b[a-z]+\b", text_l)

    crime_hits = sum(1 for w in words if w in CRIME_KEYWORDS)
    aggression_hits = sum(1 for w in words if w in AGGRESSION_WORDS)

    dates = re.findall(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", text)
    names = re.findall(r"\b[A-Z][a-z]{2,}\b", text)

    word_freq = Counter(words)

    risk_score = min(1.0, (crime_hits * 0.1) + (aggression_hits * 0.15))

    sentiment = {
        "Neutral": max(0.1, 1 - risk_score),
        "Negative": min(0.6, risk_score),
        "Aggressive": min(0.3, aggression_hits * 0.05)
    }

    return {
        "risk_score": round(risk_score, 2),
        "sentiment": sentiment,
        "kpis": {
            "Words Analyzed": len(words),
            "Dates Detected": len(dates),
            "Named Entities": len(set(names)),
            "Crime Indicators": crime_hits
        },
        "top_terms": dict(word_freq.most_common(8))
    }
