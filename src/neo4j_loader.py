"""Neo4j loader: validates LLM output and loads nodes/relationships into Neo4j with deduplication."""
from typing import Dict, Any, List
import re
from src.dedupe import canonicalize, best_match
from src.canonical_index import CanonicalIndex
from src.relation_map import canonical_relation




# Note: normalization is implemented in src.dedupe.canonicalize to avoid circular imports


class Neo4jLoader:
    def __init__(self, uri: str, user: str, password: str):
        # Lazy import to avoid hard dependency at module import time
        from neo4j import GraphDatabase

        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        # optional canonical index
        try:
            self.cindex = CanonicalIndex()
        except Exception:
            self.cindex = None

    def close(self):
        self.driver.close()

    def _merge_node_tx(self, tx, node: Dict[str, Any]):
        # Use a MERGE on a canonical id and set type as a label property
        raw_id = node.get("id")
        nid = canonicalize(raw_id)
        # Try Redis canonical index first
        try:
            if self.cindex and self.cindex.client:
                cached = self.cindex.get(nid.lower())
                if cached:
                    nid = cached.decode() if isinstance(cached, bytes) else cached
                    return
        except Exception:
            pass

        # Attempt to find a fuzzy match among existing ids in the DB (fallback)
        try:
            res = tx.run("MATCH (n:Entity) RETURN n.id as id LIMIT 1000")
            existing = [r["id"] for r in res]
            match, score = best_match(nid, existing)
            if match:
                nid = match
        except Exception:
            # If the query fails (e.g., missing DB), continue with canonical id
            pass
        ntype = node.get("type", "Entity")
        props = dict(node.get("properties", {}))
        # Pull out provenance fields if present
        doc_id = node.get('doc_id') or props.pop('doc_id', None)
        page = node.get('page') or props.pop('page', None)
        chunk_id = node.get('chunk_id') or props.pop('chunk_id', None)
        confidence = node.get('confidence') or props.pop('confidence', None)
        # Always store the canonical id and type
        props.update({"id": nid, "name": nid, "type": ntype})
        # Parameterized set of properties
        set_clause = ", ".join([f"n.{k} = $props.{k}" for k in props.keys()])
        cypher = f"MERGE (n:Entity {{id: $id}}) SET {set_clause} RETURN id(n)"
        tx.run(cypher, id=nid, props=props)

        # Create/attach Document provenance if present
        if doc_id:
            try:
                tx.run("MERGE (d:Document {id: $doc_id}) SET d.last_seen = timestamp()", doc_id=doc_id)
                tx.run("MATCH (n:Entity {id: $nid}), (d:Document {id: $doc_id}) MERGE (n)-[:HAS_SOURCE {page: $page, chunk_id: $chunk_id, confidence: $confidence}]->(d)", nid=nid, doc_id=doc_id, page=page, chunk_id=chunk_id, confidence=confidence)
            except Exception:
                pass
        # store in canonical index
        try:
            if self.cindex and self.cindex.client:
                self.cindex.set(nid.lower(), nid)
        except Exception:
            pass

    def _create_relationship_tx(self, tx, rel: Dict[str, Any]):
        source = canonicalize(rel.get("source"))
        target = canonicalize(rel.get("target"))
        rtype = canonical_relation(rel.get("type", "RELATED_TO"))
        rprops = dict(rel.get("properties", {}))
        # Store the relation type as a property and use a generic REL relationship to avoid dynamic cypher types
        rprops.update({"relation_type": rtype})
        # Ensure provenance/source nodes if provided in properties
        src_info = rprops.get('source')
        doc_id = rel.get('doc_id') or rprops.pop('doc_id', None)
        page = rel.get('page') or rprops.pop('page', None)
        chunk_id = rel.get('chunk_id') or rprops.pop('chunk_id', None)
        confidence = rel.get('confidence') or rprops.pop('confidence', None)
        if src_info:
            try:
                tx.run("MERGE (s:Source {id: $sid}) SET s += $sprops", sid=src_info.get('id', src_info), sprops=src_info)
                tx.run("MATCH (s:Source {id: $sid}), (b:Entity {id: $target}) MERGE (b)-[:HAS_SOURCE]->(s)", sid=src_info.get('id', src_info), target=target)
            except Exception:
                pass

        tx.run(
            "MATCH (a:Entity {id: $source}), (b:Entity {id: $target}) "
            "MERGE (a)-[r:REL]->(b) SET r += $rprops RETURN type(r)",
            source=source,
            target=target,
            rprops=rprops,
        )

        # Attach provenance to relationship if provided
        if doc_id:
            try:
                tx.run("MERGE (d:Document {id: $doc_id}) SET d.last_seen = timestamp()", doc_id=doc_id)
                tx.run("MATCH (a:Entity {id: $source})-[r:REL]->(b:Entity {id: $target}), (d:Document {id: $doc_id}) SET r.doc_id = $doc_id, r.page = $page, r.chunk_id = $chunk_id, r.confidence = $confidence", source=source, target=target, doc_id=doc_id, page=page, chunk_id=chunk_id, confidence=confidence)
            except Exception:
                pass

    def load_from_dict(self, data: Dict[str, Any]) -> None:
        """Validate dictionary with Pydantic, then load nodes+relationships into Neo4j."""
        # Lazy import Pydantic schema to avoid requiring pydantic at module import
        try:
            from pydantic import ValidationError
            from src.schema import KnowledgeGraph

            kg = KnowledgeGraph.model_validate(data)
        except ImportError:
            # If pydantic isn't installed in the environment, try a permissive path
            # Accept raw dicts with 'nodes' and 'relationships'
            kg = data
        except ValidationError:
            raise

        with self.driver.session() as session:
            # Merge nodes first
            nodes = getattr(kg, 'nodes', None) or kg.get('nodes', [])
            for node in nodes:
                # node can be a Pydantic model or dict
                nd = node.model_dump() if hasattr(node, 'model_dump') else node
                session.write_transaction(self._merge_node_tx, nd)

            # Then create relationships
            rels = getattr(kg, 'relationships', None) or kg.get('relationships', [])
            for rel in rels:
                rd = rel.model_dump() if hasattr(rel, 'model_dump') else rel
                session.write_transaction(self._create_relationship_tx, rd)
