import os
import re
from typing import Dict, Tuple
from datetime import datetime

from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

from src.vector_store import VectorStoreManager
from .nlp_pipeline import clean_text, perform_ner
from .tools.llm_loader import load_llm

# ---------------------------
# AGENTS
# ---------------------------
from .tools.behavior_agent import BehavioralPatternAgent
from .tools.case_background_agent import CaseBackgroundAgent
from .tools.document_analyzer import DocumentAnalyzerAgent
from .tools.entity_agent import EntityExtractionAgent
from .tools.executive_overview_agent import ExecutiveOverviewAgent
from .tools.recommendation_agent import RecommendationAgent

from .tools.cognitive_analysis import CognitiveAnalysisAgent
from .tools.decision_agent import DecisionAgent
from .tools.keyword_agent import KeywordAgent
from .tools.risk_analysis_agent import RiskAnalysisAgent
from .tools.sentiment_agent import SentimentAnalysisAgent
from .tools.summarizer_agent import SummarizerAgent
from .tools.trend_agent import TrendAnalysisAgent

from .generators.report_generator import render_html_report

load_dotenv()


class AgenticReportPipeline:
    def __init__(self, stream_callback=None):
        self.stream_callback = stream_callback

        self.client = MongoClient(os.getenv("MONGO_URL"))
        self.db = self.client[os.getenv("MONGO_DB_NAME")]
        self.collection = self.db["ocrrecords"]

        self.llm = load_llm()

        # ---------------------------
        # AGENT INITIALIZATION
        # ---------------------------
        self.executive_agent = ExecutiveOverviewAgent()
        self.case_background_agent = CaseBackgroundAgent()
        self.document_analyzer = DocumentAnalyzerAgent()
        self.behavior_agent = BehavioralPatternAgent()
        self.cognitive_agent = CognitiveAnalysisAgent()
        self.decision_agent = DecisionAgent()
        self.risk_agent = RiskAnalysisAgent()
        self.sentiment_agent = SentimentAnalysisAgent()
        self.trend_agent = TrendAnalysisAgent()
        self.keyword_agent = KeywordAgent()
        self.entity_agent = EntityExtractionAgent()
        self.recommendation_agent = RecommendationAgent()
        self.summarizer_agent = SummarizerAgent()

        self.reports_dir = os.path.join("static", "reports")
        os.makedirs(self.reports_dir, exist_ok=True)

    # --------------------------------------------------
    # STREAM HELPER
    # --------------------------------------------------
    def _stream(self, event: str, data):
        if self.stream_callback:
            self.stream_callback(event, data)

    # --------------------------------------------------
    def _user_query(self, user_id):
        try:
            return {"$in": [user_id, ObjectId(user_id)]}
        except Exception:
            return user_id

    # --------------------------------------------------
    def _safe_collection_name(self, name: str) -> str:
        safe = re.sub(r"[^a-zA-Z0-9._-]", "_", str(name))
        return safe.strip("_")[:120]

    # --------------------------------------------------
    # RAG (VECTOR RETRIEVAL ONLY — MATCHES VectorStoreManager)
    # --------------------------------------------------
    def _build_rag_context(self, text: str, filename: str) -> Tuple[str, Dict]:
        self._stream("status", "📦 Preparing contextual knowledge")

        vs = VectorStoreManager(self._safe_collection_name(filename or "document"))

        if not vs.load_vector_store():
            self._stream("status", "📚 Creating vector embeddings")
            vs.create_vector_store(text)

        self._stream("status", "🔍 Retrieving relevant document sections")

        retriever = vs.get_retriever(k=4)
        docs = retriever.get_relevant_documents(
            "key facts, entities, risks, behavior, conclusions"
        )

        chunks = [doc.page_content for doc in docs]
        combined_context = "\n\n".join(chunks)

        entities = perform_ner(text[:4000])
        self._stream(
            "status",
            f"🧠 Extracted {sum(len(v) for v in entities.values())} named entities"
        )

        return combined_context, entities

    # --------------------------------------------------
    # AGENT EXECUTION WITH LIVE STREAMING
    # --------------------------------------------------
    def _run_agent(self, agent_name: str, agent, context: str):
        self._stream("agent_start", agent_name)

        try:
            result = agent.run(context) if hasattr(agent, "run") else agent.analyze_document(context)

            if isinstance(result, str):
                for block in result.split("\n\n"):
                    self._stream("agent_chunk", {
                        "agent": agent_name,
                        "text": block
                    })

            self._stream("agent_done", agent_name)
            return result

        except Exception as e:
            error_msg = f"[{agent_name} ERROR: {str(e)}]"
            self._stream("agent_error", error_msg)
            return error_msg

    # --------------------------------------------------
    # MAIN PIPELINE
    # --------------------------------------------------
    def run(self, user_id: str, report_type: str, filename: str = None, new_file_text: str = None):

        self._stream("status", "🚀 Generating professional intelligence report")

        user_query = self._user_query(user_id)

        # ---------------------------
        # TEXT SOURCE
        # ---------------------------
        if new_file_text:
            extracted_text = clean_text(new_file_text)
            filename = filename or "uploaded_document"
        else:
            record = None
            if filename:
                record = self.collection.find_one({
                    "userId": user_query,
                    "originalFilename": filename
                })

            if not record:
                record = self.collection.find_one(
                    {"userId": user_query},
                    sort=[("_id", -1)]
                )

            if not record:
                return {"success": False, "error": "No OCR document found"}

            extracted_text = clean_text(record.get("extractedText", ""))
            filename = record.get("originalFilename", "document")

        extracted_text = extracted_text[:12000]

        # ---------------------------
        # RAG CONTEXT
        # ---------------------------
        rag_context, entities = self._build_rag_context(extracted_text, filename)

        self._stream("status", "🤖 Running analytical agents")

        agent_map = {
            "executive_summary": self.executive_agent,
            "case_background": self.case_background_agent,
            "document_analysis": self.document_analyzer,
            "behavior_analysis": self.behavior_agent,
            "cognitive_analysis": self.cognitive_agent,
            "decision_analysis": self.decision_agent,
            "risk_analysis": self.risk_agent,
            "sentiment_analysis": self.sentiment_agent,
            "trend_analysis": self.trend_agent,
            "keywords": self.keyword_agent,
            "entities": self.entity_agent,
            "recommendations": self.recommendation_agent,
            "final_summary": self.summarizer_agent,
        }

        results = {}
        for name, agent in agent_map.items():
            results[name] = self._run_agent(name, agent, rag_context)

        # ---------------------------
        # FINAL REPORT PAYLOAD
        # ---------------------------
        report_payload = {
            "title": report_type,
            "created_by": "AI Intelligence Report Generator",
            "created_on": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            **results
        }

        report_name = re.sub(r"[^\w\s-]", "", report_type).lower().replace(" ", "_")
        report_path = render_html_report(report_payload, report_name, str(user_id))

        self._stream("done", True)

        return {
            "success": True,
            "report_url": f"/static/reports/{os.path.basename(report_path)}",
            "entities": entities,
            "raw_output": report_payload
        }


# # agent_orchestrator.py
# import os
# import re
# import concurrent.futures
# from pymongo import MongoClient
# from bson import ObjectId
# from dotenv import load_dotenv

# # Existing Agents
# from .tools.summarizer_agent import SummarizerAgent
# from .tools.keyword_agent import KeywordAgent
# from .tools.trend_agent import TrendAgent
# from .tools.decision_agent import DecisionAgent
# from .tools.formatter_agent import FormatAgent
# from .tools.data_extraction_agent import DataExtractionAgent
# from .tools.collection_analyzer import CollectionAnalyzer

# # NEW Agents & specialized tools
# from .tools.risk_analysis_agent import RiskAnalysisAgent
# from .tools.cognitive_analysis import CognitiveAgent
# from .tools.sentiment_agent import SentimentAgent

# from .tools.llm_loader import load_llm 
# from .nlp_pipeline import clean_text, perform_ner  # <--- Imported perform_ner
# from .generators.chart_generator import generate_chart
# from .generators.report_generator import render_html_report

# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser

# load_dotenv()

# # --- SPECIALIZED LAW ENFORCEMENT PROMPTS ---
# LE_PROMPTS = {
#     "criminal_profile": """
#     Based on the provided text, create a Master Criminal Profile.
#     Input Text: {text}
#     Risk Analysis: {risks}
#     Sentiment: {sentiment}

#     Output Structure:
#     1. Executive Summary
#     2. Identity Details (Name, Age, Address found in text)
#     3. Criminal History / Allegations
#     4. Modus Operandi (MO)
#     5. Psych/Risk Assessment
#     6. Associates mentioned
#     """,
#     "fir_analysis": """
#     Analyze this FIR/Legal Document.
#     Input Text: {text}
    
#     Output Structure:
#     1. Case Details (FIR No, Station, Date)
#     2. Accused & Complainant
#     3. Acts & Sections (IPC/CrPC)
#     4. Chronological Timeline of Event
#     5. Evidence/Witnesses Mentioned
#     6. Investigative Leads
#     """,
#     "interrogation": """
#     Analyze this Interrogation Transcript.
#     Input Text: {text}
#     Sentiment Analysis: {sentiment}
#     Cognitive State: {cognitive}

#     Output Structure:
#     1. Subject Information
#     2. Summary of Statement
#     3. Key Admissions vs Denials
#     4. Deception Indicators / Inconsistencies
#     5. Behavioral Analysis
#     6. Actionable Intelligence
#     """,
#     "custody": """
#     Generate a Custody Movement/Status Report.
#     Input Text: {text}

#     Output Structure:
#     1. Inmate Details
#     2. Movement History (Dates & Locations)
#     3. Medical/Conduct Notes
#     4. Upcoming Hearings/Dates
#     """
# }

# class AgenticReportPipeline:
#     def __init__(self):
#         self.mongo_url = os.getenv("MONGO_URL")
#         self.client = MongoClient(self.mongo_url)
#         self.db = self.client[os.getenv("MONGO_DB_NAME")]
#         self.collection = self.db["ocrrecords"] 

#         self.llm = load_llm() 
        
#         # Initialize Agents
#         self.collection_analyzer = CollectionAnalyzer(self.collection)
#         self.summarizer = SummarizerAgent()
#         self.keyword_agent = KeywordAgent()
#         self.trend_agent = TrendAgent()
#         self.decision_agent = DecisionAgent()
#         self.format_agent = FormatAgent()
#         self.data_extractor = DataExtractionAgent()

#         # Initialize Specialized Agents
#         self.risk_agent = RiskAnalysisAgent()
#         self.cognitive_agent = CognitiveAgent()
#         self.sentiment_agent = SentimentAgent()
        
#         # ---------------------------------------------------------
#         # PATH CONFIGURATION
#         # ---------------------------------------------------------
#         self.reports_dir = os.path.join(os.getcwd(), "static", "reports")
#         if not os.path.exists(self.reports_dir):
#             os.makedirs(self.reports_dir, exist_ok=True)
#             print(f"📁 Created Reports Directory: {self.reports_dir}")
            
#         self.reports_url_prefix = "/static/reports/"

#     def _get_user_query(self, user_id):
#         try:
#             return {"$in": [user_id, ObjectId(user_id)]}
#         except:
#             return user_id

#     def _clean_llm_output(self, output):
#         if hasattr(output, 'content'): 
#             return output.content
#         return str(output)

#     def _sanitize_filename(self, text):
#         clean = re.sub(r'[^\w\s-]', '', text).strip().lower()
#         return re.sub(r'[-\s]+', '_', clean)

#     def _identify_document(self, text):
#         try:
#             id_chain = PromptTemplate.from_template(
#                 "Identify this document type (e.g., FIR, Statement, Invoice). Return ONLY the type name:\n{text}"
#             ) | self.llm | StrOutputParser()
#             return id_chain.invoke({"text": text[:500]})
#         except:
#             return "Document"

#     def _get_active_agents(self, report_type):
#         rt = report_type.lower()
#         active = {"summary", "keywords", "decision"} # Default set

#         if "quick" in rt or "simple" in rt:
#             return active

#         if any(x in rt for x in ["financial", "market", "sales", "growth", "trend"]):
#             active.add("trends")
#             active.add("chart")
        
#         if any(x in rt for x in ["risk", "audit", "compliance", "legal", "fir", "case", "criminal"]):
#             active.add("risks")
        
#         if any(x in rt for x in ["psych", "sentiment", "hr", "interrogation", "interview"]):
#             active.add("sentiment")
#             active.add("cognitive")
        
#         if any(x in rt for x in ["criminal", "profile", "intelligence", "police"]):
#             active.add("risks")
#             active.add("sentiment")
#             active.add("keywords")

#         if any(x in rt for x in ["comprehensive", "full", "detailed"]):
#             active.update({"trends", "risks", "sentiment", "cognitive", "chart"})

#         return active

#     def _generate_specialized_report(self, report_type, context, risks, sentiment, cognitive):
#         rt = report_type.lower()
#         template = None

#         if "profile" in rt or "criminal" in rt:
#             template = LE_PROMPTS["criminal_profile"]
#         elif "fir" in rt or "case" in rt:
#             template = LE_PROMPTS["fir_analysis"]
#         elif "interrogation" in rt or "intelligence" in rt:
#             template = LE_PROMPTS["interrogation"]
#         elif "custody" in rt or "prison" in rt:
#             template = LE_PROMPTS["custody"]
        
#         if template:
#             prompt = PromptTemplate.from_template(template)
#             chain = prompt | self.llm | StrOutputParser()
#             return chain.invoke({
#                 "text": context,
#                 "risks": risks,
#                 "sentiment": sentiment,
#                 "cognitive": cognitive
#             })
#         return None

#     def run(self, user_id: str, report_type: str, keyword: str = None, new_file_text: str = None):
#         print(f"\n--- 🚀 Pipeline Started for User: {user_id} ---")
        
#         # 1. Fetch Data
#         current_text = new_file_text or ""
#         user_query = self._get_user_query(user_id)

#         if not current_text:
#             last_record = self.collection.find_one({"userId": user_query}, sort=[("_id", -1)])
#             if last_record and "extractedText" in last_record:
#                 current_text = last_record["extractedText"]
#             else:
#                 return {"success": False, "error": "No text available for analysis."}

#         # 2. Prepare Context
#         history_text = ""
#         if keyword:
#             cursor = self.collection.find(
#                 {"userId": user_query, "extractedText": {"$regex": keyword, "$options": "i"}}
#             ).limit(3)
#             docs = list(cursor)
#             if docs: 
#                 history_text = "\n".join([d.get('extractedText', '')[:1000] for d in docs])

#         full_context = f"{current_text}\n{history_text}"
#         cleaned_text = clean_text(full_context)[:12000] 
        
#         # 3. Agent Execution
#         active_agents = self._get_active_agents(report_type)
#         print(f"⚡ Active Agents: {active_agents}")

#         results = {
#             "summary": "", "keywords": [], "decisions": "Not requested.", 
#             "trends": "Not requested.", "risks": "Not requested.", 
#             "sentiment": "Not requested.", "cognitive": "Not requested.", 
#             "chart_path": None, "entities": {}
#         }
        
#         doc_identity = "Document"

#         with concurrent.futures.ThreadPoolExecutor() as executor:
#             futures = {}

#             # Essential: Identity & NER (Entity Extraction)
#             futures[executor.submit(self._identify_document, cleaned_text)] = "identity"
#             futures[executor.submit(perform_ner, cleaned_text)] = "entities"  # <--- Added NER Task

#             short_text = cleaned_text[:4000]

#             if "summary" in active_agents:
#                 futures[executor.submit(self.summarizer.run, cleaned_text)] = "summary"
            
#             if "keywords" in active_agents:
#                 futures[executor.submit(self.keyword_agent.run, short_text)] = "keywords"

#             if "decision" in active_agents:
#                 futures[executor.submit(self.decision_agent.run, cleaned_text)] = "decisions"

#             if "trends" in active_agents:
#                 futures[executor.submit(self.trend_agent.run, cleaned_text)] = "trends"

#             if "risks" in active_agents:
#                 futures[executor.submit(self.risk_agent.run, cleaned_text)] = "risks"

#             if "sentiment" in active_agents:
#                 futures[executor.submit(self.sentiment_agent.run, short_text)] = "sentiment"

#             if "cognitive" in active_agents:
#                 futures[executor.submit(self.cognitive_agent.run, cleaned_text)] = "cognitive"

#             if "chart" in active_agents and len(cleaned_text) > 200:
#                 futures[executor.submit(self.data_extractor.run, cleaned_text, keyword or "Metrics")] = "chart_data"

#             for future in concurrent.futures.as_completed(futures):
#                 task_type = futures[future]
#                 try:
#                     res = future.result()
#                     if task_type == "identity":
#                         doc_identity = res
#                     elif task_type == "chart_data":
#                         if res and res.get("values"):
#                             results["chart_path"] = os.path.abspath(generate_chart(res))
#                     else:
#                         if isinstance(res, list) or isinstance(res, dict):
#                             results[task_type] = res
#                         else:
#                             results[task_type] = self._clean_llm_output(res)
#                 except Exception as e:
#                     print(f"⚠ Agent {task_type} failed: {e}")

#         # 4. Generate Final Text Report
#         specialized_report = self._generate_specialized_report(
#             report_type, cleaned_text, results["risks"], results["sentiment"], results["cognitive"]
#         )

#         if specialized_report:
#             report_text = self._clean_llm_output(specialized_report)
#         else:
#             try:
#                 raw_report = self.format_agent.run(
#                     summary=results["summary"],
#                     keywords=results["keywords"],
#                     trends=results["trends"],
#                     decisions=results["decisions"],
#                     report_type=report_type
#                 )
#                 report_text = self._clean_llm_output(raw_report)
#             except:
#                 report_text = results["summary"]

#         results["report"] = report_text 
#         results["final_report_text"] = report_text

#         # -------------------------------------------------------------
#         # 5. DATA MAPPING for Report Generator
#         # This bridges the gap between Orchestrator output and PDF Template
#         # -------------------------------------------------------------
        
#         # Prepare the 'profile' dictionary from NER entities
#         entities = results.get("entities", {})
        
#         # Fallback Logic: If no Person entity found, check keywords
#         name_list = entities.get("PERSON", [])
#         primary_name = name_list[0] if name_list else "Unknown Subject"
        
#         profile_data = {
#             "name": primary_name,
#             "aliases": name_list[1:] if len(name_list) > 1 else [],
#             "locations": entities.get("GPE", []),
#             "fir_numbers": entities.get("LAW", []), # Mapping extracted Laws to FIR/Sections area
#             "sections": entities.get("LAW", [])
#         }

#         # Structure data specifically for render_html_report
#         report_data_payload = {
#             "title": f"{report_type.title()} Report",
#             "summary": results["summary"],
#             "profile": profile_data,
#             "risk": results["risks"], # Mapping 'risks' to 'risk'
#             "sentiment": results["sentiment"],
#             "recommendations": results["decisions"], # Mapping decisions to recommendations
#             "trends": results.get("trends", []),
#             "keywords": results.get("keywords", []),
#             "chart_path": results.get("chart_path", "")
#         }

#         # 6. Generate PDF
#         clean_name = self._sanitize_filename(report_type)
#         saved_file_path = render_html_report(
#             report_data_payload,  # Passing the mapped payload instead of raw results
#             clean_name, 
#             str(user_id)
#         )

#         # 7. Construct URL
#         if saved_file_path and os.path.exists(saved_file_path):
#             filename = os.path.basename(saved_file_path)
#             download_url = f"{self.reports_url_prefix}{filename}"
#         else:
#             download_url = None

#         return {
#             "success": True,
#             "collection_insight": {"context_desc": self._clean_llm_output(doc_identity)},
#             "summary": results["summary"],
#             "entities": results["entities"], # Return entities to frontend too
#             "final_report_text": report_text, 
#             "download_link": download_url
#         }

# import os
# import re
# import concurrent.futures
# from pymongo import MongoClient
# from bson import ObjectId
# from dotenv import load_dotenv

# # Existing Agents
# from .tools.summarizer_agent import SummarizerAgent
# from .tools.keyword_agent import KeywordAgent
# from .tools.trend_agent import TrendAgent
# from .tools.decision_agent import DecisionAgent
# from .tools.formatter_agent import FormatAgent
# from .tools.data_extraction_agent import DataExtractionAgent
# from .tools.collection_analyzer import CollectionAnalyzer

# # NEW Agents & specialized tools
# from .tools.risk_analysis_agent import RiskAnalysisAgent
# from .tools.cognitive_analysis import CognitiveAgent
# from .tools.sentiment_agent import SentimentAgent

# from .tools.llm_loader import load_llm 
# from .nlp_pipeline import clean_text
# from .generators.chart_generator import generate_chart
# from .generators.report_generator import render_html_report

# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser

# load_dotenv()

# # --- SPECIALIZED LAW ENFORCEMENT PROMPTS ---
# LE_PROMPTS = {
#     "criminal_profile": """
#     Based on the provided text, create a Master Criminal Profile.
#     Input Text: {text}
#     Risk Analysis: {risks}
#     Sentiment: {sentiment}

#     Output Structure:
#     1. Executive Summary
#     2. Identity Details (Name, Age, Address found in text)
#     3. Criminal History / Allegations
#     4. Modus Operandi (MO)
#     5. Psych/Risk Assessment
#     6. Associates mentioned
#     """,
#     "fir_analysis": """
#     Analyze this FIR/Legal Document.
#     Input Text: {text}
    
#     Output Structure:
#     1. Case Details (FIR No, Station, Date)
#     2. Accused & Complainant
#     3. Acts & Sections (IPC/CrPC)
#     4. Chronological Timeline of Event
#     5. Evidence/Witnesses Mentioned
#     6. Investigative Leads
#     """,
#     "interrogation": """
#     Analyze this Interrogation Transcript.
#     Input Text: {text}
#     Sentiment Analysis: {sentiment}
#     Cognitive State: {cognitive}

#     Output Structure:
#     1. Subject Information
#     2. Summary of Statement
#     3. Key Admissions vs Denials
#     4. Deception Indicators / Inconsistencies
#     5. Behavioral Analysis
#     6. Actionable Intelligence
#     """,
#     "custody": """
#     Generate a Custody Movement/Status Report.
#     Input Text: {text}

#     Output Structure:
#     1. Inmate Details
#     2. Movement History (Dates & Locations)
#     3. Medical/Conduct Notes
#     4. Upcoming Hearings/Dates
#     """
# }

# class AgenticReportPipeline:
#     def __init__(self):
#         self.mongo_url = os.getenv("MONGO_URL")
#         self.client = MongoClient(self.mongo_url)
#         self.db = self.client[os.getenv("MONGO_DB_NAME")]
#         self.collection = self.db["ocrrecords"] 

#         self.llm = load_llm() 
        
#         # Initialize Agents
#         self.collection_analyzer = CollectionAnalyzer(self.collection)
#         self.summarizer = SummarizerAgent()
#         self.keyword_agent = KeywordAgent()
#         self.trend_agent = TrendAgent()
#         self.decision_agent = DecisionAgent()
#         self.format_agent = FormatAgent()
#         self.data_extractor = DataExtractionAgent()

#         # Initialize Specialized Agents
#         self.risk_agent = RiskAnalysisAgent()
#         self.cognitive_agent = CognitiveAgent()
#         self.sentiment_agent = SentimentAgent()
        
#         # ---------------------------------------------------------
#         # PATH CONFIGURATION
#         # ---------------------------------------------------------
#         # 1. Physical path to save files
#         self.reports_dir = os.path.join(os.getcwd(), "static", "reports")
#         if not os.path.exists(self.reports_dir):
#             os.makedirs(self.reports_dir, exist_ok=True)
#             print(f"📁 Created Reports Directory: {self.reports_dir}")
            
#         # 2. URL prefix for the frontend
#         self.reports_url_prefix = "/static/reports/"

#     def _get_user_query(self, user_id):
#         try:
#             return {"$in": [user_id, ObjectId(user_id)]}
#         except:
#             return user_id

#     def _clean_llm_output(self, output):
#         if hasattr(output, 'content'): 
#             return output.content
#         return str(output)

#     def _sanitize_filename(self, text):
#         """Creates a safe filename from the report type"""
#         clean = re.sub(r'[^\w\s-]', '', text).strip().lower()
#         return re.sub(r'[-\s]+', '_', clean)

#     def _identify_document(self, text):
#         try:
#             id_chain = PromptTemplate.from_template(
#                 "Identify this document type (e.g., FIR, Statement, Invoice). Return ONLY the type name:\n{text}"
#             ) | self.llm | StrOutputParser()
#             return id_chain.invoke({"text": text[:500]})
#         except:
#             return "Document"

#     def _get_active_agents(self, report_type):
#         rt = report_type.lower()
#         active = {"summary", "keywords", "decision"}

#         # Performance Optimization: Skip heavy agents for simple requests
#         if "quick" in rt or "simple" in rt:
#             return active

#         if any(x in rt for x in ["financial", "market", "sales", "growth", "trend"]):
#             active.add("trends")
#             active.add("chart")
        
#         if any(x in rt for x in ["risk", "audit", "compliance", "legal", "fir", "case", "criminal"]):
#             active.add("risks")
        
#         if any(x in rt for x in ["psych", "sentiment", "hr", "interrogation", "interview"]):
#             active.add("sentiment")
#             active.add("cognitive")
        
#         if any(x in rt for x in ["criminal", "profile", "intelligence", "police"]):
#             active.add("risks")
#             active.add("sentiment")
#             active.add("keywords")

#         if any(x in rt for x in ["comprehensive", "full", "detailed"]):
#             active.update({"trends", "risks", "sentiment", "cognitive", "chart"})

#         return active

#     def _generate_specialized_report(self, report_type, context, risks, sentiment, cognitive):
#         rt = report_type.lower()
#         template = None

#         if "profile" in rt or "criminal" in rt:
#             template = LE_PROMPTS["criminal_profile"]
#         elif "fir" in rt or "case" in rt:
#             template = LE_PROMPTS["fir_analysis"]
#         elif "interrogation" in rt or "intelligence" in rt:
#             template = LE_PROMPTS["interrogation"]
#         elif "custody" in rt or "prison" in rt:
#             template = LE_PROMPTS["custody"]
        
#         if template:
#             prompt = PromptTemplate.from_template(template)
#             chain = prompt | self.llm | StrOutputParser()
#             return chain.invoke({
#                 "text": context,
#                 "risks": risks,
#                 "sentiment": sentiment,
#                 "cognitive": cognitive
#             })
#         return None

#     def run(self, user_id: str, report_type: str, keyword: str = None, new_file_text: str = None):
#         print(f"\n--- 🚀 Pipeline Started for User: {user_id} ---")
#         print(f"📋 Report Type Requested: {report_type}")
#         # 1. Fetch Data
#         current_text = new_file_text or ""
#         user_query = self._get_user_query(user_id)

#         if not current_text:
#             last_record = self.collection.find_one({"userId": user_query}, sort=[("_id", -1)])
#             if last_record and "extractedText" in last_record:
#                 current_text = last_record["extractedText"]
#             else:
#                 return {"success": False, "error": "No text available for analysis."}

#         # 2. Prepare Context (Limit size for speed)
#         # Performance: Reduced history size from 2000 to 1000 chars per doc
#         history_text = ""
#         if keyword:
#             cursor = self.collection.find(
#                 {"userId": user_query, "extractedText": {"$regex": keyword, "$options": "i"}}
#             ).limit(3) # Reduced limit
#             docs = list(cursor)
#             if docs: 
#                 history_text = "\n".join([d.get('extractedText', '')[:1000] for d in docs])

#         full_context = f"{current_text}\n{history_text}"
#         cleaned_text = clean_text(full_context)[:12000] 
        
#         # 3. Agent Execution
#         active_agents = self._get_active_agents(report_type)
#         print(f"⚡ Active Agents: {active_agents}")

#         results = {
#             "summary": "", "keywords": [], "decisions": "Not requested.", 
#             "trends": "Not requested.", "risks": "Not requested.", 
#             "sentiment": "Not requested.", "cognitive": "Not requested.", 
#             "chart_path": None
#         }
        
#         doc_identity = "Document"

#         with concurrent.futures.ThreadPoolExecutor() as executor:
#             futures = {}

#             # Always run ID
#             futures[executor.submit(self._identify_document, cleaned_text)] = "identity"

#             # Optimization: Use shorter text for sentiment/keywords if text is huge
#             short_text = cleaned_text[:4000]

#             if "summary" in active_agents:
#                 futures[executor.submit(self.summarizer.run, cleaned_text)] = "summary"
            
#             if "keywords" in active_agents:
#                 futures[executor.submit(self.keyword_agent.run, short_text)] = "keywords"

#             if "decision" in active_agents:
#                 futures[executor.submit(self.decision_agent.run, cleaned_text)] = "decisions"

#             if "trends" in active_agents:
#                 futures[executor.submit(self.trend_agent.run, cleaned_text)] = "trends"

#             if "risks" in active_agents:
#                 futures[executor.submit(self.risk_agent.run, cleaned_text)] = "risks"

#             if "sentiment" in active_agents:
#                 # Sentiment usually works fine with less context
#                 futures[executor.submit(self.sentiment_agent.run, short_text)] = "sentiment"

#             if "cognitive" in active_agents:
#                 futures[executor.submit(self.cognitive_agent.run, cleaned_text)] = "cognitive"

#             if "chart" in active_agents and len(cleaned_text) > 200:
#                 futures[executor.submit(self.data_extractor.run, cleaned_text, keyword or "Metrics")] = "chart_data"

#             for future in concurrent.futures.as_completed(futures):
#                 task_type = futures[future]
#                 try:
#                     res = future.result()
#                     if task_type == "identity":
#                         doc_identity = res
#                     elif task_type == "chart_data":
#                         if res and res.get("values"):
#                             # Save chart to static/reports so it is accessible via URL if needed
#                             results["chart_path"] = os.path.abspath(generate_chart(res))
#                     else:
#                         if isinstance(res, list):
#                             results[task_type] = res
#                         else:
#                             results[task_type] = self._clean_llm_output(res)
#                 except Exception as e:
#                     print(f"⚠ Agent {task_type} failed: {e}")

#         # 4. Generate Final Report Content
#         specialized_report = self._generate_specialized_report(
#             report_type, cleaned_text, results["risks"], results["sentiment"], results["cognitive"]
#         )

#         if specialized_report:
#             report_text = self._clean_llm_output(specialized_report)
#         else:
#             try:
#                 raw_report = self.format_agent.run(
#                     summary=results["summary"],
#                     keywords=results["keywords"],
#                     trends=results["trends"],
#                     decisions=results["decisions"],
#                     report_type=report_type
#                 )
#                 report_text = self._clean_llm_output(raw_report)
#             except:
#                 report_text = results["summary"]

#         results["report"] = report_text 
#         results["final_report_text"] = report_text

#         # 5. Generate PDF/HTML File
#         # Sanitize name for file system
#         clean_name = self._sanitize_filename(report_type)
        
#         # Call generator
#         # FIX: Removed 'folder_path' argument to resolve TypeError. 
#         # The render_html_report function definition likely does not accept this argument.
#         saved_file_path = render_html_report(
#             results, 
#             clean_name, 
#             str(user_id)
#             # folder_path=self.reports_dir # <-- REMOVED TO FIX ERROR
#         )

#         # 6. Construct URL for Frontend
#         # If the generator returned a full path, extract filename and append to URL prefix
#         if saved_file_path and os.path.exists(saved_file_path):
#             filename = os.path.basename(saved_file_path)
#             # Result: /static/reports/69215_master_criminal_profile.pdf
#             download_url = f"{self.reports_url_prefix}{filename}"
#         else:
#             # Fallback if generator failed
#             download_url = None

#         return {
#             "success": True,
#             "collection_insight": {"context_desc": self._clean_llm_output(doc_identity)},
#             "summary": results["summary"],
#             "keywords": results["keywords"],
#             "trends": results["trends"],
#             "decisions": results["decisions"],
#             "risks": results["risks"],
#             "sentiment": results["sentiment"],
#             "cognitive": results["cognitive"],
#             "final_report_text": report_text, 
#             "report": report_text,
#             "download_link": download_url # Returning the clean URL
#         }

# # import os
# # from pymongo import MongoClient
# # from bson import ObjectId
# # from dotenv import load_dotenv

# # # Import Agents
# # from .tools.summarizer_agent import SummarizerAgent
# # from .tools.keyword_agent import KeywordAgent
# # from .tools.trend_agent import TrendAgent
# # from .tools.decision_agent import DecisionAgent
# # from .tools.formatter_agent import FormatAgent
# # from .tools.data_extraction_agent import DataExtractionAgent
# # from .tools.collection_analyzer import CollectionAnalyzer
# # from .tools.llm_loader import load_llm 
# # from .nlp_pipeline import clean_text
# # from .ocr_utils import save_pdf
# # from .generators.chart_generator import generate_chart
# # from langchain_core.prompts import PromptTemplate
# # from langchain_core.output_parsers import StrOutputParser

# # load_dotenv()

# # class AgenticReportPipeline:
# #     def __init__(self):
# #         self.mongo_url = os.getenv("MONGO_URL")
# #         self.client = MongoClient(self.mongo_url)
# #         self.db = self.client[os.getenv("MONGO_DB_NAME")]
# #         # Force correct collection name
# #         self.collection = self.db["ocrrecords"] 

# #         self.llm = load_llm() 
# #         self.collection_analyzer = CollectionAnalyzer(self.collection)
# #         self.summarizer = SummarizerAgent()
# #         self.keyword_agent = KeywordAgent()
# #         self.trend_agent = TrendAgent()
# #         self.decision_agent = DecisionAgent()
# #         self.format_agent = FormatAgent()
# #         self.data_extractor = DataExtractionAgent()

# #     def _get_user_query(self, user_id):
# #         try:
# #             return {"$in": [user_id, ObjectId(user_id)]}
# #         except:
# #             return user_id

# #     def _clean_llm_output(self, output):
# #         """SAFETY HELPER: Ensures we never pass an AIMessage object to the PDF generator"""
# #         if hasattr(output, 'content'): 
# #             return output.content
# #         return str(output)

# #     def run(self, user_id: str, report_type: str, keyword: str = None, new_file_text: str = None):
# #         print(f"\n--- 🚀 Pipeline Started for User: {user_id} ---")

# #         # 1. ROBUST DATA FETCHING
# #         current_text = new_file_text or ""
# #         user_query = self._get_user_query(user_id)

# #         # Fallback to DB
# #         if not current_text:
# #             print("⚠ Checking DB for latest file...")
# #             last_record = self.collection.find_one({"userId": user_query}, sort=[("_id", -1)])
# #             if last_record and "extractedText" in last_record:
# #                 current_text = last_record["extractedText"]
# #                 print(f"✔ Found text in DB: {last_record.get('fileName')}")
# #             else:
# #                 print("❌ No text found in DB.")

# #         # History Context
# #         history_text = ""
# #         if keyword:
# #             cursor = self.collection.find({"userId": user_query, "extractedText": {"$regex": keyword, "$options": "i"}})
# #             docs = list(cursor)
# #             if docs: history_text = "\n".join([d.get('extractedText', '') for d in docs])

# #         full_context = f"{current_text}\n{history_text}"
# #         if len(full_context.strip()) < 5:
# #              return {"success": False, "error": "No text available for analysis."}

# #         # 2. ANALYSIS
# #         cleaned_text = clean_text(full_context)[:12000]
# #         print("🧠 Identifying Document...")
        
# #         try:
# #             id_chain = PromptTemplate.from_template("Identify this document type: {text}") | self.llm | StrOutputParser()
# #             doc_identity = id_chain.invoke({"text": cleaned_text[:500]})
# #         except: 
# #             doc_identity = "Document"

# #         context_text = f"[TYPE: {doc_identity}]\n{cleaned_text}"
        
# #         print("🤖 Running Agents...")
# #         summary = self.summarizer.run(context_text)
# #         keywords = self.keyword_agent.run(context_text)
# #         decisions = self.decision_agent.run(context_text)
# #         trends = self.trend_agent.run(context_text)

# #         # Chart
# #         chart_path = None
# #         if len(cleaned_text) > 200:
# #              chart_data = self.data_extractor.run(context_text, focus=keyword or "Metrics")
# #              chart_path = generate_chart(chart_data)

# #         # 3. FORMAT & SAVE
# #         print("📝 Formatting...")
# #         raw_report = self.format_agent.run(
# #             summary=summary,
# #             keywords=keywords,
# #             trends=trends,
# #             decisions=decisions,
# #             report_type=report_type
# #         )
        
# #         # FINAL SAFETY CHECK: Convert to string before saving
# #         final_report_str = self._clean_llm_output(raw_report)

# #         safe_name = f"{user_id}_{keyword if keyword else 'report'}"[:15]
# #         download_link = save_pdf(final_report_str, safe_name, report_type, image_path=chart_path)

# #         return {
# #             "success": True,
# #             "collection_insight": {"context_desc": self._clean_llm_output(doc_identity)},
# #             "summary": self._clean_llm_output(summary),
# #             "final_report_text": final_report_str,
# #             "download_link": download_link
# #         }