from pydantic import BaseModel, Field


class TransitStopCreate(BaseModel):
    nama_halte: str = Field(..., min_length=1, description="Nama halte transit")
    latitude: float = Field(..., ge=-90, le=90, description="Koordinat latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Koordinat longitude")
    fasilitas: str = Field(..., min_length=1, description="Fasilitas halte")
