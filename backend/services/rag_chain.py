from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from services.llm import llm
from services.vector_db import retriever

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

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
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
)