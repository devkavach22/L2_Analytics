from .llm_loader import load_llm
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

class KeywordAgent:
    def __init__(self):
        self.llm = load_llm()

    def run(self, text: str) -> list:
        if not text: return []

        template = """
        Identify the top 5 distinct keywords, entities, or topics in this text.
        Return ONLY a comma-separated list (e.g. "Finance, Audit, Q3 Report").
        
        TEXT:
        {text}
        
        KEYWORDS:
        """
        
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            result = chain.invoke({"text": text})
            # Robust splitting
            return [k.strip() for k in result.split(',') if k.strip()]
        except:
            return []