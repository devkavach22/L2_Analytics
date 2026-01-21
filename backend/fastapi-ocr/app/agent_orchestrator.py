import os
import re
import concurrent.futures
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# -----------------------------
# Disable Chroma telemetry (early)
# -----------------------------
os.environ["ANONYMIZED_TELEMETRY"] = "false"

# -----------------------------
# Existing Agents (UNCHANGED)
# -----------------------------
from .tools.summarizer_agent import SummarizerAgent
from .tools.keyword_agent import KeywordAgent
from .tools.trend_agent import TrendAnalysisAgent
from .tools.decision_agent import DecisionAgent
from .tools.formatter_agent import FormatAgent
from .tools.data_extraction_agent import DataExtractionAgent
from .tools.collection_analyzer import CollectionAnalyzer
from .tools.risk_analysis_agent import RiskAnalysisAgent
from .tools.cognitive_analysis import CognitiveAnalysisAgent
from .tools.sentiment_agent import SentimentAnalysisAgent

# -----------------------------
# 🔥 NotebookLM Agents
# -----------------------------
from .tools.report_selector_agent import ReportSelectorAgent
from .tools.report_generator_agent import ReportGeneratorAgent

# Core utils
from .tools.llm_loader import load_llm
from .nlp_pipeline import clean_text
from .generators.report_generator import render_html_report

# -----------------------------
# ✅ UPDATED LangChain imports
# -----------------------------
from langchain_chroma import Chroma
from langchain.embeddings import HuggingFaceEmbeddings

load_dotenv()


class AgenticReportPipeline:
    """
    Hybrid Agentic + NotebookLM-style Report Pipeline
    """

    def __init__(self):
        # -----------------------------
        # MongoDB
        # -----------------------------
        self.client = MongoClient(os.getenv("MONGO_URL"))
        self.db = self.client[os.getenv("MONGO_DB_NAME")]
        self.collection = self.db["ocrrecords"]

        self.llm = load_llm()

        # -----------------------------
        # Existing Agents
        # -----------------------------
        self.collection_analyzer = CollectionAnalyzer(self.collection)
        self.summarizer = SummarizerAgent()
        self.keyword_agent = KeywordAgent()
        self.trend_agent = TrendAnalysisAgent()
        self.decision_agent = DecisionAgent()
        self.format_agent = FormatAgent()
        self.data_extractor = DataExtractionAgent()
        self.risk_agent = RiskAnalysisAgent()
        self.cognitive_agent = CognitiveAnalysisAgent()
        self.sentiment_agent = SentimentAnalysisAgent()

        # -----------------------------
        # 🔥 NotebookLM Agents
        # -----------------------------
        self.report_selector = ReportSelectorAgent()
        self.report_generator = ReportGeneratorAgent()

        # -----------------------------
        # Vector Store (READ ONLY – global)
        # -----------------------------
        self.embedding = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )

        self.vectordb = Chroma(
            persist_directory="./chroma",
            collection_name="ocr_notebooklm",
            embedding_function=self.embedding
        )

        # -----------------------------
        # Output paths
        # -----------------------------
        self.reports_dir = os.path.join(os.getcwd(), "static", "reports")
        os.makedirs(self.reports_dir, exist_ok=True)
        self.reports_url_prefix = "/static/reports/"

    # ------------------------------------------------------------------
    # 🔥 Vector Retrieval (NotebookLM-style grounding)
    # ------------------------------------------------------------------
    def _retrieve_context_from_vectors(self, query: str, k: int = 8) -> str:
        try:
            docs = self.vectordb.similarity_search(query, k=k)
            return "\n\n".join(
                f"[{d.metadata.get('fileName', 'OCR')}]\n{d.page_content}"
                for d in docs
            )
        except Exception as e:
            print(f"⚠ Vector retrieval failed: {e}")
            return ""

    def _build_notebooklm_context(self, base_text: str, query: str) -> str:
        vector_context = self._retrieve_context_from_vectors(query)
        combined = f"{base_text}\n\n{vector_context}"
        return clean_text(combined)[:12000]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _get_user_query(self, user_id):
        try:
            return {"$in": [user_id, ObjectId(user_id)]}
        except Exception:
            return user_id

    def _sanitize_filename(self, text: str) -> str:
        clean = re.sub(r"[^\w\s-]", "", text).strip().lower()
        return re.sub(r"[-\s]+", "_", clean)

    # ------------------------------------------------------------------
    # MAIN ENTRY POINT
    # ------------------------------------------------------------------
    def run(
        self,
        user_id: str,
        report_type: str,
        keyword: str = None,
        new_file_text: str = None,
        notebooklm_mode: bool = True
    ):
        """
        notebooklm_mode=True → Uses ReportSelector + ReportGenerator
        notebooklm_mode=False → Uses legacy agent formatting
        """

        # -----------------------------
        # Fetch OCR text
        # -----------------------------
        current_text = new_file_text or ""
        record = None

        if not current_text:
            record = self.collection.find_one(
                {"userId": self._get_user_query(user_id)},
                sort=[("_id", -1)]
            )
            current_text = record.get("extractedText", "") if record else ""

        if not current_text:
            return {"success": False, "error": "No OCR text found"}

        # ✅ Canonical NotebookLM document id
        doc_id = str(record["_id"]) if record else str(user_id)

        # -----------------------------
        # Grounded Context
        # -----------------------------
        cleaned_text = self._build_notebooklm_context(
            current_text,
            report_type or keyword or "document analysis"
        )

        # ==============================================================
        # 🔥 NOTEBOOKLM MODE
        # ==============================================================
        if notebooklm_mode:
            from src.vector_store import VectorStoreManager

            vector_manager = VectorStoreManager(doc_id)
            vectordb = vector_manager.load_vector_store()
            # vectordb.persist()

            if vectordb is None:
                vector_manager.create_vector_store(cleaned_text)

            # Step 1: Summary
            summary_output = self.summarizer.run(cleaned_text)

            summary_payload = {
                "overview": summary_output,
                "key_topics": self.keyword_agent.run(cleaned_text[:3000]),
                "important_entities": [],
            }

            # Step 2: Schema selection
            report_schema = self.report_selector.run(
                summary=summary_payload,
                preferred_type=report_type
            )

            # Step 3: Section-wise RAG generation
            report_result = self.report_generator.run(
                doc_id=doc_id,
                report_schema=report_schema,
                output_dir=self.reports_dir
            )

            download_url = (
                f"{self.reports_url_prefix}{report_result['file_name']}"
                if report_result.get("file_name")
                else None
            )

            return {
                "success": True,
                "mode": "notebooklm",
                "report_type": report_schema.report_type,
                "sections": report_result["sections"],
                "download_link": download_url
            }

        # ==============================================================
        # LEGACY MODE (UNCHANGED)
        # ==============================================================
        short_text = cleaned_text[:4000]

        results = {
            "summary": "",
            "keywords": [],
            "decisions": "",
            "trends": "",
            "risks": "",
            "sentiment": "",
            "cognitive": ""
        }

        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = {
                executor.submit(self.summarizer.run, cleaned_text): "summary",
                executor.submit(self.keyword_agent.run, short_text): "keywords",
                executor.submit(self.decision_agent.run, cleaned_text): "decisions",
                executor.submit(self.trend_agent.run, cleaned_text): "trends",
                executor.submit(self.risk_agent.run, cleaned_text): "risks",
                executor.submit(self.sentiment_agent.run, short_text): "sentiment",
                executor.submit(self.cognitive_agent.run, cleaned_text): "cognitive",
            }

            for future in concurrent.futures.as_completed(futures):
                key = futures[future]
                try:
                    results[key] = future.result()
                except Exception as e:
                    print(f"⚠ Agent {key} failed: {e}")

        final_report = self.format_agent.run(
            summary=results["summary"],
            keywords=results["keywords"],
            trends=results["trends"],
            decisions=results["decisions"],
            report_type=report_type
        )

        filename = self._sanitize_filename(report_type)
        saved_file = render_html_report(results, filename, str(user_id))

        return {
            "success": True,
            "mode": "legacy",
            "final_report_text": final_report,
            "download_link": (
                f"{self.reports_url_prefix}{os.path.basename(saved_file)}"
                if saved_file else None
            )
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