"""Local stub for neo4j to allow tests to import/patch GraphDatabase when the real driver
is not installed. This file is intentionally minimal and should not be used in production.
"""
class GraphDatabase:
    @staticmethod
    def driver(uri, auth=None):
        raise ImportError("neo4j driver is not installed. This stub is for tests only.")
