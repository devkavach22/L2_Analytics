# debug_db.py
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("MONGO_DB_NAME")
COLL_NAME = os.getenv("OCR_COLLECTION", "ocrrecords") # Default to ocrrecords

print(f"--- CONNECTING TO: {DB_NAME} / {COLL_NAME} ---")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
collection = db[COLL_NAME]

# 1. Count Total Docs
count = collection.count_documents({})
print(f"Total Documents in Collection: {count}")

if count == 0:
    print("❌ COLLECTION IS EMPTY! Check if Node.js is writing to the same Database Name.")
    exit()

# 2. Print Sample Data
print("\n--- SAMPLE DOCUMENT ---")
sample = collection.find_one()
print(sample)

# 3. Check User ID Format
user_id_field = "userId" if "userId" in sample else "user_id"
uid_value = sample.get(user_id_field)
print(f"\nUser Field Name detected: '{user_id_field}'")
print(f"User ID Value: {uid_value}")
print(f"User ID Type: {type(uid_value)}")