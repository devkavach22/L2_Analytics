import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URL"))
db = client[os.getenv("MONGO_DB_NAME", "authDB")]

files_collection = db.files
ocr_collection = db[os.getenv("OCR_COLLECTION", "ocrrecords")]


def load_files_by_folder(folder_id: str, user_id: str):
    return list(
        files_collection.find(
            {"folder_id": folder_id, "user_id": user_id}
        )
    )

def upsert_ocr_record(
    *,
    file_path: str,
    file_name: str,
    folder_id: str,
    user_id: str,
    extracted_text: str,
    confidence: float = 0.0,
    entities=None
):
    """
    Persist OCR back to MongoDB (UPSERT).
    """
    ocr_collection.update_one(
        {
            "file_path": os.path.normpath(file_path),
            "folder_id": folder_id,
            "user_id": user_id
        },
        {
            "$set": {
                "file_name": file_name,
                "extractedText": extracted_text,
                "confidence": confidence,
                "entities": entities or [],
                "updatedAt": datetime.utcnow()
            },
            "$setOnInsert": {
                "createdAt": datetime.utcnow()
            }
        },
        upsert=True
    )

def load_ocr_records(folder_id: str, user_id: str):
    """
    Returns:
    {
        normalized_file_path: {
            ocr_text,
            ocr_confidence,
            ocr_entities
        }
    }
    """
    records = ocr_collection.find({
        "folder_id": folder_id,
        "user_id": user_id
    })

    ocr_map = {}

    for r in records:
        file_path = r.get("file_path")
        if not file_path:
            continue

        normalized_path = os.path.normpath(file_path)
        # extracted_text = r.get("extracted_text") or r.get("extractedText") or ""
        ocr_map[normalized_path] = {
            "ocr_text": r.get("extracted_text", ""),
            "ocr_confidence": r.get("confidence", 0),
            "ocr_entities": r.get("entities", [])
        }

    return ocr_map

# import os
# from datetime import datetime
# from pymongo import MongoClient
# from bson import ObjectId
# from dotenv import load_dotenv
# from typing import Optional, Union

# load_dotenv()

# client = MongoClient(os.getenv("MONGO_URL"))
# db = client[os.getenv("AUTH_DB", "authDB")]

# files_collection = db.files
# analysis_collection = db.analysis_jobs
# ocr_collection = db.ocrrecords


# # ---------------- FILE METADATA ----------------
# def save_file_metadata(records):
#     if records:
#         files_collection.insert_many(records)


# # ---------------- OCR RECORDS ----------------
# def load_ocr_records():
#     """
#     Returns dict: { file_path: ocr_data }
#     """
#     records = ocr_collection.find({})
#     ocr_map = {}

#     for r in records:
#         ocr_map[r["file_path"]] = {
#             "ocr_text": r.get("extracted_text", ""),
#             "ocr_confidence": r.get("confidence", 0),
#             "ocr_entities": r.get("entities", []),
#             "ocr_created_at": r.get("created_at")
#         }

#     return ocr_map


# # ---------------- ANALYSIS JOB ----------------
# def create_analysis_job(folder_id, user_id):
#     res = analysis_collection.insert_one({
#         "folder_id": folder_id,
#         "user_id": user_id,
#         "status": "PENDING",
#         "created_at": datetime.utcnow()
#     })
#     return str(res.inserted_id)


# def update_analysis_status(
#     analysis_id: str,
#     status: str,
#     step: str = None,
#     progress: int = None,
#     result: dict = None,
#     error: str = None
# ):
#     update_doc = {
#         "status": status,
#         "updated_at": datetime.utcnow()
#     }

#     if step:
#         update_doc["step"] = step
#     if progress is not None:
#         update_doc["progress"] = progress
#     if result:
#         update_doc["result"] = result
#     if error:
#         update_doc["error"] = error

#     analysis_collection.update_one(
#         {"_id": ObjectId(analysis_id)},
#         {"$set": update_doc}
#     )


# def get_analysis_job(analysis_id: Union[str, dict, ObjectId]) -> Optional[dict]:
#     if isinstance(analysis_id, dict):
#         analysis_id = analysis_id.get("_id")

#     try:
#         oid = ObjectId(ARanalysis_id
#         )
#     except Exception:
#         return None

#     return analysis_collection.find_one({"_id": oid})
