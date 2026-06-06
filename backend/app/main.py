from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .db import test_db_connection
from .routes import router as api_router


load_dotenv()


app = FastAPI(
    title="Sistem Informasi Rute Angkutan Umum Kota Padang - Mock API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def root() -> dict:
    return {"message": "Mock GIS API for Kota Padang is running"}


@app.get("/api/v1/db/ping")
def db_ping() -> dict:
    try:
        payload = test_db_connection()
        return {"status": "success", "data": payload}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {exc}")
