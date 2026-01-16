from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .llm_loader import load_llm
import re

class EntityExtractionAgent:
    """
    Extracts named entities for intelligence context.
    """

    def __init__(self):
        self.llm = load_llm()
        self.prompt = PromptTemplate.from_template(
            """
Extract key entities from the document.

Identify:
- Persons
- Organizations
- Locations
- Dates
- Identifiers (IDs, case numbers)

Return as short bullet-like sentences.

DOCUMENT:
{content}
"""
        )

    def run(self, text: str):
        persons = set(re.findall(r"\b[A-Z][a-z]+ [A-Z][a-z]+\b", text))
        locations = set(re.findall(r"\b[A-Z][a-z]+(?: City| Nagar| Street)\b", text))
        return {
            "persons": list(persons),
            "locations": list(locations)
        }
