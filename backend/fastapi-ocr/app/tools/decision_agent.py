from .llm_loader import load_llm
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

class DecisionAgent:
    def __init__(self):
        self.llm = load_llm()

    def run(self, text: str) -> str:
        template = """
        Based on the document text below, recommend 3 actionable next steps or decisions.
        Format as a bulleted list.

        TEXT:
        {text}

        RECOMMENDATIONS:
        """
        
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            return chain.invoke({"text": text})
        except:
            return "No specific decisions generated."