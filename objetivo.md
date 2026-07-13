Objetivo es hacer un rag que este entrenado con los pdfs que le voy a pasar, para que pueda responder preguntas sobre ellos.

Un servicio python para crear un RAG (Retrieval-Augmented Generation) que pueda responder preguntas basadas en PDFs implica varios pasos.

QDRANT es una base de datos vectorial que se puede utilizar para almacenar representaciones vectoriales de documentos y realizar búsquedas eficientes.

Modelo de IA Local.

Todo dockerizado


La idea es tener un chatbot en la que puedas subirle archivos PDF y luego hacerle preguntas sobre el contenido de esos archivos. El front me gustaria usar TanStack React. Tambien 

## Arquitectura RAG Avanzada Implementada

El sistema ha evolucionado de un RAG ingenuo (Naive RAG) a un RAG Avanzado para mitigar la "alucinación" y el "ruido" en la información recuperada, aplicando las siguientes técnicas:

1. **Búsqueda Híbrida (Qdrant + FastEmbed):** Combinamos búsqueda densa/semántica (`nomic-embed-text`) con búsqueda dispersa (BM25) usando vectores dispersos de Qdrant.
2. **Chunking Semántico & Parent-Child Retriever:** Corta y busca usando pequeñas sentencias (Hijos) pero provee al LLM los bloques enteros de texto relacionados (Padres) basándose en su significado semántico.
3. **Reranking Cross-Encoder:** Usamos `BAAI/bge-reranker-base` para reordenar los 25 mejores resultados híbridos y filtrar únicamente los 5 candidatos perfectos antes de pasarlos al LLM.