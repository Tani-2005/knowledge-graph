"""Map raw relation strings to a controlled vocabulary."""
from typing import Dict

RELATION_MAP: Dict[str, str] = {
    "uses": "USES",
    "use": "USES",
    "improves": "IMPROVES",
    "improves_upon": "IMPROVES",
    "is a": "IS_A",
    "is_a": "IS_A",
    "evaluated_by": "EVALUATED_BY",
    "measures": "MEASURES",
}


def canonical_relation(raw: str) -> str:
    if not raw:
        return "RELATED_TO"
    key = raw.strip().lower().replace(' ', '_')
    return RELATION_MAP.get(key, raw.strip().upper())
