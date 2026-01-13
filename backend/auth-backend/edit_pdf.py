import sys
import json
import io
import os
import uuid
import base64
import requests
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color


def save_temp_image(src):
    temp_name = f"temp_img_{uuid.uuid4().hex}.png"

    # Base64 images
    if src.startswith("data:image"):
        header, b64data = src.split(",", 1)
        img_bytes = base64.b64decode(b64data)
        with open(temp_name, "wb") as f:
            f.write(img_bytes)
        return temp_name

    # Remote images
    if src.startswith("http://") or src.startswith("https://"):
        response = requests.get(src, headers={"User-Agent": "Mozilla/5.0"})
        if response.status_code != 200:
            raise Exception(f"Cannot download image: HTTP {response.status_code}")

        img_bytes = response.content
        with open(temp_name, "wb") as f:
            f.write(img_bytes)
        return temp_name

    # Local paths
    if os.path.exists(src):
        return src

    raise Exception(f"Invalid or unsupported image source: {src}")


def apply_edits(input_pdf, edits, output_pdf):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()
    temp_files = []

    for page_index, page in enumerate(reader.pages):

        # get actual PDF page size instead of letter
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)

        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=(page_width, page_height))

        drew_something = False  # track if edits exist

        for edit in edits:
            if edit.get("pageIndex", 0) != page_index:
                continue

            drew_something = True
            x, y = edit.get("x", 0), edit.get("y", 0)

            # TEXT
            if edit["type"] == "text":
                size = edit.get("size", 14)
                color = edit.get("color", {"r": 0, "g": 0, "b": 0})
                can.setFillColor(Color(color["r"], color["g"], color["b"]))
                can.setFont("Helvetica", size)
                can.drawString(x, y, edit["value"])

            # SIGNATURE as text
            elif edit["type"] == "signature" and "value" in edit:
                size = edit.get("size", 24)
                can.setFont("Helvetica", size)
                can.drawString(x, y, edit["value"])

            # IMAGE / SIGNATURE IMAGE
            elif edit["type"] in ["image", "signature"] and "src" in edit:
                try:
                    temp_img = save_temp_image(edit["src"])
                    temp_files.append(temp_img)
                    can.drawImage(
                        temp_img,
                        x,
                        y,
                        width=edit.get("width", 120),
                        height=edit.get("height", 50)
                    )
                except Exception as e:
                    raise Exception(f"Image load failed: {str(e)}")

        # ensure at least one page exists
        can.showPage()
        can.save()

        packet.seek(0)
        overlay_pdf = PdfReader(packet)

        # SAFETY: if overlay has 0 pages → skip merge
        if len(overlay_pdf.pages) == 0:
            writer.add_page(page)
            continue

        overlay_page = overlay_pdf.pages[0]
        page.merge_page(overlay_page)
        writer.add_page(page)

    # write final file
    with open(output_pdf, "wb") as f:
        writer.write(f)

    # cleanup temp files
    for tf in temp_files:
        if os.path.exists(tf):
            os.remove(tf)

    return True


if __name__ == "__main__":
    input_pdf = sys.argv[1]
    edits = json.loads(sys.argv[2])
    output_pdf = sys.argv[3]
    apply_edits(input_pdf, edits, output_pdf)
    print("PDF editing completed")
