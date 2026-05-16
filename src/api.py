"""FastAPI app exposing ingestion and GraphQA endpoints.

Lightweight factory that lazily imports heavy deps so tests can import the package
without installing FastAPI/Neo4j. Provides /ingest, /graphqa, /health and /ready.
"""
from typing import Any, Dict
import os


def create_app(neo4j_uri: str = None, neo4j_user: str = None, neo4j_password: str = None):
    try:
        from fastapi import FastAPI, HTTPException, Depends, Header
        from fastapi.middleware.cors import CORSMiddleware
        from pydantic import BaseModel
    except Exception:
        raise RuntimeError("FastAPI and Pydantic are required to run the API. Install via requirements.txt")

    app = FastAPI(title="Knowledge Graph API")

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # Allow all origins for local development
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class IngestRequest(BaseModel):
        graph: Dict[str, Any]

    class GraphQARequest(BaseModel):
        question: str

    # resolve env defaults
    neo4j_uri = neo4j_uri or os.getenv('NEO4J_URI')
    neo4j_user = neo4j_user or os.getenv('NEO4J_USER')
    neo4j_password = neo4j_password or os.getenv('NEO4J_PASSWORD')
    API_KEY = os.getenv('KG_API_KEY')

    def verify_api_key(x_api_key: str = Header(None)):
        if API_KEY:
            if not x_api_key or x_api_key != API_KEY:
                raise HTTPException(status_code=401, detail="Invalid or missing API Key")

    # Lazy construct loader and graphqa
    loader = None
    gqa = None
    if neo4j_uri:
        try:
            from src.neo4j_loader import Neo4jLoader
            from src.graphqa import GraphQA
            loader = Neo4jLoader(neo4j_uri, neo4j_user, neo4j_password)
            gqa = GraphQA(neo4j_uri, neo4j_user, neo4j_password)
        except Exception:
            # If driver missing, endpoints will return 500 until proper config is provided
            loader = None
            gqa = None

    @app.post('/ingest', dependencies=[Depends(verify_api_key)])
    def ingest(req: IngestRequest):
        if loader is None:
            raise HTTPException(status_code=500, detail="Neo4j loader not configured")
        try:
            loader.load_from_dict(req.graph)
            return {"status": "ok"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post('/graphqa', dependencies=[Depends(verify_api_key)])
    def graphqa(req: GraphQARequest):
        if gqa is None:
            raise HTTPException(status_code=500, detail="GraphQA not configured")
        try:
            out = gqa.answer(req.question)
            return out
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get('/health')
    def health():
        return {"status": "ok"}

    @app.get('/ready')
    def ready():
        # readiness: ensure Neo4j driver is available and responds to a simple query
        if loader is None:
            raise HTTPException(status_code=503, detail="Neo4j loader not configured")
        try:
            with loader.driver.session() as session:
                session.run("RETURN 1")
            return {"ready": True}
        except Exception as e:
            raise HTTPException(status_code=503, detail=str(e))

    return app
