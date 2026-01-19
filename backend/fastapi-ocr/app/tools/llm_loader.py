# app/tools/llm_loader.py
import subprocess
import time
import requests
from typing import Optional, List

from langchain_ollama import ChatOllama
from langchain_core.callbacks import CallbackManager

OLLAMA_MODEL = "llama3"

_cached_llm = None


def is_ollama_running():
    try:
        requests.get("http://localhost:11434", timeout=1)
        return True
    except Exception:
        return False


def check_and_pull_model(model_name: str):
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True
        )
        if model_name not in result.stdout:
            print(f"⬇ Pulling Ollama model: {model_name}")
            subprocess.run(["ollama", "pull", model_name], check=True)
    except Exception as e:
        print(f"⚠ Ollama model check failed: {e}")


def _load_hf_fallback():
    # ⚠ Keep fallback SIMPLE — no structured output
    from langchain_huggingface import ChatHuggingFace

    print("🔁 Falling back to HuggingFace LLM")

    return ChatHuggingFace(
        repo_id="meta-llama/Meta-Llama-3.1-8B-Instruct",
        temperature=0.2,
        max_new_tokens=2048,
        streaming=False
    )


def load_llm(
    streaming: bool = False,
    callbacks: Optional[List] = None
):
    """
    streaming=False → cached singleton
    streaming=True  → fresh instance with callbacks
    """
    global _cached_llm

    callback_manager = CallbackManager(callbacks or [])

    # ---------- STREAMING ----------
    if streaming:
        try:
            return ChatOllama(
                base_url="http://localhost:11434",
                model=OLLAMA_MODEL,
                temperature=0.2,
                streaming=True,
                think=False,                 # 🔥 critical
                callback_manager=callback_manager,
                tools=None                  # 🔥 disable tool calling
            )
        except Exception:
            return _load_hf_fallback()

    # ---------- CACHED ----------
    if _cached_llm:
        return _cached_llm

    print("⚙ Initializing LLM...")

    try:
        if not is_ollama_running():
            print("⏳ Starting Ollama server...")
            subprocess.Popen(
                ["ollama", "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            time.sleep(3)

        check_and_pull_model(OLLAMA_MODEL)

        _cached_llm = ChatOllama(
            base_url="http://localhost:11434",
            model=OLLAMA_MODEL,
            temperature=0.2,
            streaming=False,
            think=False,                 # 🔥 critical
            callback_manager=callback_manager,
            tools=None                  # 🔥 disable tool calling
        )

        print("✔ Ollama LLM ready.")
        return _cached_llm

    except Exception as e:
        print(f"❌ Ollama failed: {e}")
        _cached_llm = _load_hf_fallback()
        return _cached_llm


# # app/tools/llm_loader.py
# import subprocess
# import time
# import requests
# from langchain_ollama import ChatOllama 
# from langchain_core.callbacks import CallbackManager, StreamingStdOutCallbackHandler

# OLLAMA_MODEL = "llama3"

# # SINGLETON VARIABLE
# _cached_llm = None

# def is_ollama_running():
#     try:
#         requests.get("http://localhost:11434", timeout=1)
#         return True
#     except:
#         return False

# def check_and_pull_model(model_name):
#     # Only check if we haven't checked before (optimization)
#     try:
#         result = subprocess.run("ollama list", shell=True, capture_output=True, text=True)
#         if model_name not in result.stdout:
#             print(f"⬇ Model '{model_name}' not found. Downloading...")
#             subprocess.run(f"ollama pull {model_name}", shell=True, check=True)
#             print(f"✔ Model '{model_name}' ready.")
#     except Exception as e:
#         print(f"⚠ Model check warning: {e}")

# def load_llm():
#     global _cached_llm
    
#     # 1. Return cached instance if it exists (Stops repetitive logs)
#     if _cached_llm is not None:
#         return _cached_llm

#     print("⚙ Initializing AI Engine (One-time setup)...")

#     # 2. Start Server
#     if not is_ollama_running():
#         print("⏳ Starting Ollama Server...")
#         subprocess.Popen(["ollama", "serve"], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
#         time.sleep(3)

#     # 3. Check Model (Runs only once now)
#     check_and_pull_model(OLLAMA_MODEL)

#     # 4. Initialize & Cache
#     try:
#         _cached_llm = ChatOllama(
#             base_url="http://localhost:11434",
#             model=OLLAMA_MODEL,
#             temperature=0.3,
#             callbacks=CallbackManager([StreamingStdOutCallbackHandler()])
#         )
#         print("✔ AI Engine Ready.")
#         return _cached_llm
#     except Exception as e:
#         print(f"❌ Error loading LLM: {e}")
#         return None