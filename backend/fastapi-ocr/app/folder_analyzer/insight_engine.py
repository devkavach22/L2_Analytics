import requests

def ask_folder_ai(context, question):
    prompt = f"""
You are a data analyst AI.

Folder context:
{context}

Question: {question}

Give analytical answer with reasoning.
"""

    res = requests.post("http://localhost:11434/api/generate", json={
        "model": "llama3",
        "prompt": prompt,
        "stream": False
    })

    return res.json()["response"]
