import json
import logging
from src.config import RAW_DATA_DIR, PROCESSED_DATA_DIR
from src.ingestion import load_and_chunk_pdf
from src.extraction import get_extraction_chain, process_chunk
from src.neo4j_loader import Neo4jLoader
import os

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    logger.info("Initializing Knowledge Graph Extraction Pipeline...")
    
    # Initialize the LLM chain
    extraction_chain = get_extraction_chain()
    
    # Aggregated data
    all_nodes = {} # Use dict to easily deduplicate by ID
    all_relationships = []
    
    # Process all PDFs in the raw directory
    pdf_files = list(RAW_DATA_DIR.glob("*.pdf"))
    
    if not pdf_files:
        logger.warning(f"No PDFs found in {RAW_DATA_DIR}. Please add files and try again.")
        return

    for pdf_path in pdf_files:
        logger.info(f"Processing: {pdf_path.name}")
        chunks = load_and_chunk_pdf(pdf_path)
        
        for i, chunk in enumerate(chunks):
            logger.info(f"Extracting from chunk {i+1}/{len(chunks)}...")
            extracted_graph = process_chunk(chunk, extraction_chain)
            
            # Aggregate and deduplicate nodes
            for node in extracted_graph.nodes:
                if node.id not in all_nodes:
                    all_nodes[node.id] = node.model_dump()
            
            # Aggregate relationships
            for rel in extracted_graph.relationships:
                all_relationships.append(rel.model_dump())

    # Compile the final payload
    final_output = {
        "nodes": list(all_nodes.values()),
        "relationships": all_relationships
    }
    
    # Save the artifact locally
    output_path = PROCESSED_DATA_DIR / "extracted_graph.json"
    with open(output_path, "w") as f:
        json.dump(final_output, f, indent=2)
        
    logger.info(f"Pipeline complete. Artifact saved to: {output_path}")

    # Push to Neo4j
    neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password = os.getenv("NEO4J_PASSWORD", "neo4j")
    
    try:
        logger.info("Pushing data to Neo4j database...")
        loader = Neo4jLoader(neo4j_uri, neo4j_user, neo4j_password)
        loader.load_from_dict(final_output)
        loader.close()
        logger.info("Successfully loaded extracted graph into Neo4j!")
    except Exception as e:
        logger.error(f"Failed to push to Neo4j: {e}")

if __name__ == "__main__":
    main()