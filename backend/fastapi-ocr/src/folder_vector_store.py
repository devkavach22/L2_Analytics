import chromadb
from chromadb.utils import embedding_functions

class FolderVectorStore:
    def __init__(self, persist_dir="chroma_db"):
        self.client = chromadb.Client(
            settings=chromadb.Settings(
                persist_directory=persist_dir,
                anonymized_telemetry=False
            )
        )

        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )

        self.collection = self.client.get_or_create_collection(
            name="folder_analysis",
            embedding_function=self.embedding_function
        )

    def add_document(self, doc_id, text, metadata):
        self.collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[doc_id]
        )

    def query(self, text, n_results=5):
        return self.collection.query(
            query_texts=[text],
            n_results=n_results
        )
