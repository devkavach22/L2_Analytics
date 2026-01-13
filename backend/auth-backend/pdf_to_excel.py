import sys
import os
import json
import pdfplumber
from openpyxl import Workbook

def pdf_to_excel(pdf_file, excel_file):
    try:
        if not os.path.exists(pdf_file):
            return {
                "message": "PDF to Excel conversion failed",
                "files": [
                    {
                        "originalName": os.path.basename(pdf_file),
                        "outputFile": excel_file,
                        "message": "Input PDF not found"
                    }
                ]
            }

        # Create workbook
        wb = Workbook()
        wb.remove(wb.active)  # Remove default sheet

        with pdfplumber.open(pdf_file) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                sheet = wb.create_sheet(title=f"Page_{page_num}")

                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        for row in table:
                            sheet.append([cell if cell else "" for cell in row])
                        sheet.append([""] * (len(table[0]) if table else 10))
                else:
                    text = page.extract_text()
                    if text:
                        for line in text.split("\n"):
                            sheet.append([line])

        # Save Excel file
        wb.save(excel_file)

        return {
            "message": "PDF to Excel conversion completed",
            "files": [
                {
                    "originalName": os.path.basename(pdf_file),
                    "outputFile": os.path.abspath(excel_file),
                    "message": "Conversion successful"
                }
            ]
        }

    except Exception as e:
        # Always return JSON even on error
        return {
            "message": "PDF to Excel conversion failed",
            "files": [
                {
                    "originalName": os.path.basename(pdf_file),
                    "outputFile": os.path.abspath(excel_file),
                    "message": str(e)
                }
            ]
        }


if __name__ == "__main__":
    pdf_file = sys.argv[1]
    excel_file = sys.argv[2]
    result = pdf_to_excel(pdf_file, excel_file)
    print(json.dumps(result, indent=4))
