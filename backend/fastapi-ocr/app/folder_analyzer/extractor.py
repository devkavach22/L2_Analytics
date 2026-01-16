import pandas as pd
from PyPDF2 import PdfReader

def extract_content(file):
    ext = file["ext"]
    path = file["path"]

    analysis = {
        "text_length": 0,
        "pages": 0,
        "rows": 0
    }

    try:
        if ext == "pdf":
            reader = PdfReader(path)
            pages = len(reader.pages)

            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""

            analysis["pages"] = int(pages)
            analysis["text_length"] = int(len(text))

        elif ext == "xlsx":
            df = pd.read_excel(path)

            rows = int(len(df))
            text_length = int(
                df.astype(str)
                .apply(" ".join, axis=1)
                .str.len()
                .sum()
            )

            analysis["rows"] = rows
            analysis["text_length"] = text_length

        elif ext in ["txt", "md"]:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

            analysis["text_length"] = int(len(text))

    except Exception as e:
        print(f"❌ Extraction failed for {path}: {e}")

    return analysis
