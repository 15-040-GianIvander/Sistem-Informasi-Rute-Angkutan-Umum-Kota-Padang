from pydantic import BaseModel, Field
from typing import Optional


class TransitStopCreate(BaseModel):
    stop_name: str = Field(..., min_length=1, description="Nama halte transit")
    route_id: Optional[int] = Field(None, description="ID rute")
    latitude: float = Field(..., ge=-90, le=90, description="Koordinat latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Koordinat longitude")
    is_transit: bool = Field(False, description="Apakah halte transit")

class TransitStopUpdate(TransitStopCreate):
    pass
