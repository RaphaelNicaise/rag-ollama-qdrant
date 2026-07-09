from pydantic import BaseModel
from typing import Optional


class QueryRequest(BaseModel):
    input: str

class QueryResponse(BaseModel):
    answer: str
    time_taken_seconds: Optional[float] = None
    total_tokens: Optional[int] = None