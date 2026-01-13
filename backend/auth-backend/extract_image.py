# extract_images.py
import fitz
import sys
import os

if len(sys.argv) < 3:
    print("Usage: extract_images.py input.pdf out_dir")
    sys.exit(1)

pdf_path = sys.argv[1]
out_dir = sys.argv[2]

os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)
img_count = 0

for page_index in range(len(doc)):
    page = doc[page_index]
    images = page.get_images(full=True)

    for img_index, img in enumerate(images):
        xref = img[0]
        base = f"page{page_index+1}_img{img_index+1}.png"
        out_path = os.path.join(out_dir, base)

        pix = fitz.Pixmap(doc, xref)
        pix.save(out_path)
        img_count += 1

print(f"Extracted {img_count} images.")
