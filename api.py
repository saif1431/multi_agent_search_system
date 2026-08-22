from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import RateLimitError
from pydantic import BaseModel, Field

from pipeline import run

app = FastAPI(title="Multi-Agent Research API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)


class ResearchResponse(BaseModel):
    answer: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/research", response_model=ResearchResponse)
def research(request: ResearchRequest) -> ResearchResponse:
    try:
        answer = run(request.question)
    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="The Groq API rate limit was hit. Please wait a few seconds and try again.",
        )
    return ResearchResponse(answer=answer)
