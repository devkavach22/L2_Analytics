from .llm_loader import load_llm
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

class TrendAgent:
    def __init__(self):
        self.llm = load_llm()

    def run(self, text: str) -> list:
        if not text or len(text) < 50: 
            return []

        template = """
        Analyze the text below and identify 3 distinct trends or patterns (e.g., "Increasing costs", "Frequent delays").
        Return ONLY a comma-separated list.

        TEXT:
        {text}

        TRENDS:
        """
        
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            result = chain.invoke({"text": text})
            # Clean string and convert to list
            return [t.strip() for t in result.split(',') if t.strip()]
        except:
            return []