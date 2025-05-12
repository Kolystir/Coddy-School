from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
import os
print("💡 DATABASE_URL =", os.getenv("DATABASE_URL"))

app = FastAPI()

# 1) CORS — разрешаем запросы с вашего фронтенда и (опционально) со всех origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kolystir.github.io", "https://kolystir.github.io/Coddy-School"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2) Root endpoint для health‑checks
@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok"}

# 3) Ваши API‑роуты
app.include_router(router)
