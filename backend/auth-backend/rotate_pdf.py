import sys
import json
from PyPDF2 import PdfReader, PdfWriter

# Arguments from Node:
# 1 = input PDF path
# 2 = output PDF path
# 3 = JSON ranges string

input_path = sys.argv[1]
output_path = sys.argv[2]
ranges_json = sys.argv[3]

ranges = json.loads(ranges_json)

reader = PdfReader(input_path)
writer = PdfWriter()

total_pages = len(reader.pages)

def rotate_page(page, rotation):
    page.rotate(rotation)
    return page

for i in range(total_pages):
    page = reader.pages[i]

    # Check all ranges
    for r in ranges:
        start = r["from"] - 1
        end = r["to"] - 1
        rotation = r["rotation"]

        if start <= i <= end:
            page = rotate_page(page, rotation)

    writer.add_page(page)

with open(output_path, "wb") as f:
    writer.write(f)

print("Rotation completed successfully.")
