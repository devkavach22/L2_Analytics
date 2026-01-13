from bson import ObjectId
from .llm_loader import load_llm
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

class CollectionAnalyzer:
    def __init__(self, db_collection):
        self.collection = db_collection
        self.llm = load_llm()

    def analyze_structure(self, user_id: str):
        # 1. Flexible Query
        possible_ids = [user_id]
        if ObjectId.is_valid(user_id):
            possible_ids.append(ObjectId(user_id))

        query = {"$or": [{"userId": {"$in": possible_ids}}, {"user_id": {"$in": possible_ids}}]}

        # 2. Get Stats
        doc_count = self.collection.count_documents(query)
        if doc_count == 0:
            return {"total_docs": 0, "context_desc": "No historical data.", "file_types": []}

        # 3. Sample Data
        samples = list(self.collection.find(query).limit(3))
        sample_text = "\n".join([d.get("extractedText", "")[:200] for d in samples])
        
        # 4. LLM Analysis (Safe String Return)
        try:
            template = """
            Analyze these document snippets and describe the collection in 5 words (e.g., "Financial Statements and Invoices").
            
            SNIPPETS:
            {text}
            
            DESCRIPTION:
            """
            prompt = PromptTemplate.from_template(template)
            chain = prompt | self.llm | StrOutputParser()
            
            context_desc = chain.invoke({"text": sample_text})
        except Exception as e:
            context_desc = "General Document Collection"

        return {
            "total_docs": doc_count, 
            "context_desc": context_desc.strip(),
            "file_types": list(set(d.get('fileName', '').split('.')[-1] for d in samples))
        }