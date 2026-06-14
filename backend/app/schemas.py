from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class GeoJSONLineString(BaseModel):
    type: Literal["LineString"] = Field(..., description="GeoJSON geometry type")
    coordinates: List[List[float]] = Field(
        ..., min_length=2, description="Array of [longitude, latitude] coordinate pairs"
    )


class RouteProperties(BaseModel):
    id: int = Field(..., description="Route ID")
    nama_armada: str = Field(..., description="Nama rute")
    jenis: Optional[str] = Field(None, description="Jenis moda transportasi")
    color_code: Optional[str] = Field(None, description="Kode warna untuk tampilan rute")
    mode_id: Optional[int] = Field(None, description="Referensi transport mode")


class RouteCreate(BaseModel):
    route_name: str = Field(..., min_length=1, description="Nama rute")
    mode_id: int = Field(..., ge=1, description="ID moda transportasi")
    color_code: Optional[str] = Field(None, max_length=10, description="Warna rute")
    geometry: GeoJSONLineString = Field(..., description="GeoJSON LineString geometri rute")


class RouteUpdate(BaseModel):
    route_name: Optional[str] = Field(None, min_length=1, description="Nama rute")
    mode_id: Optional[int] = Field(None, ge=1, description="ID moda transportasi")
    color_code: Optional[str] = Field(None, max_length=10, description="Warna rute")
    geometry: Optional[GeoJSONLineString] = Field(None, description="GeoJSON LineString geometri rute")


class RouteResponse(BaseModel):
    type: Literal["Feature"] = Field("Feature", description="GeoJSON feature type")
    id: str = Field(..., description="UUID-like feature identifier")
    properties: RouteProperties = Field(..., description="Property metadata untuk rute")
    geometry: GeoJSONLineString = Field(..., description="GeoJSON LineString geometri rute")


class TransitStopCreate(BaseModel):
    stop_name: str = Field(..., min_length=1, description="Nama halte transit")
    route_id: Optional[int] = Field(None, description="ID rute")
    latitude: float = Field(..., ge=-90, le=90, description="Koordinat latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Koordinat longitude")
    is_transit: bool = Field(False, description="Apakah halte transit")


class TransitStopUpdate(TransitStopCreate):
    pass
