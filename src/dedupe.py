"""Deduplication utilities: synonyms and canonicalization helpers."""
from typing import Dict, List, Tuple
import re

try:
    from rapidfuzz import fuzz
except Exception:
    fuzz = None

# Small synonyms map; extend this with project-specific rules
SYNONYMS: Dict[str, str] = {
    "transformers": "Transformer",
    "transformer": "Transformer",
    "cnn": "Convolutional Neural Network",
    "rnn": "Recurrent Neural Network",
}


def _base_normalize(text: str) -> str:
    """Base normalization: whitespace collapse, naive plural strip, title-case."""
    if not text:
        return text
    t = text.strip()
    t = re.sub(r"\s+", " ", t)
    if len(t) > 3 and t.endswith('s'):
        t = t[:-1]
    return t.title()


def canonicalize(text: str) -> str:
    if not text:
        return text
    key = text.strip().lower()
    if key in SYNONYMS:
        return SYNONYMS[key]
    # fallback to base normalization
    return _base_normalize(text)


def best_match(candidate: str, choices: List[str], threshold: int = 85) -> Tuple[str, int]:
    """Return the best matching choice (and score) above threshold using RapidFuzz if available."""
    if fuzz is None:
        return ("", 0)
    best = ("", 0)
    for c in choices:
        score = fuzz.token_sort_ratio(candidate, c)
        if score > best[1]:
            best = (c, score)
    if best[1] >= threshold:
        return best
    return ("", 0)
