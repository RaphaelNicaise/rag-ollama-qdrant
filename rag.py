import os
import dotenv

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

dotenv.load_dotenv()

API_KEY = os.environ.get("GOOGLE_API_KEY")
print(API_KEY)


loader = TextLoader("knowledge.txt", encoding="utf-8")
docs = loader.load()


# CHUNKING (Fragmentación): Dividimos el texto en pedazos más chicos
# Esto es vital para que el modelo no se sature y busque con precisión.
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
chunks = text_splitter.split_documents(docs)

# EMBEDDINGS Y VECTOR STORE: Convertimos el texto a números (vectores) y lo guardamos
# Usamos ChromaDB en memoria (se borra al cerrar el script, ideal para practicar)
embedding = GoogleGenerativeAIEmbeddings(model="gemini-embedding-2-preview")
vectorstore = Chroma.from_documents(chunks, embedding)


# Configuramos la base de datos para que actúe como un buscador
retriever = vectorstore.as_retriever(search_kwargs={"k": 2}) #k = número de resultados que queremos obtener

print(retriever)

# Configuramos el modelo de lenguaje que responderá a nuestras preguntas
# temperatura= 0.2 significa que el modelo será más preciso y menos creativo
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)

system_prompt ="""
Eres un asistente experto. Usa los siguientes fragmentos de contexto 
recuperados para responder la pregunta. Si no sabes la respuesta, di que no la sabes.
Contexto:{context}
"""


# Creamos un prompt que combina el sistema y la pregunta del usuario
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}")
])

# Creamos la cadena de documentos que combina el prompt y el modelo de lenguaje
combine_docs_chain = create_stuff_documents_chain(llm, prompt)


# Creamos la cadena de recuperación que combina el buscador y la cadena de documentos
rag_chain = create_retrieval_chain(retriever, combine_docs_chain)

input_text = input("Pregunta: ")

response = rag_chain.invoke({"input": input_text})

print(response["answer"])