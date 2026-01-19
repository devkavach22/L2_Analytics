from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .llm_loader import load_llm

class RecommendationAgent:
    """
    Produces actionable recommendations.
    """

    def __init__(self):
        self.llm = load_llm()
        self.prompt = PromptTemplate.from_template(
            """
Based on the document, provide actionable recommendations.

Include:
- Immediate actions
- Monitoring steps
- Strategic considerations

Be concise and practical.

DOCUMENT:
{content}
"""
        )

    def run(self, risk_level: str):
        if risk_level == "High":
            return [
                "Immediate monitoring recommended",
                "Escalate to senior authorities",
                "Initiate preventive measures"
            ]
        if risk_level == "Medium":
            return [
                "Increase surveillance",
                "Periodic review advised"
            ]
        return [
            "No immediate action required",
            "Archive for record"
        ]