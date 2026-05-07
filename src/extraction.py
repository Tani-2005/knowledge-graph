import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from src.schema import KnowledgeGraph
from src.config import MODEL_NAME, GOOGLE_API_KEY

logger = logging.getLogger(__name__)

def get_extraction_chain():
    """Initializes the LLM and the structured extraction chain."""
    
    # Initialize Gemini
    llm = ChatGoogleGenerativeAI(
        model=MODEL_NAME, 
        temperature=0.1,
        google_api_key=GOOGLE_API_KEY
    )
    
    # Bind the LLM to our Pydantic schema
    structured_llm = llm.with_structured_output(KnowledgeGraph)
    
    system_prompt = """You are an expert Data Scientist extracting structured knowledge from research papers.
    Your task is to extract an ontology of entities and their relationships from the provided text.

    Strict Rules:
    1. Node IDs must be concise, capitalized, and standardized (e.g., "Acoustic Sensors" not "the acoustic sensors").
    2. Relationship types must be capitalized, snake_case verbs (e.g., "MONITORS", "CAUSES", "EVALUATED_BY").
    3. Do not extract trivial words. Focus on core methodologies, data sources, environmental factors, and metrics.
    4. Every relationship must have a valid source and target node that exists in your nodes list.
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Extract the knowledge graph from the following text chunk:\n\n{text}")
    ])
    
    return prompt | structured_llm

def process_chunk(chunk, chain):
    """Passes a single text chunk through the LLM chain."""
    try:
        result = chain.invoke({"text": chunk.page_content})
        return result
    except Exception as e:
        logger.error(f"LLM Extraction failed on chunk: {e}")
        return KnowledgeGraph() # Return empty schema on failure