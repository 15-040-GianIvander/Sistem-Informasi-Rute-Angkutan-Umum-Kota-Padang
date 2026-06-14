from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from .schemas import RouteCreate, RouteResponse, RouteUpdate, TransitStopCreate, TransitStopUpdate
from .db import (
    create_route,
    delete_route,
    get_route_by_id,
    get_routes_geojson,
    get_routes_filtered,
    get_routes_geojson,
    get_stops_geojson,
    get_stops_nearby,
    insert_stop,
    update_route,
    update_stop,
)


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
    route_id: Optional[int] = Query(None, ge=1, description="Filter by corridor/route id"),
    moda: Optional[str] = Query("all", description="Filter by transport mode: all, bus, train")
) -> dict:
    """
    Fetch all stops from database as GeoJSON FeatureCollection.
    Can filter by route_id (corridor) or moda (transport mode).
    """
    try:
        return get_stops_geojson(route_id, moda)
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


@router.post("/api/v1/routes", response_model=RouteResponse)
def create_route_endpoint(payload: RouteCreate) -> dict:
    """
    Create a new transport route and store it in PostGIS.
    """
    try:
        route = create_route(
            route_name=payload.route_name,
            mode_id=payload.mode_id,
            color_code=payload.color_code,
            geometry=payload.geometry.model_dump() if hasattr(payload.geometry, "model_dump") else payload.geometry,
        )
        return route
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create route: {exc}")


@router.get("/api/v1/routes/{route_id}", response_model=RouteResponse)
def fetch_route(route_id: int) -> dict:
    """
    Fetch a single route by ID.
    """
    try:
        route = get_route_by_id(route_id)
        if not route:
            raise HTTPException(status_code=404, detail="Rute tidak ditemukan")
        return route
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch route: {str(exc)}")


@router.put("/api/v1/routes/{route_id}", response_model=RouteResponse)
def update_route_endpoint(route_id: int, payload: RouteUpdate) -> dict:
    """
    Update an existing route.
    """
    try:
        updated = update_route(
            route_id=route_id,
            route_name=payload.route_name,
            mode_id=payload.mode_id,
            color_code=payload.color_code,
            geometry=payload.geometry.model_dump() if hasattr(payload.geometry, "model_dump") else payload.geometry,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Rute tidak ditemukan")
        route = get_route_by_id(route_id)
        if not route:
            raise HTTPException(status_code=404, detail="Rute tidak ditemukan setelah pembaruan")
        return route
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update route: {exc}")


@router.delete("/api/v1/routes/{route_id}")
def delete_route_endpoint(route_id: int) -> dict:
    """
    Delete a route by ID.
    """
    try:
        success = delete_route(route_id)
        if not success:
            raise HTTPException(status_code=404, detail="Rute tidak ditemukan")
        return {"status": "success", "message": f"Rute dengan ID {route_id} berhasil dihapus"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete route: {exc}")
