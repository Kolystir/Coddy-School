import os
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print("🚀 STARTING on port:", port)

    # Важно! Покажем переменные, особенно БД
    print("🔑 DATABASE_URL:", os.getenv("DATABASE_URL"))
    print("🔑 SECRET_KEY:", os.getenv("SECRET_KEY"))

    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
