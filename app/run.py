import os
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print("🚀 STARTING on port:", port)

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"  # ← обязательно, чтобы были логи!
    )
