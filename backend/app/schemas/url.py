"""URL Pydantic schemas."""
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field


class URLCreate(BaseModel):
    original_url: HttpUrl
    title: str | None = None
    custom_code: str | None = Field(default=None, min_length=3, max_length=16, pattern=r"^[a-zA-Z0-9_-]+$")
    expires_at: datetime | None = None


class URLResponse(BaseModel):
    id: int
    short_code: str
    short_url: str
    original_url: str
    title: str | None
    click_count: int
    is_active: bool
    created_at: datetime
    expires_at: datetime | None

    class Config:
        from_attributes = True


class ClickEvent(BaseModel):
    """Real-time click event broadcast over WebSocket."""
    url_id: int
    short_code: str
    country: str | None
    device_type: str | None
    browser: str | None
    clicked_at: datetime


class AnalyticsSummary(BaseModel):
    total_clicks: int
    unique_visitors: int
    top_countries: list[dict]
    top_devices: list[dict]
    top_browsers: list[dict]
    clicks_over_time: list[dict]
