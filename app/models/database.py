# app/models/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import sys

print("📡 Connecting to DB:", settings.DATABASE_URL)

try:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
except Exception as e:
    print("❌ Ошибка подключения к БД:", e, file=sys.stderr)
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
