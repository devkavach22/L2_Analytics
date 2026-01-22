from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("all-MiniLM-L6-v2")

async def compute_embeddings(files):
    texts = [f["text"] for f in files]
    embeddings = model.encode(texts, convert_to_tensor=True)
    return embeddings

async def similarity_matrix(embeddings):
    return util.cos_sim(embeddings, embeddings)
