import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
import pdfkit

BASE_DIR = os.path.dirname(__file__)
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
OUTPUT_DIR = os.path.join("static", "reports")

os.makedirs(OUTPUT_DIR, exist_ok=True)

env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


# --------------------------------------------------
# SANITIZER (CRITICAL – PREVENT OCR GARBAGE)
# --------------------------------------------------
def clean_section(text):
    if not text:
        return ""

    lines = text.splitlines()
    clean_lines = []

    for line in lines:
        line = line.strip()

        # Drop OCR junk
        if len(line) < 3:
            continue
        if line.count(":") > 5:
            continue
        if "Delhi Police - Criminal Dossier System" in line:
            continue

        clean_lines.append(line)

    return "\n".join(clean_lines)


# --------------------------------------------------
# MAIN RENDER FUNCTION
# --------------------------------------------------
def render_html_report(report_data: dict, report_name: str, user_id: str):
    template = env.get_template("professional_report.html")

    structured_sections = [
        ("Executive Summary", report_data.get("executive_summary")),
        ("Case Background", report_data.get("case_background")),
        ("Document Analysis", report_data.get("document_analysis")),
        ("Behavioral Analysis", report_data.get("behavior_analysis")),
        ("Cognitive Analysis", report_data.get("cognitive_analysis")),
        ("Risk Assessment", report_data.get("risk_analysis")),
        ("Sentiment Analysis", report_data.get("sentiment_analysis")),
        ("Decision Analysis", report_data.get("decision_analysis")),
        ("Trend Analysis", report_data.get("trend_analysis")),
        ("Key Entities", report_data.get("entities")),
        ("Recommendations", report_data.get("recommendations")),
        ("Final Summary", report_data.get("final_summary")),
    ]

    sections = []
    for title, content in structured_sections:
        cleaned = clean_section(str(content))
        if cleaned:
            sections.append({
                "title": title,
                "content": cleaned
            })

    html = template.render(
        title=report_data.get("title", "Intelligence Report"),
        created_on=report_data.get("created_on", datetime.utcnow().strftime("%Y-%m-%d")),
        created_by=report_data.get("created_by", "AI Intelligence Engine"),
        sections=sections
    )

    html_path = os.path.join(OUTPUT_DIR, f"{user_id}_{report_name}.html")
    pdf_path = html_path.replace(".html", ".pdf")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    pdfkit.from_file(
        html_path,
        pdf_path,
        options={
            "page-size": "A4",
            "margin-top": "20mm",
            "margin-bottom": "20mm",
            "margin-left": "15mm",
            "margin-right": "15mm",
            "encoding": "UTF-8",
        }
    )

    return pdf_path

# import os, pdfkit
# from jinja2 import Environment, FileSystemLoader

# TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
# OUTPUT_DIR = "static/outputs"
# env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


# def safe_get(d, key, default=""):
#     """
#     Safely get value from dict.
#     Returns default if key not found or value is None.
#     """
#     if not isinstance(d, dict):
#         return default
#     return d.get(key, default)


# def render_html_report(data, report_type, user_id):
#     template = env.get_template("report_corporate.html")

#     # Ensure data is always a dictionary
#     if not isinstance(data, dict):
#         data = {}

#     profile = safe_get(data, "profile", {})

#     report = {
#         # Top level fields
#         "title": safe_get(data, "title", "Investigation Report"),
#         "summary": safe_get(data, "summary", "No summary available."),

#         # Profile fields
#         "name": safe_get(profile, "name", "Unknown"),
#         "aliases": safe_get(profile, "aliases", []),
#         "fir_numbers": safe_get(profile, "fir_numbers", []),
#         "sections": safe_get(profile, "sections", []),
#         "locations": safe_get(profile, "locations", []),

#         # Other analysis fields
#         "risk": safe_get(data, "risk", "Not Assessed"),
#         "sentiment": safe_get(data, "sentiment", "Neutral"),
#         "recommendations": safe_get(data, "recommendations", [])
#     }

#     html = template.render(report=report)

#     os.makedirs(OUTPUT_DIR, exist_ok=True)

#     safe_report_type = report_type.replace(" ", "_")
#     path = os.path.join(OUTPUT_DIR, f"{user_id}_{safe_report_type}.pdf")

#     pdfkit.from_string(
#         html,
#         path,
#         options={
#             "enable-local-file-access": ""
#         }
#     )

#     return path


# # import os
# # import pdfkit
# # from jinja2 import Environment, FileSystemLoader

# # TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')
# # OUTPUT_DIR = "static/outputs"

# # env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# # def render_html_report(data: dict, report_type: str, user_id: str):
# #     """
# #     Renders HTML template and converts to PDF.
# #     """
# #     report_lower = report_type.lower()
    
# #     # MAPPING: Report Type -> Template
# #     if "security" in report_lower: 
# #         template_name = "report_security.html"
# #     elif "technical" in report_lower or "deep dive" in report_lower: 
# #         template_name = "report_ai_modern.html" # Use Modern for Tech Deep Dive
# #     elif "market" in report_lower: 
# #         template_name = "report_finance.html"   # Use Finance for Market Analysis
# #     elif "executive" in report_lower: 
# #         template_name = "report_corporate.html" # Default Corporate for Exec Summary
# #     else:
# #         template_name = "report_corporate.html"

# #     try:
# #         template = env.get_template(template_name)
# #     except:
# #         template = env.get_template("report_corporate.html")

# #     # Safe List Conversion
# #     trends_html = "<ul>" + "".join([f"<li>{t}</li>" for t in data.get('trends', [])]) + "</ul>"

# #     # Render
# #     html_content = template.render(
# #         title=f"{report_type.title()} Report",
# #         summary=data.get('summary', 'No summary.'),
# #         keywords=", ".join(data.get('keywords', [])),
# #         trends=trends_html,
# #         risks=data.get('risks', ''),
# #         sentiment=data.get('sentiment', ''),
# #         cognitive=data.get('cognitive', ''),
# #         decisions=data.get('decisions', ''),
# #         chart_path=data.get('chart_path', '')
# #     )

# #     # Save
# #     os.makedirs(OUTPUT_DIR, exist_ok=True)
# #     filename = f"{user_id}_{report_type.replace(' ', '_')}.pdf"
# #     output_path = os.path.join(OUTPUT_DIR, filename)

# #     try:
# #         pdfkit.from_string(html_content, output_path, options={"enable-local-file-access": ""})
# #         return output_path
# #     except Exception as e:
# #         print(f"❌ PDF Gen Error: {e}")
# #         return ""


# # # import os
# # # import pdfkit
# # # from jinja2 import Environment, FileSystemLoader

# # # TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')
# # # OUTPUT_DIR = "static/outputs"

# # # env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# # # def render_html_report(data: dict, report_type: str, user_id: str):
# # #     """
# # #     Renders HTML template and converts to PDF.
# # #     """
# # #     report_lower = report_type.lower()
    
# # #     # MAPPING: Report Type -> Template
# # #     if "security" in report_lower: 
# # #         template_name = "report_security.html"
# # #     elif "technical" in report_lower or "deep dive" in report_lower: 
# # #         template_name = "report_ai_modern.html" # Use Modern for Tech Deep Dive
# # #     elif "market" in report_lower: 
# # #         template_name = "report_finance.html"   # Use Finance for Market Analysis
# # #     elif "executive" in report_lower: 
# # #         template_name = "report_corporate.html" # Default Corporate for Exec Summary
# # #     else:
# # #         template_name = "report_corporate.html"

# # #     try:
# # #         template = env.get_template(template_name)
# # #     except:
# # #         template = env.get_template("report_corporate.html")

# # #     # Safe List Conversion
# # #     trends_html = "<ul>" + "".join([f"<li>{t}</li>" for t in data.get('trends', [])]) + "</ul>"

# # #     # Render
# # #     html_content = template.render(
# # #         title=f"{report_type.title()} Report",
# # #         summary=data.get('summary', 'No summary.'),
# # #         keywords=", ".join(data.get('keywords', [])),
# # #         trends=trends_html,
# # #         risks=data.get('risks', ''),
# # #         sentiment=data.get('sentiment', ''),
# # #         cognitive=data.get('cognitive', ''),
# # #         decisions=data.get('decisions', ''),
# # #         chart_path=data.get('chart_path', '')
# # #     )

# # #     # Save
# # #     os.makedirs(OUTPUT_DIR, exist_ok=True)
# # #     filename = f"{user_id}_{report_type.replace(' ', '_')}.pdf"
# # #     output_path = os.path.join(OUTPUT_DIR, filename)

# # #     try:
# # #         pdfkit.from_string(html_content, output_path, options={"enable-local-file-access": ""})
# # #         return output_path
# # #     except Exception as e:
# # #         print(f"❌ PDF Gen Error: {e}")
# # #         return ""