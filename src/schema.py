from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Node(BaseModel):
    id: str = Field(description="The unique, standardized name of the entity.")
    type: str = Field(description="The category (e.g., 'Model', 'Metric', 'Ecosystem', 'Dataset').")
    # Optional flexible properties (provenance, confidence, source info)
    properties: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary node properties (provenance, confidence, etc.)")
    # Optional provenance fields
    doc_id: Optional[str] = Field(default=None)
    page: Optional[int] = Field(default=None)
    chunk_id: Optional[str] = Field(default=None)
    confidence: Optional[float] = Field(default=None, description="LLM confidence score between 0 and 1")


class Relationship(BaseModel):
    source: str = Field(description="The ID of the source node.")
    target: str = Field(description="The ID of the target node.")
    type: str = Field(description="The connection (e.g., 'USES', 'IMPACTS', 'MEASURES', 'IS_A').")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary relationship properties (provenance, confidence, evidence).")
    # Optional provenance fields on relationships
    doc_id: Optional[str] = Field(default=None)
    page: Optional[int] = Field(default=None)
    chunk_id: Optional[str] = Field(default=None)
    confidence: Optional[float] = Field(default=None)

class KnowledgeGraph(BaseModel):
    nodes: List[Node] = Field(default_factory=list, description="List of extracted entities.")
    relationships: List[Relationship] = Field(default_factory=list, description="List of relationships.")