from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from src.vector_store import VectorStoreManager
from app.tools.llm_loader import load_llm

VECTOR_NAMESPACE = "folder-analysis"


class FolderAnalysisAgent:
    """
    NotebookLM-style LLM agent
    Strictly grounded on vector store context
    """

    def __init__(self):
        self.llm = load_llm()
        self.store = VectorStoreManager(VECTOR_NAMESPACE).get_or_create_store()

        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an enterprise document analysis assistant.\n"
                "You MUST answer strictly from the provided context.\n"
                "If the context is insufficient, say: "
                "'Insufficient evidence in the documents.'\n"
                "Do NOT hallucinate."
            ),
            (
                "human",
                "Context:\n{context}\n\n"
                "Task:\n{question}\n\n"
                "Rules:\n"
                "- Cite facts only from the context\n"
                "- Be concise and structured\n"
            )
        ])

        self.chain = (
            self.prompt
            | self.llm
            | StrOutputParser()
        )

    def analyze(self, question: str, k: int = 8) -> str:
        """
        Run grounded analysis.
        """

        # 🔒 Retrieval with relevance
        results = self.store.similarity_search_with_relevance_scores(
            question,
            k=k
        )

        # ❌ No context → no hallucination
        if not results:
            return "Insufficient evidence in the documents."

        # 🔥 Relevance threshold (critical)
        filtered = [
            doc for doc, score in results
            if score is not None and score >= 0.65
        ]

        if not filtered:
            return "Insufficient evidence in the documents."

        # 🧠 Controlled context window
        context_chunks = []
        total_chars = 0
        MAX_CHARS = 6000

        for doc in filtered:
            chunk = doc.page_content.strip()
            if not chunk:
                continue

            total_chars += len(chunk)
            if total_chars > MAX_CHARS:
                break

            context_chunks.append(chunk)

        context = "\n\n---\n\n".join(context_chunks)

        return self.chain.invoke({
            "context": context,
            "question": question
        })
