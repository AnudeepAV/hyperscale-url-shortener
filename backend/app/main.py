"""
HyperScale — main FastAPI app.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time

from app.api import auth, urls, redirect, websocket
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.db.session import engine

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", "HTTP request latency", ["method", "endpoint"]
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    setup_logging(debug=settings.DEBUG)
    logger.info("startup", env=settings.APP_ENV)
    
    # Tables should be created via Supabase SQL or Alembic migrations
    # Don't create tables on startup to avoid connection issues
    logger.info("application_ready")

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
    """Track request metrics."""
    start = time.time()
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"middleware_error: {str(e)}")
        return Response(f"ERROR: {type(e).__name__}: {str(e)}", status_code=500)
    
    duration = time.time() - start
    endpoint = request.url.path
    REQUEST_COUNT.labels(request.method, endpoint, response.status_code).inc()
    REQUEST_LATENCY.labels(request.method, endpoint).observe(duration)
    return response


# API routes (prefixed with /api/v1)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(urls.router, prefix=settings.API_V1_PREFIX)

# Redirect (no prefix — lives at root for short URLs)
app.include_router(redirect.router)

# WebSocket (real-time updates)
app.include_router(websocket.router)


@app.get("/health", tags=["health"])
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": settings.APP_NAME, "env": settings.APP_ENV}


@app.get("/metrics", include_in_schema=False)
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint."""
    return {"message": "HyperScale API", "docs": "/docs"}