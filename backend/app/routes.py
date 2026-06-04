from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import math

from .schemas import TransitStopCreate


router = APIRouter()


ROUTES_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "id": "route-trans-padang",
            "properties": {
                "id": "route-trans-padang",
                "nama_armada": "Trans Padang Line",
                "jenis": "Bus Rapid Transit",
                "color_code": "#0f766e",
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [100.3507, -0.9291],
                    [100.3582, -0.9376],
                    [100.3679, -0.9448],
                    [100.3804, -0.9536],
                    [100.3936, -0.9499],
                    [100.4068, -0.9432],
                    [100.4194, -0.9394],
                ],
            },
        },
        {
            "type": "Feature",
            "id": "route-local-train",
            "properties": {
                "id": "route-local-train",
                "nama_armada": "Local Train Line",
                "jenis": "Kereta Lokal",
                "color_code": "#b45309",
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [100.3398, -0.9512],
                    [100.3475, -0.9478],
                    [100.3561, -0.9417],
                    [100.3669, -0.9365],
                    [100.3788, -0.9318],
                    [100.3909, -0.9289],
                ],
            },
        },
    ],
}


STOPS_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "id": "stop-rimbo-kaluang",
            "properties": {
                "id": "stop-rimbo-kaluang",
                "nama_halte": "Halte Rimbo Kaluang",
                "fasilitas": "Shelter, kursi tunggu, papan informasi",
            },
            "geometry": {
                "type": "Point",
                "coordinates": [100.3628, -0.9491],
            },
        },
        {
            "type": "Feature",
            "id": "stop-bundaran-air-manis",
            "properties": {
                "id": "stop-bundaran-air-manis",
                "nama_halte": "Halte Bundaran Air Manis",
                "fasilitas": "Atap pelindung, rambu halte, lampu penerangan",
            },
            "geometry": {
                "type": "Point",
                "coordinates": [100.3719, -0.9587],
            },
        },
        {
            "type": "Feature",
            "id": "stop-pasar-raya-padang",
            "properties": {
                "id": "stop-pasar-raya-padang",
                "nama_halte": "Halte Pasar Raya Padang",
                "fasilitas": "Area naik turun penumpang, kursi tunggu, petunjuk arah",
            },
            "geometry": {
                "type": "Point",
                "coordinates": [100.3604, -0.9482],
            },
        },
    ],
}


@router.get("/api/v1/routes/geojson")
def get_routes_geojson() -> dict:
    return ROUTES_GEOJSON


@router.get("/api/v1/stops/geojson")
def get_stops_geojson() -> dict:
    return STOPS_GEOJSON


@router.post("/api/v1/stops")
def create_stop(payload: TransitStopCreate) -> dict:
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    return {"status": "success", "data": data}


def _haversine_distance_meters(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    # Returns distance in meters between two lon/lat pairs using Haversine formula
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.get("/api/v1/stops/nearby")
def get_stops_nearby(lat: float = Query(..., description="Latitude of center point"),
                    lon: float = Query(..., description="Longitude of center point"),
                    radius: float = Query(500.0, ge=0, description="Radius in meters")) -> dict:
    """
    Return FeatureCollection of stops within `radius` meters of (lon, lat).
    Coordinates in GeoJSON remain [longitude, latitude].
    """
    try:
        center_lat = float(lat)
        center_lon = float(lon)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid lat/lon values")

    matches = []
    for feat in STOPS_GEOJSON.get("features", []):
        coords = feat.get("geometry", {}).get("coordinates")
        if not coords or len(coords) < 2:
            continue
        feat_lon, feat_lat = coords[0], coords[1]
        dist_m = _haversine_distance_meters(center_lon, center_lat, feat_lon, feat_lat)
        if dist_m <= float(radius):
            # shallow copy of feature and properties to add distance
            fcopy = {
                "type": "Feature",
                "id": feat.get("id"),
                "properties": {**feat.get("properties", {}), "distance_m": round(dist_m, 1)},
                "geometry": feat.get("geometry"),
            }
            matches.append(fcopy)

    # sort by distance
    matches.sort(key=lambda f: f["properties"].get("distance_m", 0))

    return {"type": "FeatureCollection", "features": matches}


@router.get("/api/v1/routes/filter")
def get_routes_filter(moda: Optional[str] = Query("all", description="Filter by moda: bus, train, or all")) -> dict:
    """
    Filter routes by moda. Expected `moda` values: 'bus', 'train', or 'all'.
    Filtering is performed against `properties.jenis` in a case-insensitive way.
    """
    moda_val = (moda or "all").strip().lower()

    def matches_moda(props: dict) -> bool:
        jenis = (props.get("jenis") or "").lower()
        nama = (props.get("nama_armada") or "").lower()
        if moda_val in ("all", ""):
            return True
        if moda_val == "bus":
            return "bus" in jenis or "bus" in nama
        if moda_val == "train":
            return "kereta" in jenis or "train" in jenis or "kereta" in nama or "train" in nama
        # fallback: try substring match
        return moda_val in jenis or moda_val in nama

    filtered = [
        {"type": "Feature", "id": f.get("id"), "properties": f.get("properties"), "geometry": f.get("geometry")}
        for f in ROUTES_GEOJSON.get("features", [])
        if matches_moda(f.get("properties", {}))
    ]

    return {"type": "FeatureCollection", "features": filtered}
