from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from .schemas import TransitStopCreate, TransitStopUpdate
from .db import get_routes_geojson, get_stops_geojson, get_stops_nearby, get_routes_filtered, insert_stop, update_stop, delete_stop


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
def fetch_stops_geojson(
    route_id: Optional[int] = Query(None, ge=1, description="Filter by corridor/route id")
) -> dict:
    """
    Fetch all stops from database as GeoJSON FeatureCollection.
    """
    try:
        return get_stops_geojson(route_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stops: {str(exc)}")


@router.post("/api/v1/stops")
def create_stop(payload: TransitStopCreate) -> dict:
    """
    Create a new transit stop and persist to database.
    """
    try:
        feature = insert_stop(
            nama_halte=payload.stop_name,
            latitude=payload.latitude,
            longitude=payload.longitude,
            is_transit=payload.is_transit,
            route_id=payload.route_id
        )
        return {"status": "success", "data": feature}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to insert stop: {exc}")


@router.put("/api/v1/stops/{stop_id}")
def update_stop_endpoint(stop_id: int, payload: TransitStopUpdate) -> dict:
    try:
        success = update_stop(
            stop_id=stop_id,
            stop_name=payload.stop_name,
            route_id=payload.route_id,
            is_transit=payload.is_transit,
            lat=payload.latitude,
            lon=payload.longitude
        )
        if not success:
            raise HTTPException(status_code=404, detail="Halte tidak ditemukan")
        return {"status": "success", "message": f"Halte dengan ID {stop_id} berhasil diperbarui"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update stop: {exc}")


@router.delete("/api/v1/stops/{stop_id}")
def delete_stop_endpoint(stop_id: int) -> dict:
    try:
        success = delete_stop(stop_id)
        if not success:
            raise HTTPException(status_code=404, detail="Halte tidak ditemukan")
        return {"status": "success", "message": f"Halte dengan ID {stop_id} berhasil dihapus"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete stop: {exc}")


@router.get("/api/v1/stops/nearby")
def fetch_stops_nearby(
    lat: float = Query(..., description="Latitude of center point"),
    lon: float = Query(..., description="Longitude of center point"),
    radius: float = Query(500.0, ge=0, description="Radius in meters"),
    route_id: Optional[int] = Query(None, ge=1, description="Filter by corridor/route id")
) -> dict:
    """
    Return FeatureCollection of stops within specified radius (meters) of given lat/lon.
    Coordinates in GeoJSON remain [longitude, latitude].
    """
    try:
        return get_stops_nearby(lat, lon, radius, route_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch nearby stops: {str(exc)}")


@router.get("/api/v1/routes/filter")
def fetch_routes_filter(
    moda: Optional[str] = Query("all", description="Filter by moda: bus, train, or all"),
    route_id: Optional[int] = Query(None, ge=1, description="Filter by corridor/route id")
) -> dict:
    """
    Filter routes by transport mode (moda).
    Expected `moda` values: 'bus', 'train', or 'all'.
    """
    try:
        return get_routes_filtered(moda or "all", route_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to filter routes: {str(exc)}")
