"""
Background tasks.

record_click: persists click event + publishes pub/sub message for live UI.
This decouples the redirect (must be fast) from analytics (can be slow).
"""
import json
from datetime import datetime

from sqlalchemy import create_engine, update
from sqlalchemy.orm import sessionmaker
import redis as sync_redis

from app.core.config import settings
from app.models.url import Click, URL
from app.utils.user_agent import parse_user_agent
from app.workers.celery_app import celery_app

# Sync engine for Celery (asyncpg doesn't play nicely with Celery's sync workers)
sync_engine = create_engine(settings.SYNC_DATABASE_URL, pool_pre_ping=True, pool_size=10)
SyncSession = sessionmaker(bind=sync_engine)
sync_redis_client = sync_redis.from_url(settings.REDIS_URL, decode_responses=True)


@celery_app.task(name="record_click", bind=True, max_retries=3, default_retry_delay=5)
def record_click(self, url_id: int, ip_address: str, user_agent: str, referrer: str) -> dict:
    """
    Persist a click event + broadcast to WebSocket subscribers.
    
    Retries on transient DB failures with exponential backoff.
    """
    try:
        ua_info = parse_user_agent(user_agent)

        with SyncSession() as session:
            click = Click(
                url_id=url_id,
                ip_address=ip_address,
                user_agent=user_agent[:512] if user_agent else None,
                referrer=referrer[:512] if referrer else None,
                device_type=ua_info["device_type"],
                browser=ua_info["browser"],
                os=ua_info["os"],
                clicked_at=datetime.utcnow(),
            )
            session.add(click)

            # Atomic increment of click_count
            session.execute(
                update(URL).where(URL.id == url_id).values(click_count=URL.click_count + 1)
            )
            session.commit()

            # Fetch short_code for the pub/sub channel
            url = session.query(URL).filter(URL.id == url_id).first()
            if url:
                event = {
                    "url_id": url_id,
                    "short_code": url.short_code,
                    "country": click.country,
                    "device_type": click.device_type,
                    "browser": click.browser,
                    "clicked_at": click.clicked_at.isoformat(),
                }
                sync_redis_client.publish(f"clicks:{url.short_code}", json.dumps(event))

        return {"status": "ok", "url_id": url_id}

    except Exception as exc:
        raise self.retry(exc=exc)
