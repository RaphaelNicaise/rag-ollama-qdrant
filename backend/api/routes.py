from fastapi import APIRouter, HTTPException, UploadFile, File
import os
import time
from schemas.rag import QueryRequest, QueryResponse
from services.rag_chain import rag_chain
from services.vector_db import process_file

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