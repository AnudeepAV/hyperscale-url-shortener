"""
HyperScale — main FastAPI app.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time
import sys

from app.api import auth, urls, redirect, websocket
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.db.session import Base, engine

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", "HTTP request latency", ["method", "endpoint"]
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(debug=settings.DEBUG)
    logger.info("startup", env=settings.APP_ENV)
    
    # Auto-create tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_ready")
    except Exception as e:
        logger.error(f"database_init_failed: {str(e)}")
        sys.exit(1)

    yield
    logger.info("shutdown")
    await engine.dispose()


app = FastAPI(
    title="HyperScale URL Shortener",
    description="Production-grade URL shortener with real-time analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ===== CORS MIDDLEWARE - MUST BE FIRST AND ALLOW ALL =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow ALL origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"middleware_error: {str(e)}")
        return Response("Internal Server Error", status_code=500)
    
    duration = time.time() - start
    endpoint = request.url.path
    REQUEST_COUNT.labels(request.method, endpoint, response.status_code).inc()
    REQUEST_LATENCY.labels(request.method, endpoint).observe(duration)
    return response


# API routes (prefixed)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(urls.router, prefix=settings.API_V1_PREFIX)

# Redirect (no prefix)
app.include_router(redirect.router)

# WebSocket
app.include_router(websocket.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": settings.APP_NAME, "env": settings.APP_ENV}


@app.get("/metrics", include_in_schema=False)
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/", include_in_schema=False)
async def root():
    return {"message": "HyperScale API", "docs": "/docs"}