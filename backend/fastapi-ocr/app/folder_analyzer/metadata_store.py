import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from typing import Optional, Union

load_dotenv()

client = MongoClient(os.getenv("MONGO_URL"))
db = client["folder_analysis"]

files_collection = db.files
analysis_collection = db.analysis_jobs


def save_file_metadata(records):
    if records:
        files_collection.insert_many(records)


def create_analysis_job(folder_id, user_id):
    res = analysis_collection.insert_one({
        "folder_id": folder_id,
        "user_id": user_id,
        "status": "PENDING",
        "created_at": datetime.utcnow()
    })
    return str(res.inserted_id)


def update_analysis_status(
    analysis_id: str,
    status: str,
    step: str = None,
    progress: int = None,
    result: dict = None,
    error: str = None
):
    update_doc = {
        "status": status,
        "updated_at": datetime.utcnow()
    }

    if step:
        update_doc["step"] = step

    if progress is not None:
        update_doc["progress"] = progress

    if result is not None:
        update_doc["result"] = result

    if error:
        update_doc["error"] = error

    analysis_collection.update_one(
        {"_id": ObjectId(analysis_id)},
        {"$set": update_doc}
    )



def get_analysis_job(analysis_id: Union[str, dict, ObjectId]) -> Optional[dict]:
    """
    Fetch analysis job safely.
    Accepts:
    - string ObjectId
    - ObjectId
    - dict containing '_id'
    """

    if isinstance(analysis_id, dict):
        analysis_id = analysis_id.get("_id")

    if isinstance(analysis_id, ObjectId):
        oid = analysis_id
    elif isinstance(analysis_id, str):
        try:
            oid = ObjectId(analysis_id)
        except Exception:
            return None
    else:
        return None

    return analysis_collection.find_one({"_id": oid})