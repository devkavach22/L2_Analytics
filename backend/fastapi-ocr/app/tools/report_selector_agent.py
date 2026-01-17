from typing import Dict, List, Optional
import json
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

    def __init__(self):
        self.llm = load_llm()

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

Your task:
1. Decide the most suitable report type.
2. Define clear report sections.
3. Each section must be useful and non-overlapping.

Allowed report types:
- executive_summary
- technical_report
- research_report
- study_notes

IMPORTANT RULES:
- Respond with ONLY valid JSON
- No markdown
- No explanations
- No trailing text

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

        # ---- Extract text safely ----
        content = response.content if hasattr(response, "content") else str(response)

        # ---- Parse JSON ----
        try:
            data = json.loads(content)
            return ReportSchema(**data)
        except json.JSONDecodeError as e:
            raise RuntimeError(
                f"ReportSelectorAgent returned invalid JSON:\n{content}"
            ) from e
        except ValidationError as e:
            raise RuntimeError(
                f"ReportSelectorAgent JSON schema mismatch:\n{content}"
            ) from e
