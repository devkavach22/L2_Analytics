import os
import pdfkit
from jinja2 import Environment, FileSystemLoader

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')
OUTPUT_DIR = "static/outputs"

env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

def render_html_report(data: dict, report_type: str, user_id: str):
    """
    Renders HTML template and converts to PDF.
    """

    report_lower = report_type.lower()

    # MAPPING: Report Type -> Template
    if "security" in report_lower: 
        template_name = "report_security.html"
    elif "technical" in report_lower or "deep dive" in report_lower: 
        template_name = "report_ai_modern.html"
    elif "market" in report_lower: 
        template_name = "report_finance.html"
    elif "executive" in report_lower: 
        template_name = "report_corporate.html"
    else:
        template_name = "report_corporate.html"

    try:
        template = env.get_template(template_name)
    except Exception:
        template = env.get_template("report_corporate.html")

    # ✅ BUILD REPORT OBJECT (THIS FIXES THE ERROR)
    report = {
        "title": f"{report_type.title()} Report",
        "executive_summary": data.get("summary", "No executive summary provided."),
        "key_findings": data.get("key_findings", []),  # list of {title, severity, description}
        "kpis": data.get("kpis", []),                  # list of {name, value, unit, interpretation}
        "risk_summary": data.get("risks", ""),
        "recommendations": data.get("recommendations", [])
    }

    # Render with correct variable
    html_content = template.render(report=report)

    # Save PDF
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filename = f"{user_id}_{report_type.replace(' ', '_')}.pdf"
    output_path = os.path.join(OUTPUT_DIR, filename)

    try:
        pdfkit.from_string(
            html_content,
            output_path,
            options={"enable-local-file-access": ""}
        )
        return output_path

    except Exception as e:
        print(f"❌ PDF Gen Error: {e}")
        return ""


# import os
# import pdfkit
# from jinja2 import Environment, FileSystemLoader

# TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')
# OUTPUT_DIR = "static/outputs"

# env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# def render_html_report(data: dict, report_type: str, user_id: str):
#     """
#     Renders HTML template and converts to PDF.
#     """
#     report_lower = report_type.lower()
    
#     # MAPPING: Report Type -> Template
#     if "security" in report_lower: 
#         template_name = "report_security.html"
#     elif "technical" in report_lower or "deep dive" in report_lower: 
#         template_name = "report_ai_modern.html" # Use Modern for Tech Deep Dive
#     elif "market" in report_lower: 
#         template_name = "report_finance.html"   # Use Finance for Market Analysis
#     elif "executive" in report_lower: 
#         template_name = "report_corporate.html" # Default Corporate for Exec Summary
#     else:
#         template_name = "report_corporate.html"

#     try:
#         template = env.get_template(template_name)
#     except:
#         template = env.get_template("report_corporate.html")

#     # Safe List Conversion
#     trends_html = "<ul>" + "".join([f"<li>{t}</li>" for t in data.get('trends', [])]) + "</ul>"

#     # Render
#     html_content = template.render(
#         title=f"{report_type.title()} Report",
#         summary=data.get('summary', 'No summary.'),
#         keywords=", ".join(data.get('keywords', [])),
#         trends=trends_html,
#         risks=data.get('risks', ''),
#         sentiment=data.get('sentiment', ''),
#         cognitive=data.get('cognitive', ''),
#         decisions=data.get('decisions', ''),
#         chart_path=data.get('chart_path', '')
#     )

#     # Save
#     os.makedirs(OUTPUT_DIR, exist_ok=True)
#     filename = f"{user_id}_{report_type.replace(' ', '_')}.pdf"
#     output_path = os.path.join(OUTPUT_DIR, filename)

#     try:
#         pdfkit.from_string(html_content, output_path, options={"enable-local-file-access": ""})
#         return output_path
#     except Exception as e:
#         print(f"❌ PDF Gen Error: {e}")
#         return ""


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