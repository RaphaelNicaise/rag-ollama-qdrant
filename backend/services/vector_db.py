import os

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams
from langchain_qdrant import QdrantVectorStore, FastEmbedSparse
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_experimental.text_splitter import SemanticChunker
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore

from config import settings
from services.llm import embeddings

client = QdrantClient(url=settings.QDRANT_URL)

# busqueda hibrida (modelo para generar vectores dispersos) (palabras clave/bm25)
sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

# soporte hibrido ahora
vectorstore = QdrantVectorStore(
    client=client, 
    collection_name=settings.COLLECTION_NAME, 
    embeddings=embeddings,
    sparse_embeddings=sparse_embeddings, 
    retrieval_mode="hybrid"
)

# semantic chunking (crea fragmentos basados en cambios de significado en el texto, en lugar de solo tamaño fijo)
parent_splitter=SemanticChunker(embeddings, breakpoint_threshold_type="percentile")

# child splitter (divide los fragmentos en partes más pequeñas para cumplir con los límites de tokens)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)

store = InMemoryStore()

# retriever que permite recuperar documentos padres e hijos, útil para mantener el contexto en la búsqueda
parent_child_retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=store,
    parent_splitter=parent_splitter,
    child_splitter=child_splitter
)

def process_file(file_path: str, extension: str):
    """ Procesa e indexa usando Semantic Chunking y Parent-Child. """
    try:
        if extension in [".txt", ".md"]:
            loader = TextLoader(file_path, encoding="utf-8")
            docs = loader.load()
        elif extension == ".pdf":
            loader = PyPDFLoader(file_path)
            docs = loader.load()
        else:
            raise ValueError("Formato no soportado")
    
        if docs:
            # Indexa los documentos en Qdrant usando el retriever de padres e hijos
            parent_child_retriever.add_documents(docs)
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
                sparse_vectors_config={"langchain_sparse": models.SparseVectorsConfig()}
            )
    except Exception as e:
        print(f"Error initializing Qdrant collection: {str(e)}")