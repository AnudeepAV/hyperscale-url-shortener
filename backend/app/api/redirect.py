"""
Redirect endpoint — the most performance-critical route in the app.

Performance contract:
- p50 < 5ms, p99 < 50ms
- 95%+ cache hit rate
- Click events written ASYNC (Celery) to never block redirect

Anti-pattern we avoid: writing the click row inline. That would add ~20ms
DB write to every redirect and tank our latency budget.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis

from app.db.session import get_db
from app.db.redis import get_redis
from app.middleware.rate_limit import get_client_ip
from app.services.url_service import URLService
from app.workers.tasks import record_click

router = APIRouter(tags=["redirect"])


@router.get("/{short_code}", include_in_schema=False)
async def redirect_to_long(
    short_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    cache: redis.Redis = Depends(get_redis),
):
    service = URLService(db, cache)
    long_url = await service.resolve(short_code)

    if not long_url:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Short URL not found or expired")

    # Get the URL row to enqueue the click event with url_id
    url = await service.get_url_by_code(short_code)

    # Fire-and-forget background task
    record_click.delay(
        url_id=url.id,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent", ""),
        referrer=request.headers.get("referer", ""),
    )

    return RedirectResponse(url=long_url, status_code=307)
