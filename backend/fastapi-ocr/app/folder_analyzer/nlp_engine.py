import re
import spacy
from collections import Counter

nlp = spacy.load("en_core_web_sm")
STOPWORDS = nlp.Defaults.stop_words


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_entities_and_keywords(text: str):
    doc = nlp(text)

    entities = [
        ent.text.strip()
        for ent in doc.ents
        if ent.text.strip()
    ]

    keywords = [
        token.lemma_.lower()
        for token in doc
        if token.is_alpha
        and token.text.lower() not in STOPWORDS
        and len(token.text) > 2
    ]

    return {
        "entities": entities,                 # flat list
        "keywords": Counter(keywords).most_common(10)
    }

