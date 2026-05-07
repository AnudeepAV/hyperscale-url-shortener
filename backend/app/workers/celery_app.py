"""Celery app — async task processor."""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "hyperscale",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=4,
    task_track_started=True,
    task_time_limit=30,
    task_soft_time_limit=20,
)
