import json
from src.extraction import get_extraction_chain
from src.schema import KnowledgeGraph

def run_test():
    # 1. A dense, synthetic abstract designed to test entity extraction
    sample_text = """
    Retrieval-Augmented Generation (RAG) is an architecture that optimizes the output of a Large Language Model (LLM). 
    To retrieve relevant context, RAG relies on Vector Databases, such as Pinecone or Milvus. 
    These databases store text as high-dimensional embeddings. The LLM then synthesizes the retrieved embeddings 
    to reduce hallucination and improve factual accuracy.
    """

    print("Initializing extraction chain...")
    chain = get_extraction_chain()
    
    print("Running extraction on sample text...")
    try:
        # We pass a mock "chunk" object with a page_content attribute
        class MockChunk:
            def __init__(self, text):
                self.page_content = text
                
        chunk = MockChunk(sample_text)
        result = chain.invoke({"text": chunk.page_content})
        
        # 2. Print the result as formatted JSON to verify the schema
        print("\n--- EXTRACTION RESULT ---")
        print(json.dumps(result.model_dump(), indent=2))
        
    except Exception as e:
        print(f"\nTest failed: {e}")

if __name__ == "__main__":
    run_test()