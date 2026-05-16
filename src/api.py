"""FastAPI app exposing ingestion and GraphQA endpoints.

Lightweight factory that lazily imports heavy deps so tests can import the package
without installing FastAPI/Neo4j. Provides /ingest, /graphqa, /health and /ready.
"""
from typing import Any, Dict
import os
from dotenv import load_dotenv

# Load .env automatically for local development
load_dotenv()

def create_app(neo4j_uri: str = None, neo4j_user: str = None, neo4j_password: str = None):
    try:
        from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, BackgroundTasks
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
    neo4j_uri = neo4j_uri or os.getenv('NEO4J_URI', 'bolt://localhost:7687')
    neo4j_user = neo4j_user or os.getenv('NEO4J_USER', 'neo4j')
    neo4j_password = neo4j_password or os.getenv('NEO4J_PASSWORD', 'neo4j')
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
    @app.post('/upload', dependencies=[Depends(verify_api_key)])
    async def upload(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
        if loader is None:
            raise HTTPException(status_code=500, detail="Neo4j loader not configured")
        
        import tempfile
        from pathlib import Path
        import logging
        
        logger = logging.getLogger(__name__)
        temp_dir = Path(tempfile.gettempdir())
        file_path = temp_dir / file.filename
        
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        def process_pdf(path: Path):
            from src.ingestion import load_and_chunk_pdf
            from src.extraction import get_extraction_chain, process_chunk
            
            try:
                chunks = load_and_chunk_pdf(path)
                if not chunks:
                    logger.warning("No chunks extracted from PDF")
                    return
                
                extraction_chain = get_extraction_chain()
                all_nodes = {}
                all_relationships = []
                
                for chunk in chunks:
                    extracted_graph = process_chunk(chunk, extraction_chain)
                    for node in extracted_graph.nodes:
                        if node.id not in all_nodes:
                            all_nodes[node.id] = node.model_dump()
                    for rel in extracted_graph.relationships:
                        all_relationships.append(rel.model_dump())
                        
                final_output = {
                    "nodes": list(all_nodes.values()),
                    "relationships": all_relationships
                }
                
                loader.load_from_dict(final_output)
                logger.info(f"Successfully processed and loaded {path.name} to Neo4j")
            except Exception as e:
                logger.error(f"Failed to process PDF {path.name}: {e}")
            finally:
                if path.exists():
                    path.unlink()
                    
        background_tasks.add_task(process_pdf, file_path)
        return {"status": "processing", "filename": file.filename}

    @app.get('/graph', dependencies=[Depends(verify_api_key)])
    def get_graph():
        if loader is None:
            raise HTTPException(status_code=500, detail="Neo4j loader not configured")
            
        try:
            with loader.driver.session() as session:
                result = session.run("MATCH (n:Entity)-[r:REL]->(m:Entity) RETURN n, r, m LIMIT 500")
                nodes = {}
                links = []
                for record in result:
                    n = record["n"]
                    m = record["m"]
                    r = record["r"]
                    
                    if n["id"] not in nodes:
                        nodes[n["id"]] = {
                            "id": n["id"],
                            "type": n.get("type", "Entity"),
                            "label": n.get("name", n["id"]),
                            **{k: v for k, v in dict(n).items() if k not in ["id", "type", "name"]}
                        }
                    if m["id"] not in nodes:
                        nodes[m["id"]] = {
                            "id": m["id"],
                            "type": m.get("type", "Entity"),
                            "label": m.get("name", m["id"]),
                            **{k: v for k, v in dict(m).items() if k not in ["id", "type", "name"]}
                        }
                        
                    links.append({
                        "source": n["id"],
                        "target": m["id"],
                        "type": r.get("relation_type", "RELATED_TO"),
                        **{k: v for k, v in dict(r).items() if k not in ["relation_type"]}
                    })
                return {"results": {"nodes": list(nodes.values()), "relationships": links}}
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
