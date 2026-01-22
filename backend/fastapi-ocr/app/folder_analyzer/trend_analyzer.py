from collections import Counter
from datetime import datetime
import spacy

nlp = spacy.load("en_core_web_sm")

def analyze_trends(files,top_k=10):
    word_counter = Counter()

    for f in files:
        text = f.get("ocr_text", "")
        if not text:
            continue

        words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
        word_counter.update(words)

    return word_counter.most_common(top_k)

# async def analyze_trends(files):
#     monthly_topics = {}

#     for f in files:
#         month = f["created_at"].strftime("%Y-%m")
#         keywords = [k for k, _ in f["nlp"]["keywords"]]

#         monthly_topics.setdefault(month, [])
#         monthly_topics[month].extend(keywords)

#     trends = {
#         month: Counter(words).most_common(5)
#         for month, words in monthly_topics.items()
#     }

#     return trends
