from typing import Dict, List, Optional
import json
import re
from pydantic import BaseModel, ValidationError
from .llm_loader import load_llm


# ---------------------------
# Output Schemas
# ---------------------------

class ReportSection(BaseModel):
    id: str
    title: str
    description: str


class ReportSchema(BaseModel):
    report_type: str
    sections: List[ReportSection]


# ---------------------------
# Agent
# ---------------------------

class ReportSelectorAgent:
    """
    Decides report type and section structure
    (NotebookLM 'Reports' tab equivalent)
    """

    ALLOWED_TYPES = {
        "executive_summary",
        "technical_report",
        "research_report",
        "study_notes",
    }

    def __init__(self):
        self.llm = load_llm()

    # ---------------------------
    # JSON extractor (CRITICAL)
    # ---------------------------
    def _extract_json(self, text: str) -> dict:
        """
        Extract first valid JSON object from LLM output
        """
        if not text:
            raise ValueError("Empty LLM response")

        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise ValueError("No JSON object found")

        return json.loads(match.group(0))

    # ---------------------------
    # Main
    # ---------------------------
    def run(
        self,
        summary: Dict,
        preferred_type: Optional[str] = None
    ) -> ReportSchema:

        prompt = f"""
You are an expert technical writer.

Document Overview:
{summary.get("overview", "")}

Key Topics:
{summary.get("key_topics", "")}

Important Entities:
{summary.get("important_entities", "")}

User preferred report type (optional):
{preferred_type}

Allowed report types:
- executive_summary
- technical_report
- research_report
- study_notes

STRICT RULES:
- Output ONLY valid JSON
- No markdown
- No explanations
- No extra text

JSON FORMAT:
{{
  "report_type": "string",
  "sections": [
    {{
      "id": "string",
      "title": "string",
      "description": "string"
    }}
  ]
}}
"""

        # ---- LLM CALL ----
        response = self.llm.invoke(prompt)

        content = (
            response.content
            if hasattr(response, "content")
            else str(response)
        )

        # ---- Parse & validate ----
        try:
            data = self._extract_json(content)

            # Normalize report type
            if data.get("report_type") not in self.ALLOWED_TYPES:
                data["report_type"] = (
                    preferred_type
                    if preferred_type in self.ALLOWED_TYPES
                    else "technical_report"
                )

            return ReportSchema(**data)

        except (json.JSONDecodeError, ValidationError, ValueError) as e:
            raise RuntimeError(
                "❌ ReportSelectorAgent failed to produce valid schema\n\n"
                f"RAW OUTPUT:\n{content}"
            ) from e
