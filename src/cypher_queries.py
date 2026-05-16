"""Reusable Cypher queries for the knowledge graph retrievals."""

def find_models_using_metric(metric_name: str) -> str:
    metric = metric_name.replace("'", "\\'")
    q = (
        "MATCH (m:Entity)-[r]->(met:Entity {id: '" + metric.title() + "'}) "
        "WHERE m.type = 'Model' OR m.type = 'Algorithm' "
        "RETURN m.id as model, type(r) as relation, met.id as metric LIMIT 100"
    )
    return q

def node_neighborhood(node_id: str, depth: int = 2) -> str:
    nid = node_id.replace("'", "\\'")
    q = (
        f"MATCH (n:Entity {{id: '{nid.title()}'}})-[r*1..{depth}]-(m) "
        "RETURN DISTINCT n, r, m LIMIT 100"
    )
    return q
