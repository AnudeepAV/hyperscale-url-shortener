"""URL + Click models with hot-path indexes."""
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class URL(Base):
    """Short URL records. The short_code is the unique base62 identifier."""

    __tablename__ = "urls"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    short_code: Mapped[str] = mapped_column(String(16), unique=True, index=True, nullable=False)
    original_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    click_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    owner = relationship("User", back_populates="urls")
    clicks = relationship("Click", back_populates="url", cascade="all, delete-orphan")

    # Composite index for the dashboard query "give me my URLs ordered by recency"
    __table_args__ = (Index("ix_urls_owner_created", "owner_id", "created_at"),)


class Click(Base):
    """Click events — written async via Celery to avoid blocking redirects."""

    __tablename__ = "clicks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    url_id: Mapped[int] = mapped_column(ForeignKey("urls.id"), index=True, nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str] = mapped_column(String(512), nullable=True)
    referrer: Mapped[str] = mapped_column(String(512), nullable=True)
    country: Mapped[str] = mapped_column(String(2), nullable=True)
    device_type: Mapped[str] = mapped_column(String(20), nullable=True)
    browser: Mapped[str] = mapped_column(String(50), nullable=True)
    os: Mapped[str] = mapped_column(String(50), nullable=True)
    clicked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    url = relationship("URL", back_populates="clicks")

    # Critical index for time-series analytics
    __table_args__ = (Index("ix_clicks_url_time", "url_id", "clicked_at"),)
