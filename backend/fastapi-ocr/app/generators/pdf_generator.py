# generators/pdf_generator.py
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import os

def create_pdf(text_content: str, filepath: str):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    styles = getSampleStyleSheet()
    story = []
    for line in text_content.splitlines():
        line = line.strip()
        if not line:
            story.append(Spacer(1,6))
            continue
        if line.endswith(":") or line.isupper():
            story.append(Paragraph(f"<b>{line.replace(':','')}</b>", styles["Heading2"]))
        else:
            story.append(Paragraph(line, styles["BodyText"]))
        story.append(Spacer(1,6))
    doc = SimpleDocTemplate(filepath, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    doc.build(story)
    return filepath
