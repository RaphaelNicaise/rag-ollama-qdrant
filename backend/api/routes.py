from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
import os
import time
import httpx
from schemas.rag import QueryRequest, QueryResponse
from services.rag_chain import rag_chain
from services.vector_db import process_file, client
from config import settings

router = APIRouter(prefix="/api")

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/ask", response_model=QueryResponse)
async def ask_rag(payload: QueryRequest):
    try:
        start_time = time.time()
        result = rag_chain.invoke(payload.input)
        end_time = time.time()
        
        time_taken = round(end_time - start_time, 2)
        
        answer_text = result.content
        
        metadata = result.response_metadata or {}
        prompt_eval_count = metadata.get("prompt_eval_count", 0)
        eval_count = metadata.get("eval_count", 0)
        total_tokens = prompt_eval_count + eval_count

        return QueryResponse(
            answer=answer_text, 
            time_taken_seconds=time_taken, 
            total_tokens=total_tokens
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".txt", ".md", ".pdf"]:
        raise HTTPException(
            status_code=400, 
            detail="Formato inválido. Solo se admiten archivos .txt, .md y .pdf"
        )
    
    temp_file_path = os.path.join(UPLOAD_DIR, filename)
    try:
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        success = process_file(temp_file_path, ext)
        
        if success:
            return {"status": "success", "message": f"'{filename}' se indexó correctamente en Qdrant."}
        else:
            raise HTTPException(status_code=500, detail="El archivo estaba vacío o no pudo procesarse.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el servidor: {str(e)}")
        
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.get("/documents")
async def list_documents():
    try:
        if not client.collection_exists(collection_name=settings.COLLECTION_NAME):
            return []

        sources: dict[str, str | None] = {}
        offset = None
        while True:
            points, next_offset = client.scroll(
                collection_name=settings.COLLECTION_NAME,
                limit=100,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )
            for point in points:
                payload = point.payload or {}
                metadata = payload.get("metadata", {})
                source = metadata.get("source")
                if source:
                    filename = os.path.basename(source)
                    if filename not in sources:
                        sources[filename] = metadata.get("indexed_at")
            if next_offset is None:
                break
            offset = next_offset

        return [
            {"filename": fname, "indexed_at": indexed_at}
            for fname, indexed_at in sources.items()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_models():
    try:
        async with httpx.AsyncClient() as http:
            response = await http.get(f"{settings.OLLAMA_URL}/api/tags")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/models/pull")
async def pull_model(body: dict):
    name = body.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Field 'name' is required.")

    async def stream():
        async with httpx.AsyncClient(timeout=None) as http:
            async with http.stream("POST", f"{settings.OLLAMA_URL}/api/pull", json={"name": name}) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    yield line + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")

@router.delete("/models/{name}")
async def delete_model(name: str):
    try:
        async with httpx.AsyncClient() as http:
            response = await http.request("DELETE", f"{settings.OLLAMA_URL}/api/delete", json={"name": name})
            response.raise_for_status()
            return response.json() if response.text else {"status": "success"}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))