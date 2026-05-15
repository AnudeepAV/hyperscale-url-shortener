"""Initialize database tables."""
import asyncio
from app.db.session import Base, engine
from app.core.config import settings

async def init_db():
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())