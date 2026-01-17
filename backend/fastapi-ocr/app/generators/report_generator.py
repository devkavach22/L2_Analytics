import os
import pdfkit
from jinja2 import Environment, FileSystemLoader, Template
from datetime import datetime

# -----------------------------
# Directories
# -----------------------------
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
OUTPUT_DIR = "static/reports"
os.makedirs(TEMPLATE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

env = Environment(loader=FileSystemLoader(TEMPLATE_DIR), autoescape=True)

# -----------------------------
# Helpers
# -----------------------------
def safe_get(d, key, default=""):
    if not isinstance(d, dict):
        return default
    val = d.get(key, default)
    return default if val in [None, "", [], {}] else val


def normalize_text(val, default="Not Available"):
    if isinstance(val, dict):
        return "<br/>".join(f"<b>{k}:</b> {v}" for k, v in val.items())
    if isinstance(val, list):
        return ", ".join(map(str, val)) if val else default
    return str(val) if val else default


def format_list(item_list):
    if isinstance(item_list, dict):
        return "".join(
            f"<li><b>{k}:</b> {', '.join(v) if isinstance(v, list) else v}</li>"
            for k, v in item_list.items()
        )
    if isinstance(item_list, list) and item_list:
        return "".join(f"<li>{str(i)}</li>" for i in item_list)
    return "<li>Not Available</li>"

# -----------------------------
# Main Render Function
# -----------------------------
def render_html_report(data, report_type, user_id):
    """
    Renders a professional structured HTML report and converts it to PDF.
    Supports both OLD and NEW agent payload formats.
    """

    template_name = "report_professional.html"

    try:
        template = env.get_template(template_name)
    except Exception:
        template = Template("""
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{{ report.title }}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 35px; color:#222; }
                h1 { font-size: 30px; }
                h2 { margin-top: 28px; border-bottom: 2px solid #eee; padding-bottom: 4px; }
                table { width:100%; border-collapse: collapse; margin-top:10px; }
                th, td { border:1px solid #ccc; padding:8px; text-align:left; }
                th { background:#f5f5f5; }
                ul { margin-left:18px; }
            </style>
        </head>
        <body>

        <h1>{{ report.title }}</h1>
        <p><b>Date:</b> {{ report.date }}</p>
        <p><b>Source Document:</b> {{ report.source }}</p>

        <h2>Executive Summary</h2>
        <p>{{ report.summary }}</p>

        <h2>Key Findings</h2>
        <ul>
            {{ report.entities_html | safe }}
        </ul>

        <h2>Risk Analysis</h2>
        <p>{{ report.risk }}</p>

        <h2>Sentiment Analysis</h2>
        <p>{{ report.sentiment }}</p>

        <h2>Recommendations</h2>
        <ul>
            {{ report.recommendations_html | safe }}
        </ul>

        </body>
        </html>
        """)

    # -----------------------------
    # Normalize incoming payload
    # -----------------------------
    if not isinstance(data, dict):
        data = {}

    report = {
        "title": safe_get(data, "title", "Executive Report"),
        "date": safe_get(data, "date", datetime.now().strftime("%Y-%m-%d %H:%M")),
        "source": safe_get(data, "source_document", "OCR File"),
        "summary": normalize_text(
            safe_get(data, "executive_summary", safe_get(data, "summary"))
        ),
        "entities_html": format_list(
            safe_get(
                data,
                "entities",
                safe_get(safe_get(data, "key_findings", {}), "Detected Entities", {})
            )
        ),
        "risk": normalize_text(safe_get(data, "risk_analysis", safe_get(data, "risk"))),
        "sentiment": normalize_text(
            safe_get(data, "sentiment_analysis", safe_get(data, "sentiment"))
        ),
        "recommendations_html": format_list(
            safe_get(data, "recommendations", [])
        )
    }

    # -----------------------------
    # Render HTML
    # -----------------------------
    html = template.render(report=report)

    safe_report_type = report_type.replace(" ", "_").lower()
    path = os.path.join(OUTPUT_DIR, f"{user_id}_{safe_report_type}.pdf")

    options = {
        "enable-local-file-access": "",
        "encoding": "UTF-8",
        "no-outline": None,
        "page-size": "A4",
        "margin-top": "15mm",
        "margin-bottom": "15mm",
        "margin-left": "15mm",
        "margin-right": "15mm",
    }

    try:
        pdfkit.from_string(html, path, options=options)
        return path
    except Exception as e:
        print("❌ PDF generation failed:", e)
        return None

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