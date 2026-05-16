"""Small helper to create required constraints/indexes in Neo4j.

Usage:
    from src.neo4j_setup import ensure_constraints
    ensure_constraints(uri, user, password)
"""

def ensure_constraints(uri: str, user: str, password: str):
    from neo4j import GraphDatabase

    driver = GraphDatabase.driver(uri, auth=(user, password))
    with driver.session() as session:
        # Create uniqueness constraint on Entity.id
        session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE")
    driver.close()
