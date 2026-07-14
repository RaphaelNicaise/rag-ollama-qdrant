import os

class Settings:
    __instance = None
    
    def __init__(self):
        if Settings.__instance is not None:
            pass
        else:
            Settings.__instance = self

        self.OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.COLLECTION_NAME: str = "chatbot_docs"
        
    def __new__(cls):
        if cls.__instance is None:
            cls.__instance = super(Settings, cls).__new__(cls)
        return cls.__instance
    
settings = Settings()