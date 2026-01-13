from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .llm_loader import load_llm

class CaseBackgroundAgent:
    """
    Reconstructs background/context of the case or document.
    """

    def __init__(self):
        self.llm = load_llm()
        self.prompt = PromptTemplate.from_template(
            """
You are reconstructing the background of a case from text.

Explain:
- Who is involved
- What is happening
- When / where (if available)
- Why this document exists

Use factual tone.
No assumptions.

DOCUMENT:
{content}
"""
        )

    def run(self, text: str) -> str:
        lines = text.split("\n")
        background = [
            l for l in lines
            if any(k in l.lower() for k in ["date", "location", "incident", "case"])
        ]
        return " ".join(background[:6])
