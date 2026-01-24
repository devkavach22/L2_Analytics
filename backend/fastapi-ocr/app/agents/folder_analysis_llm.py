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

        self.prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are an enterprise document analysis assistant.\n"
             "Answer strictly from OCR text.\n"
             "If insufficient info, say: 'Insufficient evidence in the documents.'"),
            ("human", "OCR Content:\n{context}\n\nTask:\n{question}")
        ])

        self.chain = self.prompt | self.llm | StrOutputParser()

    # --------------------------------------------------
    def _clean_ocr_text(self, text: str) -> str:
        lines = text.splitlines()
        cleaned = []
        for l in lines:
            l = l.strip()
            if not l:
                continue
            if l.lower().count("nan") > 2:
                continue
            if sum(c.isdigit() for c in l) > len(l) * 0.6:
                continue
            cleaned.append(l)
        return "\n".join(cleaned)

    # --------------------------------------------------
    def _smart_sample(self, text: str, max_chars=1500):
        if len(text) <= max_chars:
            return text
        part = max_chars // 3
        return text[:part] + "\n...\n" + text[len(text)//2:len(text)//2+part] + "\n...\n" + text[-part:]

    # --------------------------------------------------
    def _generate_folder_fingerprint(self, ocr_docs):
        """
        Create a fingerprint of folder content
        """
        hash_input = ""
        for doc in ocr_docs:
            hash_input += str(doc["_id"])
            hash_input += str(len(doc.get("extractedText", "")))

        return hashlib.md5(hash_input.encode()).hexdigest()

    # --------------------------------------------------
    def analyze(self, folder_id: str):

        folder_object_id = ObjectId(folder_id)

        ocr_docs = list(self.db.ocrrecords.find({"folderId": folder_object_id}))

        if not ocr_docs:
            return "Insufficient evidence in the documents."

        # 🔥 STEP 1 — Check folder fingerprint
        current_fingerprint = self._generate_folder_fingerprint(ocr_docs)

        folder_record = self.db.folderanalysis.find_one({"folderId": folder_object_id})

        if folder_record and folder_record.get("fingerprint") == current_fingerprint:
            logger.info("No folder changes detected — using cached summary.")
            return folder_record["finalSummary"]

        logger.info("Folder changed — running fresh analysis.")

        doc_summaries = []

        # 🔥 STEP 2 — Document summaries (with per-doc cache)
        for doc in ocr_docs:
            if doc.get("docSummary"):
                logger.info(f"Using cached doc summary for {doc['_id']}")
                doc_summaries.append(doc["docSummary"])
                continue

            text = self._clean_ocr_text(doc.get("extractedText", ""))
            sampled = self._smart_sample(text)

            logger.info(f"Generating summary for doc {doc['_id']}")

            summary = self.chain.invoke({
                "context": sampled,
                "question": "Summarize this document factually."
            })

            self.db.ocrrecords.update_one(
                {"_id": doc["_id"]},
                {"$set": {"docSummary": summary}}
            )

            doc_summaries.append(summary)

        # 🔥 STEP 3 — Folder synthesis
        combined = "\n\n---\n\n".join(doc_summaries)

        logger.info("Generating folder-level summary")

        final_summary = self.chain.invoke({
            "context": combined,
            "question": "Provide an overall summary of all documents."
        })

        # 🔥 STEP 4 — Save result + fingerprint
        self.db.folderanalysis.update_one(
            {"folderId": folder_object_id},
            {
                "$set": {
                    "finalSummary": final_summary,
                    "fingerprint": current_fingerprint
                }
            },
            upsert=True
        )

        logger.info("Folder analysis complete and cached.")

        return final_summary
