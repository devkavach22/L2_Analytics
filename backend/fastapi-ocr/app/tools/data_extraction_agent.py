from .llm_loader import load_llm
import json
import re

class DataExtractionAgent:
    def __init__(self):
        self.llm = load_llm()

    def run(self, text: str, focus: str = "General") -> dict:
        prompt = f"""
        You are a Data Analyst.
        Extract numerical data from the text below relevant to: "{focus}".
        
        Return ONLY valid JSON. No markdown formatting.
        Format:
        {{
            "title": "Chart Title",
            "labels": ["Label1", "Label2"],
            "values": [10, 20]
        }}
        
        Text:
        {text[:5000]}
        """
        
        try:
            response = self.llm.invoke(prompt)
            # Clean response (remove markdown ```json ... ```)
            content = response.content if hasattr(response, 'content') else str(response)
            cleaned = re.sub(r"```json|```", "", content).strip()
            
            return json.loads(cleaned)
        except Exception as e:
            print(f"Data Extractor Error: {e}")
            return {"values": []}