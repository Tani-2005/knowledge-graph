"""GraphQA: convert natural language to Cypher, execute against Neo4j, and synthesize answers.

Design:
- Simple rule-based NL->Cypher mapping for common question patterns.
- Execute Cypher using neo4j driver (lazy import). Tests mock the driver.
- Synthesize a human-friendly answer using an LLM if available (lazy import), else a template.
"""
from typing import Dict, Any, List
from . import cypher_queries
import re


def nl_to_cypher(question: str) -> str:
    q = question.lower()
    # Simple patterns
    m = re.search(r"models? (that )?use[s]? (the )?(metric )?(?P<metric>\w+)", q)
    if m:
        metric = m.group('metric')
        return cypher_queries.find_models_using_metric(metric)

    m = re.search(r"(show|find) (?:the )?neighbo?rs? of (?P<node>.+)", q)
    if m:
        node = m.group('node').strip()
        return cypher_queries.node_neighborhood(node, depth=2)

    # Default: try to return a neighborhood for the main noun phrase
    words = re.findall(r"[A-Za-z0-9\-]+", question)
    if words:
        return cypher_queries.node_neighborhood(words[-1], depth=1)

    return "MATCH (n) RETURN n LIMIT 50"


def synthesize_answer_with_llm(summary_text: str) -> str:
    """Try to synthesize with an LLM; fallback to a short template if LLM not available."""
    try:
        # Lazy import a LangChain-compatible chat LLM if available
        from langchain_google_genai import ChatGoogleGenerativeAI
        # Very small example: in production the prompt should be richer
        llm = ChatGoogleGenerativeAI(model="gemini", temperature=0.1)
        resp = llm.predict(summary_text)
        return str(resp)
    except Exception:
        # Fallback simple synthesis
        return f"Summary:\n{summary_text}"


class GraphQA:
    def __init__(self, uri: str, user: str, password: str):
        # Lazy import neo4j
        try:
            from neo4j import GraphDatabase
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
        except Exception:
            # If neo4j is unavailable, set driver to None; tests will mock this path
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def run_cypher(self, cypher: str) -> List[Dict[str, Any]]:
        if not self.driver:
            raise RuntimeError("Neo4j driver not available")
        with self.driver.session() as session:
            result = session.run(cypher)
            records = [dict(r) for r in result]
            return records

    def answer(self, question: str) -> Dict[str, Any]:
        cypher = nl_to_cypher(question)
        results = []
        if self.driver:
            with self.driver.session() as session:
                res = session.run(cypher)
                # Convert records to simple dicts
                for r in res:
                    try:
                        # r may be a Record; convert to dict-like
                        results.append({k: v for k, v in r.items()})
                    except Exception:
                        results.append(dict(r))
        else:
            # If driver not present, return empty results (tests will mock run_cypher)
            results = []

        # Build a short summary from results
        summary = f"Returned {len(results)} rows for query: {cypher}"
        answer_text = synthesize_answer_with_llm(summary)

        return {"question": question, "cypher": cypher, "results": results, "answer": answer_text}
