from .llm_loader import load_llm
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

class SummarizerAgent:
    def __init__(self):
        self.llm = load_llm()

    def run(self, text: str) -> str:
        if not text: return "No text provided for summary."

        # Template defines the strict output format
        template = """
        You are an expert analyst. Summarize the following text efficiently.
        
        TEXT:
        {text}
        
        SUMMARY (3-4 sentences):
        """
        
        prompt = PromptTemplate.from_template(template)
        
        # PIPE SYNTAX: Prompt -> LLM -> String Cleaner
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            return chain.invoke({"text": text})
        except Exception as e:
            return f"Summary Error: {str(e)}"