import os
from typing import List, Dict
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime

load_dotenv()

# -------------------------------------------------
# MongoDB Connection
# -------------------------------------------------

client = MongoClient(os.getenv("MONGO_URL"))
db = client[os.getenv("MONGO_DB_NAME", "authDB")]

files_collection = db.files
ocr_collection = db.ocrrecords


# -------------------------------------------------
# FILE + OCR LOADER (FILES ↔ OCRRECORDS)
# -------------------------------------------------

def load_files_with_ocr(folder_id: str, user_id: str) -> List[Dict]:
    """
    Loads files from `files` collection
    Joins OCR data from `ocrrecords` using fileId
    """

    folder_oid = ObjectId(folder_id)
    user_oid = ObjectId(user_id)

    # 1️⃣ Load files
    files = list(files_collection.find({
        "folderId": folder_oid,
        "userId": user_oid
    }))

    if not files:
        print("⚠️ No files found for given folderId and userId")
        return []

    # 2️⃣ Collect fileIds
    file_ids = [f["_id"] for f in files]

    # 3️⃣ Load OCR records (fileId-based join)
    ocr_records = list(ocr_collection.find({
        "fileId": {"$in": file_ids},
        "folderId": folder_oid,
        "userId": user_oid
    }))

    # 4️⃣ Build OCR map → fileId → OCR data
    ocr_map = {
        str(r["fileId"]): {
            "ocr_text": r.get("extractedText", ""),
            "ocr_confidence": r.get("confidence", 1.0),
            "ocr_entities": r.get("entities", [])
        }
        for r in ocr_records
    }

    # 5️⃣ Merge files + OCR
    enriched_files = []

    for f in files:
        file_id = str(f["_id"])
        ocr_data = ocr_map.get(file_id, {})

        enriched_files.append({
            # ---------------- IDs ----------------
            "file_id": file_id,
            "folder_id": folder_id,
            "user_id": user_id,

            # ---------------- FILE METADATA ----------------
            "file_name": f.get("originalName"),
            "stored_name": f.get("storedName"),
            "extension": f.get("extension"),
            "mime_type": f.get("mimeType"),
            "size_kb": round((f.get("size", 0) / 1024), 2),

            # Prefer publicPath → fallback localPath
            "file_path": f.get("publicPath") or f.get("localPath"),

            # ---------------- OCR ----------------
            "ocr_text": ocr_data.get("ocr_text", ""),
            "ocr_confidence": ocr_data.get("ocr_confidence", 0.0),
            "ocr_entities": ocr_data.get("ocr_entities", []),

            # ---------------- TIMESTAMPS ----------------
            "uploaded_at": f.get("uploadDate"),
        })

    print(f"✅ Loaded {len(enriched_files)} files with OCR data")
    return enriched_files


# -------------------------------------------------
# OCR UPSERT (OPTIONAL FALLBACK OCR SAVE)
# -------------------------------------------------

def upsert_ocr_record(
    *,
    file_id: str,
    file_name: str,
    folder_id: str,
    user_id: str,
    extracted_text: str,
    confidence: float = 1.0,
    entities=None
):
    """
    Persist OCR text into `ocrrecords`
    Uses fileId as the primary join key
    """

    ocr_collection.update_one(
        {
            "fileId": ObjectId(file_id),
            "folderId": ObjectId(folder_id),
            "userId": ObjectId(user_id)
        },
        {
            "$set": {
                "fileName": file_name,
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
