from pydantic import BaseModel, Field
from typing import List

class Node(BaseModel):
    id: str = Field(description="The unique, standardized name of the entity.")
    type: str = Field(description="The category (e.g., 'Model', 'Metric', 'Ecosystem', 'Dataset').")

class Relationship(BaseModel):
    source: str = Field(description="The ID of the source node.")
    target: str = Field(description="The ID of the target node.")
    type: str = Field(description="The connection (e.g., 'USES', 'IMPACTS', 'MEASURES', 'IS_A').")

class KnowledgeGraph(BaseModel):
    nodes: List[Node] = Field(default_factory=list, description="List of extracted entities.")
    relationships: List[Relationship] = Field(default_factory=list, description="List of relationships.")