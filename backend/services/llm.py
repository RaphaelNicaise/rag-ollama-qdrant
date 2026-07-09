from langchain_ollama import ChatOllama, OllamaEmbeddings
from config import settings

llm = ChatOllama(
    base_url=settings.OLLAMA_URL, 
    model="qwen3.5:2b", 
    temperature=0.1
)

embeddings = OllamaEmbeddings(
    base_url=settings.OLLAMA_URL,
    model="nomic-embed-text"
)