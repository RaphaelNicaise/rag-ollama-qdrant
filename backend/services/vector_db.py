import os
import shutil
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from langchain_qdrant import Qdrant
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import settings
from services.llm import embeddings

client = QdrantClient(url=settings.QDRANT_URL)

vectorstore = Qdrant(
    client=client, 
    collection_name=settings.COLLECTION_NAME, 
    embeddings=embeddings
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len
)

def process_file(file_path: str, extension: str):
    """Detecta el tipo de archivo, lo procesa, lo fragmenta e indexa en Qdrant."""
    try:
        if extension in [".txt", ".md"]:
            loader = TextLoader(file_path, encoding="utf-8")
            docs = loader.load()
        elif extension == ".pdf":
            loader = PyPDFLoader(file_path)
            docs = loader.load()
        else:
            raise ValueError("Formato no soportado")

        chunks = text_splitter.split_documents(docs)

        if chunks:
            vectorstore.add_documents(chunks)
            return True
        return False

    except Exception as e:
        print(f"Error procesando el archivo: {str(e)}")
        raise e

def init_vector_db():
    """Inicializa la colección de Qdrant si está vacía."""
    try:
        if not client.collection_exists(collection_name=settings.COLLECTION_NAME):
            client.create_collection(
                collection_name=settings.COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
    except Exception as e:
        print(f"Error initializing Qdrant collection: {str(e)}")