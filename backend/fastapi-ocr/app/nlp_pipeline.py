import os
import re
from pymongo import MongoClient
from dotenv import load_dotenv
import spacy
from llama_index.core import Document

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
OCR_COLLECTION = os.getenv("OCR_COLLECTION", "ocrrecords")

client = MongoClient(MONGO_URL)
db = client[MONGO_DB_NAME]
collection = db[OCR_COLLECTION]

# Load Spacy
nlp = spacy.load("en_core_web_sm")

def clean_text(text):
    if not text:
        return ""
    text = text.replace("\n", " ")
    return re.sub(r"\s+", " ", text).strip()

def fetch_all_documents():
    docs = []
    for row in collection.find():
        docs.append(row.get("extractedText", ""))
    return docs

def perform_ner(text):
    doc = nlp(text[:100000])

    entities = {
        "PERSON": [],
        "ORG": [],
        "GPE": [],
        "DATE": [],
        "LAW": []
    }

    for ent in doc.ents:
        if ent.label_ in entities:
            if ent.text not in entities[ent.label_]:
                entities[ent.label_].append(ent.text)

    sections = re.findall(r"(?:Section|u/s)\s+(\d+[A-Z]*)", text, re.IGNORECASE)
    entities["LAW"].extend(list(set(sections)))

    return entities

def build_entity_documents(text):
    ents = perform_ner(text)
    docs = []

    for etype, values in ents.items():
        for val in values:
            docs.append(
                Document(
                    text=f"{val} is a {etype} mentioned in the document",
                    metadata={"entity": val, "type": etype}
                )
            )
    return docs


# # app/nlp_pipeline.py
# import os
# import re
# from pymongo import MongoClient
# from dotenv import load_dotenv

# load_dotenv()

# MONGO_URL = os.getenv("MONGO_URL")
# MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
# OCR_COLLECTION = os.getenv("OCR_COLLECTION", "ocrrecords")

# client = MongoClient(MONGO_URL)
# db = client[MONGO_DB_NAME]
# collection = db[OCR_COLLECTION]

# def clean_text(text: str) -> str:
#     """
#     Basic text cleaning to prepare for LLM.
#     """
#     if not text:
#         return ""
#     # Remove excessive newlines and whitespace
#     text = text.replace("\n", " ")
#     text = re.sub(r'\s+', ' ', text)
#     return text.strip()

# def fetch_related_text(keyword: str):
#     """
#     Fetch all documents whose extractedText contains the keyword.
#     """
#     if not keyword:
#         return []

#     results = collection.find(
#         {"extractedText": {"$regex": keyword, "$options": "i"}}
#     )

#     return [doc.get("extractedText", "") for doc in results]

# # # app/nlp_pipeline.py
# # import os
# # import re
# # from pymongo import MongoClient
# # from dotenv import load_dotenv

# # load_dotenv()

# # MONGO_URL = os.getenv("MONGO_URL")
# # MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
# # OCR_COLLECTION = os.getenv("OCR_COLLECTION", "ocrrecords")

# # client = MongoClient(MONGO_URL)
# # db = client[MONGO_DB_NAME]
# # collection = db[OCR_COLLECTION]

# # def clean_text(text: str) -> str:
# #     """
# #     Basic text cleaning to prepare for LLM.
# #     """
# #     if not text:
# #         return ""
# #     # Remove excessive newlines and whitespace
# #     text = text.replace("\n", " ")
# #     text = re.sub(r'\s+', ' ', text)
# #     return text.strip()

# # def fetch_related_text(keyword: str):
# #     """
# #     Fetch all documents whose extractedText contains the keyword.
# #     """
# #     if not keyword:
# #         return []

# #     results = collection.find(
# #         {"extractedText": {"$regex": keyword, "$options": "i"}}
# #     )

# #     return [doc.get("extractedText", "") for doc in results]