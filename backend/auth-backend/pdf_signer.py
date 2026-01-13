import sys
import fitz  # PyMuPDF
from PIL import Image
import io

def place_signature(page, signature_image, position, scale):
    # Convert PIL image to PNG bytes using BytesIO (safe, no PNG encoder needed)
    img_buffer = io.BytesIO()
    signature_image.save(img_buffer, format="PNG")
    img_bytes = img_buffer.getvalue()

    img_width, img_height = signature_image.size

    # Apply scale
    img_width *= scale
    img_height *= scale

    rect = page.rect

    if position == "bottom-right":
        x = rect.width - img_width - 20
        y = rect.height - img_height - 20
    elif position == "bottom-left":
        x = 20
        y = rect.height - img_height - 20
    elif position == "top-right":
        x = rect.width - img_width - 20
        y = 20
    elif position == "top-left":
        x = 20
        y = 20
    else:
        raise ValueError("Invalid position: " + position)

    page.insert_image(
        fitz.Rect(x, y, x + img_width, y + img_height),
        stream=img_bytes
    )


def main():
    if len(sys.argv) < 7:
        print("Usage: pdf_signer.py <input_pdf> <signature_img> <output_pdf> <page=all|number> <position> <scale>")
        sys.exit(1)

    input_pdf = sys.argv[1]
    signature_path = sys.argv[2]
    output_pdf = sys.argv[3]
    page_arg = sys.argv[4]        # "all" or page number
    position = sys.argv[5]
    scale = float(sys.argv[6])

    # Load signature
    signature_image = Image.open(signature_path).convert("RGBA")

    # Load input PDF
    pdf = fitz.open(input_pdf)

    if page_arg == "all":
        pages = range(len(pdf))
    else:
        pages = [int(page_arg) - 1]

    for page_num in pages:
        page = pdf[page_num]
        place_signature(page, signature_image, position, scale)

    pdf.save(output_pdf)
    pdf.close()

    print("PDF signed successfully:", output_pdf)


if __name__ == "__main__":
    main()
