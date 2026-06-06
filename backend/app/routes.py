from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from .schemas import TransitStopCreate
from .db import get_routes_geojson, get_stops_geojson, get_stops_nearby, get_routes_filtered, insert_stop


router = APIRouter()


@router.get("/api/v1/routes/geojson")
def fetch_routes_geojson() -> dict:
    """
    Fetch all routes from database as GeoJSON.
    """
    try:
        return get_routes_geojson()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch routes: {str(exc)}")


@router.get("/api/v1/stops/geojson")
def fetch_stops_geojson() -> dict:
    """
    Fetch all stops from database as GeoJSON.
    """
    try:
        return get_stops_geojson()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stops: {str(exc)}")


@router.post("/api/v1/stops")
def create_stop(payload: TransitStopCreate) -> dict:
    """
    Create a new transit stop and persist to database.
    """
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()

    try:
        nama = data.get("nama_halte")
        lat = float(data.get("latitude"))
        lon = float(data.get("longitude"))
        fasilitas = data.get("fasilitas")

        feature = insert_stop(nama, lat, lon, fasilitas=fasilitas)
        return {"status": "success", "data": feature}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to insert stop: {exc}")


@router.get("/api/v1/stops/nearby")
def fetch_stops_nearby(
    lat: float = Query(..., description="Latitude of center point"),
    lon: float = Query(..., description="Longitude of center point"),
    radius: float = Query(500.0, ge=0, description="Radius in meters")
) -> dict:
    """
    Return FeatureCollection of stops within specified radius (meters) of given lat/lon.
    Coordinates in GeoJSON remain [longitude, latitude].
    """
    try:
        return get_stops_nearby(lat, lon, radius)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch nearby stops: {str(exc)}")


@router.get("/api/v1/routes/filter")
def fetch_routes_filter(
    moda: Optional[str] = Query("all", description="Filter by moda: bus, train, or all")
) -> dict:
    """
    Filter routes by transport mode (moda).
    Expected `moda` values: 'bus', 'train', or 'all'.
    """
    try:
        return get_routes_filtered(moda or "all")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to filter routes: {str(exc)}")
