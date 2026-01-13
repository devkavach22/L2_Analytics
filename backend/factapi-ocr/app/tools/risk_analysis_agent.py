from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .llm_loader import load_llm

class RiskAnalysisAgent:
    """
    Produces threat/risk assessment.
    """

    def __init__(self):
        self.llm = load_llm()
        self.prompt = PromptTemplate.from_template(
            """
You are performing a risk and threat assessment.

Assess:
- Potential risks
- Severity level (Low / Medium / High)
- Indicators supporting the risk

Be factual and cautious.

DOCUMENT:
{content}
"""
        )

    def run(self, text: str):
        score = 0
        t = text.lower()

        for k in ["weapon", "kill", "attack", "crime"]:
            if k in t:
                score += 2

        if "planning" in t or "meeting" in t:
            score += 1

        level = "Low"
        if score >= 5:
            level = "High"
        elif score >= 3:
            level = "Medium"

        return {
            "risk_score": score,
            "risk_level": level
        }




# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser
# from .llm_loader import load_llm

# class RiskAnalysisAgent:
#     def __init__(self):
#         self.llm = load_llm()

#     def run(self, context_input: str):
#         """
#         Analyzes the text for potential risks, liabilities, and compliance issues.
#         """
#         try:
#             # specialized prompt for risk detection
#             prompt = PromptTemplate(
#                 template="""
#                 You are a Senior Risk & Compliance Auditor. 
#                 Analyze the following document context and identify potential risks.

#                 Input Context:
#                 {context}

#                 Instructions:
#                 1. Identify **Financial Risks** (hidden costs, penalties, ambiguous pricing).
#                 2. Identify **Legal & Compliance Risks** (missing clauses, vague terms, GDPR/regulator violations).
#                 3. Identify **Operational/Security Risks** (data leaks, unsafe practices).
#                 4. Assign a **Risk Level** (High/Medium/Low) for the overall document.

#                 Format the output strictly as HTML with the following structure:
#                 <div class='risk-report'>
#                     <h3>⚠ Risk Assessment</h3>
#                     <p><strong>Overall Risk Level:</strong> <span class='risk-level'>[Insert Level]</span></p>
#                     <ul>
#                         <li><strong>Financial:</strong> [Key financial risk or "None detected"]</li>
#                         <li><strong>Legal:</strong> [Key legal risk or "None detected"]</li>
#                         <li><strong>Operational:</strong> [Key operational risk or "None detected"]</li>
#                     </ul>
#                     <p><strong>Critical Warning:</strong> [Most urgent warning if any]</p>
#                 </div>

#                 Keep the analysis concise and professional.
#                 """,
#                 input_variables=["context"]
#             )

#             chain = prompt | self.llm | StrOutputParser()
#             result = chain.invoke({"context": context_input})
#             return result

#         except Exception as e:
#             print(f"❌ Risk Agent Error: {e}")
#             return "<p>Error generating risk analysis.</p>"