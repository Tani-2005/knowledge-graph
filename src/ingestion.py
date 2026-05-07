import logging
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

def load_and_chunk_pdf(file_path: str, chunk_size: int = 1500, chunk_overlap: int = 250):
    """Loads a PDF and splits it into manageable overlapping chunks."""
    try:
        logger.info(f"Loading document: {file_path}")
        loader = PyPDFLoader(str(file_path))
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
        
        chunks = text_splitter.split_documents(docs)
        logger.info(f"Successfully split into {len(chunks)} chunks.")
        return chunks
        
    except Exception as e:
        logger.error(f"Error processing {file_path}: {e}")
        return []