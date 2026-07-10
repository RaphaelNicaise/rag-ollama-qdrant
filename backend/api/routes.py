from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from qdrant_client.models import Filter, FieldCondition, MatchValue
from typing import List
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
async def upload_file(files: List[UploadFile] = File(...)):
    results = []
    success_count = 0

    for file in files:
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        
        if ext not in [".txt", ".md", ".pdf"]:
            results.append({"filename": filename, "status": "error", "message": "Formato inválido."})
            continue
        
        temp_file_path = os.path.join(UPLOAD_DIR, filename)
        try:
            with open(temp_file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
                
            success = process_file(temp_file_path, ext)
            
            if success:
                success_count += 1
                results.append({"filename": filename, "status": "success"})
            else:
                results.append({"filename": filename, "status": "error", "message": "Archivo vacío."})
                
        except Exception as e:
            results.append({"filename": filename, "status": "error", "message": str(e)})
            
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    if success_count == 0 and len(files) > 0:
        raise HTTPException(status_code=400, detail="No se pudo procesar ningún archivo.")
        
    return {
        "status": "success", 
        "message": f"{success_count} archivo(s) indexado(s) correctamente.",
        "results": results
    }

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

@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    try:
        if not client.collection_exists(collection_name=settings.COLLECTION_NAME):
            return {"status": "success"}

        source_path = os.path.join(UPLOAD_DIR, filename)
        
        client.delete(
            collection_name=settings.COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="metadata.source",
                        match=MatchValue(value=source_path)
                    )
                ]
            )
        )
        return {"status": "success", "message": f"'{filename}' eliminado."}
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