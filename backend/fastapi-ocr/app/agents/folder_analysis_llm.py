import os
import re
import json
import hashlib
import logging
from collections import Counter
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

        # 🔥 STRICT NOTEBOOKLM-STYLE PROMPT (PRESERVED)
        self.case_prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a senior criminal intelligence analyst.\n"
             "The input represents a consolidated government criminal justice profile.\n"
             "Write a formal institutional case brief.\n"
             "DO NOT mention documents, files, OCR, PDFs, or sources.\n"
             "Write in an administrative, neutral, authoritative tone.\n"
             "Explain who the individual is, what system they are tracked in,\n"
             "their custodial history, criminal charges, court oversight,\n"
             "and the monitoring purpose of the profile.\n"
             "Write a single unified narrative paragraph.\n"
             "If information is missing, omit it."),
            ("human",
             "COMBINED CASE CONTEXT:\n{combined_context}\n\n"
             "STRUCTURED CASE SIGNALS:\n{signals}\n\n"
             "Write the full case intelligence brief.")
        ])

        self.case_chain = self.case_prompt | self.llm | StrOutputParser()

    # --------------------------------------------------
    def _clean_ocr_text(self, text):
        return "\n".join(l.strip() for l in text.splitlines() if l.strip())

    # --------------------------------------------------
    def _generate_folder_fingerprint(self, docs):
        raw = "".join(str(doc["_id"]) + str(len(doc.get("extractedText", ""))) for doc in docs)
        return hashlib.md5(raw.encode()).hexdigest()

    # --------------------------------------------------
    # BASIC EXTRACTION (PRESERVED)
    def _extract_people(self, text):
        return re.findall(r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b', text)

    def _extract_cases(self, text):
        return re.findall(r'FIR\s*\d+/?\d*|IPC\s*\d+', text)

    def _extract_locations(self, text):
        return re.findall(
            r'(Tihar Jail|Mandoli Jail|Delhi|Haryana|Rohini|Court|High Court|District Court)',
            text
        )

    def _extract_dates(self, text):
        return re.findall(r'\b\d{1,2}/\d{1,2}/\d{4}\b', text)

    def _extract_money(self, text):
        return re.findall(r'₹\s?\d{2,7}', text)

    # --------------------------------------------------
    # 🔥 COMBINED SEMANTIC CONTEXT (KEY FIX)
    def _build_combined_case_context(self, docs):
        merged_text = []

        for doc in docs:
            text = self._clean_ocr_text(doc.get("extractedText", ""))
            if text:
                merged_text.append(text)

        combined = "\n".join(merged_text)
        return combined[:12000]

    # --------------------------------------------------
    # STRUCTURED SIGNALS (PRESERVED)
    def _build_case_signals(self, docs):

        people = Counter()
        cases = Counter()
        locations = Counter()
        dates = []
        money = []

        incarceration_refs = 0
        court_refs = 0
        visitation_refs = 0

        for doc in docs:
            text = self._clean_ocr_text(doc.get("extractedText", ""))[:5000]

            people.update(self._extract_people(text))
            cases.update(self._extract_cases(text))
            locations.update(self._extract_locations(text))
            dates.extend(self._extract_dates(text))
            money.extend(self._extract_money(text))

            if re.search(r'jail|custody|prison|barrack', text, re.I):
                incarceration_refs += 1

            if re.search(r'court|hearing|production|remand', text, re.I):
                court_refs += 1

            if re.search(r'visit|mulakat|family', text, re.I):
                visitation_refs += 1

        signals = {
            "Primary Individuals": people.most_common(3),
            "Criminal References": cases.most_common(10),
            "Institutional Locations": locations.most_common(10),
            "Key Dates": sorted(set(dates))[:20],
            "Financial Indicators": sorted(set(money))[:10],
            "Administrative Coverage": {
                "Custodial Tracking": incarceration_refs > 0,
                "Judicial Oversight": court_refs > 0,
                "Family Visitation Logs": visitation_refs > 0
            }
        }

        return json.dumps(signals, indent=2)

    # --------------------------------------------------
    # 🔥 NEW: FILE-LEVEL DETAIL + GRAPH NODES
    def _build_entity_graph(self, docs):

        nodes = []
        edges = []

        for doc in docs:
            text = self._clean_ocr_text(doc.get("extractedText", ""))

            nodes.append({
                "id": str(doc["_id"]),
                "label": doc.get("fileName", "Unknown File"),
                "type": "file",
                "details": {
                    "content_length": len(text),
                    "people": list(set(self._extract_people(text))),
                    "cases": list(set(self._extract_cases(text))),
                    "locations": list(set(self._extract_locations(text))),
                    "dates": list(set(self._extract_dates(text)))
                }
            })

        return {
            "nodes": nodes,
            "edges": edges
        }

    # --------------------------------------------------
    def analyze(self, folder_id):

        folder_object_id = ObjectId(folder_id)
        ocr_docs = list(self.db.ocrrecords.find({"folderId": folder_object_id}))

        if not ocr_docs:
            return {
                "summary": "Insufficient information available to construct a case profile.",
                "entity_graph": {}
            }

        fingerprint = self._generate_folder_fingerprint(ocr_docs)
        folder_record = self.db.folderanalysis.find_one({"folderId": folder_object_id})

        if folder_record and folder_record.get("fingerprint") == fingerprint:
            return {
                "summary": folder_record["finalSummary"],
                "entity_graph": folder_record.get("entityGraph", {})
            }

        logger.info("Running NotebookLM-style combined case synthesis")

        combined_context = self._build_combined_case_context(ocr_docs)
        case_signals = self._build_case_signals(ocr_docs)

        final_summary = self.case_chain.invoke({
            "combined_context": combined_context,
            "signals": case_signals
        })

        entity_graph = self._build_entity_graph(ocr_docs)

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
