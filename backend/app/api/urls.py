"""URL management endpoints."""
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis

from app.api.deps import get_current_user, get_optional_user
from app.core.config import settings
from app.db.session import get_db
from app.db.redis import get_redis
from app.middleware.rate_limit import RateLimiter, get_client_ip
from app.models.user import User
from app.schemas.url import URLCreate, URLResponse, AnalyticsSummary
from app.services.url_service import URLService

router = APIRouter(prefix="/urls", tags=["urls"])


def _to_response(url, base_url: str) -> dict:
    return {
        "id": url.id,
        "short_code": url.short_code,
        "short_url": f"{base_url}/{url.short_code}",
        "original_url": url.original_url,
        "title": url.title,
        "click_count": url.click_count,
        "is_active": url.is_active,
        "created_at": url.created_at,
        "expires_at": url.expires_at,
    }


@router.post("", response_model=URLResponse, status_code=201)
async def create_url(
    data: URLCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    cache: redis.Redis = Depends(get_redis),
    user: Optional[User] = Depends(get_optional_user),
):
    # Rate limit by IP for anonymous, by user_id for authenticated
    limiter = RateLimiter(cache)
    rl_key = f"user:{user.id}" if user else f"ip:{get_client_ip(request)}"
    await limiter.check(rl_key, settings.RATE_LIMIT_PER_MINUTE, 60)

    service = URLService(db, cache)
    try:
        url = await service.create_short_url(data, user_id=user.id if user else None)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    return _to_response(url, settings.SHORT_URL_DOMAIN)


@router.get("", response_model=List[URLResponse])
async def list_my_urls(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    cache: redis.Redis = Depends(get_redis),
    user: User = Depends(get_current_user),
):
    service = URLService(db, cache)
    urls = await service.get_user_urls(user.id, limit=limit, offset=offset)
    return [_to_response(u, settings.SHORT_URL_DOMAIN) for u in urls]


@router.delete("/{url_id}", status_code=204)
async def delete_url(
    url_id: int,
    db: AsyncSession = Depends(get_db),
    cache: redis.Redis = Depends(get_redis),
    user: User = Depends(get_current_user),
):
    service = URLService(db, cache)
    ok = await service.delete_url(url_id, user.id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "URL not found")


@router.get("/{short_code}/analytics", response_model=AnalyticsSummary)
async def get_analytics(
    short_code: str,
    db: AsyncSession = Depends(get_db),
    cache: redis.Redis = Depends(get_redis),
    user: User = Depends(get_current_user),
):
    service = URLService(db, cache)
    data = await service.get_analytics(short_code, user_id=user.id)
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "URL not found or not yours")
    return data
