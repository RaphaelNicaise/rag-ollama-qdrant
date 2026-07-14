from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_community.document_compressors.flashrank_rerank import FlashrankRerank
from langchain_classic.retrievers import ContextualCompressionRetriever

from services.llm import llm
from services.vector_db import parent_child_retriever


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# FlashRank: un reranker ultra ligero (usa ONNX) que no requiere PyTorch
compressor = FlashrankRerank(top_n=5)

# le pedimos al retriever base (hibrido ahora), que traiga 25 documentos
parent_child_retriever.search_kwargs = {"k": 25}

# Compression Retriever envuelve el retriever base y le aplica el re-ordenamiento
# agarramos los 25 documentos y los re-ordenamos para quedarnos con los 5 más relevantes, y asi pasarselos al LLM
advanced_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=parent_child_retriever
)

system_prompt = """
Eres un asistente experto. Usa los siguientes fragmentos de contexto para responder la pregunta.

Contexto:
{context}
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{question}")
])

rag_chain = (
    {"context": advanced_retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
)