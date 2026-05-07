"""
Rate Limiter — Token Bucket using Redis.

Why token bucket over fixed window?
- Smoother traffic shaping (no thundering herd at window boundaries)
- Allows bursts up to capacity
- O(1) per check using Redis INCR + EXPIRE

Production note: At very high QPS, use Lua scripts to make this atomic.
For our scale (free tier), INCR + EXPIRE is sufficient.
"""
from fastapi import HTTPException, Request, status
import redis.asyncio as redis

from app.core.config import settings


class RateLimiter:
    def __init__(self, cache: redis.Redis):
        self.cache = cache

    async def check(self, key: str, limit: int, window_seconds: int) -> None:
        """Increment counter; raise 429 if over limit."""
        bucket_key = f"ratelimit:{key}:{window_seconds}"
        current = await self.cache.incr(bucket_key)
        if current == 1:
            await self.cache.expire(bucket_key, window_seconds)

        if current > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: {limit} requests per {window_seconds}s",
                headers={"Retry-After": str(window_seconds)},
            )


def get_client_ip(request: Request) -> str:
    """Extract client IP from headers (handles proxies)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
