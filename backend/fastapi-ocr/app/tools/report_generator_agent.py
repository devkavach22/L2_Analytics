from typing import Dict
from datetime import datetime
from .llm_loader import load_llm
from src.vector_store import VectorStoreManager
from app.generators.report_generator import render_html_report


class ReportGeneratorAgent:
    """
    NotebookLM-style section-wise report generator
    grounded strictly on retrieved context
    """

    def __init__(self):
        self.llm = load_llm()

    def _generate_section(
        self,
        context_id: str,
        section_title: str,
        section_description: str
    ) -> str:

        manager = VectorStoreManager(context_id)

        if not manager.load_vector_store():
            raise RuntimeError("Vector store not found for report generation")

        retriever = manager.get_retriever()

        # ✅ New LangChain-safe retrieval
        docs = retriever.invoke(
            f"{section_title}: {section_description}"
        )

        context = "\n\n".join(d.page_content for d in docs)

        prompt = f"""
You are writing a factual report section.

Section Title:
{section_title}

Section Purpose:
{section_description}

Context:
{context}

Rules:
- Use ONLY the provided context
- No assumptions
- No hallucinations
- Professional, neutral tone
"""

        response = self.llm.invoke(prompt)

        # ✅ Extract text safely
        return response.content if hasattr(response, "content") else str(response)

    def run(
        self,
        doc_id: str,
        report_schema,
        output_dir: str = "generated_reports"
    ) -> Dict:

        sections_output = []

        for section in report_schema.sections:
            content = self._generate_section(
                context_id=doc_id,
                section_title=section.title,
                section_description=section.description
            )

            sections_output.append({
                "id": section.id,
                "title": section.title,
                "content": content
            })

        full_report = "\n\n".join(
            f"{s['title']}\n{'-' * len(s['title'])}\n{s['content']}"
            for s in sections_output
        )

        filename = (
            f"{doc_id}_"
            f"{report_schema.report_type}_"
            f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.html"
        )

        # ✅ Correct call signature
        render_html_report(
            content=full_report,
            filename=filename,
            report_type=report_schema.report_type
        )

        return {
            "doc_id": doc_id,
            "report_type": report_schema.report_type,
            "sections": sections_output,
            "file_name": filename,
            "created_at": datetime.utcnow().isoformat()
        }
