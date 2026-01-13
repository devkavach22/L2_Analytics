# app/tools/llm_loader.py
import subprocess
import time
import requests
from langchain_ollama import ChatOllama 
from langchain_core.callbacks import CallbackManager, StreamingStdOutCallbackHandler

OLLAMA_MODEL = "llama3"

# SINGLETON VARIABLE
_cached_llm = None

def is_ollama_running():
    try:
        requests.get("http://localhost:11434", timeout=1)
        return True
    except:
        return False

def check_and_pull_model(model_name):
    # Only check if we haven't checked before (optimization)
    try:
        result = subprocess.run("ollama list", shell=True, capture_output=True, text=True)
        if model_name not in result.stdout:
            print(f"⬇ Model '{model_name}' not found. Downloading...")
            subprocess.run(f"ollama pull {model_name}", shell=True, check=True)
            print(f"✔ Model '{model_name}' ready.")
    except Exception as e:
        print(f"⚠ Model check warning: {e}")

def load_llm():
    global _cached_llm
    
    # 1. Return cached instance if it exists (Stops repetitive logs)
    if _cached_llm is not None:
        return _cached_llm

    print("⚙ Initializing AI Engine (One-time setup)...")

    # 2. Start Server
    if not is_ollama_running():
        print("⏳ Starting Ollama Server...")
        subprocess.Popen(["ollama", "serve"], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(3)

    # 3. Check Model (Runs only once now)
    check_and_pull_model(OLLAMA_MODEL)

    # 4. Initialize & Cache
    try:
        _cached_llm = ChatOllama(
            base_url="http://localhost:11434",
            model=OLLAMA_MODEL,
            temperature=0.3,
            callbacks=CallbackManager([StreamingStdOutCallbackHandler()])
        )
        print("✔ AI Engine Ready.")
        return _cached_llm
    except Exception as e:
        print(f"❌ Error loading LLM: {e}")
        return None