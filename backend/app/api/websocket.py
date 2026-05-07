"""
WebSocket endpoint for real-time analytics.

Architecture: Celery worker writes click -> publishes to Redis pub/sub
-> WebSocket clients subscribed to that channel get pushed the event.

This is the same pattern Slack/Discord use for live updates.
"""
import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.logging import logger
from app.db.redis import redis_client

router = APIRouter()


@router.websocket("/ws/clicks/{short_code}")
async def websocket_clicks(websocket: WebSocket, short_code: str):
    """Stream live click events for a short_code to the dashboard."""
    await websocket.accept()
    pubsub = redis_client.pubsub()
    channel = f"clicks:{short_code}"
    await pubsub.subscribe(channel)
    logger.info("ws_connected", channel=channel)

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message["type"] == "message":
                await websocket.send_text(message["data"])
            await asyncio.sleep(0.01)
    except WebSocketDisconnect:
        logger.info("ws_disconnected", channel=channel)
    except Exception as e:
        logger.error("ws_error", error=str(e), channel=channel)
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
