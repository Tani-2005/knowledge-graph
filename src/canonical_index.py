"""Redis-backed canonical index for fast deduplication lookups."""
import os
from typing import Optional

try:
    import redis
except Exception:
    redis = None


class CanonicalIndex:
    def __init__(self, url: Optional[str] = None):
        self.url = url or os.getenv('REDIS_URL')
        self.client = None
        if self.url and redis:
            self.client = redis.from_url(self.url)

    def get(self, key: str) -> Optional[str]:
        if not self.client:
            return None
        return self.client.get(f"canonical:{key}")

    def set(self, key: str, canonical_id: str):
        if not self.client:
            return
        self.client.set(f"canonical:{key}", canonical_id)
