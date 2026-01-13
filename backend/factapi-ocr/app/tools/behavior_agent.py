from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .llm_loader import load_llm

class BehavioralPatternAgent:
    """
    Identifies behavioral or textual patterns.
    """

    def __init__(self):
        self.llm = load_llm()
        self.prompt = PromptTemplate.from_template(
            """
Analyze the document for behavioral or structural patterns.

Look for:
- Repetition
- Escalation
- Emotional shifts
- Procedural signals
- Intent indicators

Present as clear findings.

DOCUMENT:
{content}
"""
        )

    def run(self, text: str):
        indicators = []
        t = text.lower()

        if "repeat" in t or "multiple times" in t:
            indicators.append("Repeated behavioral patterns detected")

        if "threat" in t or "warning" in t:
            indicators.append("Threat-related language identified")

        if "avoid" in t or "escape" in t:
            indicators.append("Evasive behavior indicators present")

        return indicators