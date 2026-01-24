import re

MIN_OCR_LENGTH = 50

def clean_ocr_text(text: str) -> str:
    if not text:
        return ""

    # normalize whitespace
    text = re.sub(r"\s+", " ", text)

    # remove garbage chars
    text = re.sub(r"[^\x00-\x7F]+", " ", text)

    return text.strip()


def is_valid_ocr(text: str) -> bool:
    if not text:
        return False
    return len(text.strip()) >= MIN_OCR_LENGTH
