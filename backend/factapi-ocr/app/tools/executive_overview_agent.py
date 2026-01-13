from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .llm_loader import load_llm

class ExecutiveOverviewAgent:
    """
    Produces a senior-officer level executive overview.
    """

    def __init__(self):
        self.llm = load_llm()
        self.prompt = PromptTemplate.from_template(
            """
You are an intelligence analyst.

Write a professional executive overview based on the document below.
Focus on:
- Overall purpose
- Context
- High-level implications

Avoid bullet points.
Write 3–4 concise paragraphs.

DOCUMENT:
{content}
"""
        )

    def run(self, text: str) -> str:
        paragraphs = text.split("\n")
        key = paragraphs[:3]
        return " ".join(p.strip() for p in key if len(p.strip()) > 40)
    # def run(self, text: str) -> str:
    #     chain = self.prompt | self.llm | StrOutputParser()
    #     return chain.invoke({"content": text[:6000]})
