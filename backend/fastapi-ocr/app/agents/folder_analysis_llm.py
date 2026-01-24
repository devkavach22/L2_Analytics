import os
import re
import hashlib
import logging
from bson import ObjectId
from pymongo import MongoClient
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.tools.llm_loader import load_llm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FolderAnalysisAgent")


class FolderAnalysisAgent:

    def __init__(self):
        self.llm = load_llm()

        mongo_url = os.getenv("MONGO_URL")
        db_name = os.getenv("MONGO_DB_NAME", "authDB")

        self.client = MongoClient(mongo_url)
        self.db = self.client[db_name]

        # 🔥 PROFESSIONAL ANALYST PROMPT
        self.structured_prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a professional intelligence analyst.\n"
             "Write a structured analytical brief.\n"
             "Do NOT mention OCR, documents, or sources.\n"
             "Do NOT use phrases like 'Based on' or 'According to'."),
            ("human",
             "Information:\n{context}\n\n"
             "Prepare structured sections:\n"
             "1. Document Types Represented\n"
             "2. Key Individuals and Entities\n"
             "3. Chronological Highlights\n"
             "4. Financial Indicators\n"
             "5. Legal or Criminal Matters\n"
             "6. Patterns and Observations\n"
             "7. Information Gaps")
        ])

        self.doc_prompt = ChatPromptTemplate.from_messages([
            ("system", "Provide a short factual summary."),
            ("human", "{context}")
        ])

        self.doc_chain = self.doc_prompt | self.llm | StrOutputParser()
        self.structured_chain = self.structured_prompt | self.llm | StrOutputParser()

    # --------------------------------------------------
    def _clean_ocr_text(self, text):
        return "\n".join(l.strip() for l in text.splitlines() if l.strip())

    # --------------------------------------------------
    def _generate_folder_fingerprint(self, docs):
        raw = "".join(str(doc["_id"]) + str(len(doc.get("extractedText", ""))) for doc in docs)
        return hashlib.md5(raw.encode()).hexdigest()

    # --------------------------------------------------
    # 🔥 ENTITY TYPE CLASSIFIER
    def _classify_entity(self, e):
        if re.search(r'\d{2}/\d{2}/\d{4}', e):
            return "DATE"
        if re.search(r'\b\d{10,}\b', e):
            return "ACCOUNT"
        if "FIR" in e or "IPC" in e:
            return "LEGAL_CASE"
        if any(k in e.lower() for k in ["police", "court", "branch"]):
            return "ORG"
        if any(k in e.lower() for k in ["jail", "prison", "district", "delhi"]):
            return "LOCATION"
        if e.istitle():
            return "PERSON"
        return "OTHER"

    # --------------------------------------------------
    def _extract_entities(self, text):
        found = set()

        found.update(re.findall(r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b', text))
        found.update(re.findall(r'\bFIR\s*\d+/?\d*\b', text))
        found.update(re.findall(r'\b\d{2}/\d{2}/\d{4}\b', text))
        found.update(re.findall(r'\b\d{10,}\b', text))

        entities = [{"name": e, "type": self._classify_entity(e)} for e in found]
        return entities

    # --------------------------------------------------
    def _build_entity_graph(self, doc_entities):
        nodes = {}
        edges = []

        for entities in doc_entities.values():
            for e in entities:
                nodes[e["name"]] = {"id": e["name"], "type": e["type"]}

        # co-occurrence links
        for entities in doc_entities.values():
            names = [e["name"] for e in entities]
            for i in range(len(names)):
                for j in range(i+1, len(names)):
                    edges.append({
                        "source": names[i],
                        "target": names[j],
                        "relation": "co_occurrence"
                    })

        return {"nodes": list(nodes.values()), "edges": edges}

    # --------------------------------------------------
    def analyze(self, folder_id):

        folder_object_id = ObjectId(folder_id)
        ocr_docs = list(self.db.ocrrecords.find({"folderId": folder_object_id}))

        if not ocr_docs:
            return {"summary": "Insufficient information available.", "entity_graph": {}}

        fingerprint = self._generate_folder_fingerprint(ocr_docs)
        folder_record = self.db.folderanalysis.find_one({"folderId": folder_object_id})

        if folder_record and folder_record.get("fingerprint") == fingerprint:
            logger.info("Using cached analysis")
            return {
                "summary": folder_record["finalSummary"],
                "entity_graph": folder_record.get("entityGraph", {})
            }

        logger.info("Running fresh analysis")

        doc_summaries = []
        doc_entities = {}

        # 🔥 ENTITY EXTRACTION RUNS FOR ALL DOCS
        for doc in ocr_docs:
            text = self._clean_ocr_text(doc.get("extractedText", ""))

            if doc.get("docSummary"):
                summary = doc["docSummary"]
            else:
                summary = self.doc_chain.invoke({"context": text[:2000]})
                self.db.ocrrecords.update_one({"_id": doc["_id"]}, {"$set": {"docSummary": summary}})

            doc_summaries.append(summary)
            doc_entities[str(doc["_id"])] = self._extract_entities(text)

        entity_graph = self._build_entity_graph(doc_entities)

        combined = "\n\n".join(doc_summaries)
        final_summary = self.structured_chain.invoke({"context": combined})

        self.db.folderanalysis.update_one(
            {"folderId": folder_object_id},
            {"$set": {
                "finalSummary": final_summary,
                "fingerprint": fingerprint,
                "entityGraph": entity_graph
            }},
            upsert=True
        )

        return {
            "summary": final_summary,
            "entity_graph": entity_graph
        }
