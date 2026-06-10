import os
from contextlib import contextmanager
import json

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv


load_dotenv()


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", "")


@contextmanager
def get_db_connection():
    connection = psycopg2.connect(get_database_url())
    try:
        yield connection
    finally:
        connection.close()


def test_db_connection() -> dict:
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_database(), current_user, version();")
            current_database, current_user, version = cursor.fetchone()

    return {
        "database": current_database,
        "user": current_user,
        "version": version,
    }


def get_routes_geojson() -> dict:
    """
    Fetch all routes from database and return as GeoJSON FeatureCollection.
    """
    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            query = """
                SELECT 
                    r.id,
                    r.route_name,
                    r.color_code,
                    tm.mode_name,
                    ST_AsGeoJSON(r.geom) as geometry_json
                FROM routes r
                LEFT JOIN transport_modes tm ON r.mode_id = tm.id
                ORDER BY r.id
            """
            cursor.execute(query)
            routes = cursor.fetchall()

    features = []
    for route in routes:
        geom = json.loads(route['geometry_json']) if route['geometry_json'] else None
        feature = {
            "type": "Feature",
            "id": f"route-{route['id']}",
            "properties": {
                "id": route['id'],
                "nama_armada": route['route_name'],
                "jenis": route['mode_name'] or "Transportasi",
                "color_code": route['color_code'] or "#000000",
            },
            "geometry": geom
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }


def get_stops_geojson() -> dict:
    """
    Fetch all stops from database and return as GeoJSON FeatureCollection.
    """
    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            query = """
                SELECT 
                    s.id,
                    s.stop_name,
                    s.is_transit,
                    ST_AsGeoJSON(s.geom) as geometry_json
                FROM stops s
                ORDER BY s.id
            """
            cursor.execute(query)
            stops = cursor.fetchall()

    features = []
    for stop in stops:
        geom = json.loads(stop['geometry_json']) if stop['geometry_json'] else None
        feature = {
            "type": "Feature",
            "id": f"stop-{stop['id']}",
            "properties": {
                "id": stop['id'],
                "nama_halte": stop['stop_name'],
                "is_transit": stop['is_transit'],
                "fasilitas": "Tersedia",  # Default value since DB doesn't have this column
            },
            "geometry": geom
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }


def get_stops_nearby(lat: float, lon: float, radius: float = 500.0) -> dict:
    """
    Fetch stops within specified radius (in meters) from given lat/lon.
    Returns as GeoJSON FeatureCollection with distance_m property.
    """
    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            query = """
                SELECT 
                    s.id,
                    s.stop_name,
                    s.is_transit,
                    ST_AsGeoJSON(s.geom) as geometry_json,
                    ST_Distance(
                        s.geom,
                        ST_GeomFromText('POINT(%s %s)', 4326)
                    ) * 111000 as distance_m
                FROM stops s
                WHERE ST_DWithin(
                    s.geom,
                    ST_GeomFromText('POINT(%s %s)', 4326),
                    %s / 111000
                )
                ORDER BY distance_m
            """
            cursor.execute(query, (lon, lat, lon, lat, radius))
            stops = cursor.fetchall()

    features = []
    for stop in stops:
        geom = json.loads(stop['geometry_json']) if stop['geometry_json'] else None
        feature = {
            "type": "Feature",
            "id": f"stop-{stop['id']}",
            "properties": {
                "id": stop['id'],
                "nama_halte": stop['stop_name'],
                "is_transit": stop['is_transit'],
                "distance_m": round(float(stop['distance_m']), 1),
                "fasilitas": "Tersedia",
            },
            "geometry": geom
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }


def get_routes_filtered(moda: str = "all") -> dict:
    """
    Fetch routes filtered by moda (transport mode).
    moda can be: "all", "bus", "train", or specific mode_id
    """
    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            if moda.lower() in ("all", ""):
                query = """
                    SELECT 
                        r.id,
                        r.route_name,
                        r.color_code,
                        tm.mode_name,
                        ST_AsGeoJSON(r.geom) as geometry_json
                    FROM routes r
                    LEFT JOIN transport_modes tm ON r.mode_id = tm.id
                    ORDER BY r.id
                """
                cursor.execute(query)
            else:
                # Filter by mode name or mode_id
                query = """
                    SELECT 
                        r.id,
                        r.route_name,
                        r.color_code,
                        tm.mode_name,
                        ST_AsGeoJSON(r.geom) as geometry_json
                    FROM routes r
                    LEFT JOIN transport_modes tm ON r.mode_id = tm.id
                    WHERE LOWER(tm.mode_name) LIKE %s OR LOWER(r.route_name) LIKE %s
                    ORDER BY r.id
                """
                search_term = f"%{moda.lower()}%"
                cursor.execute(query, (search_term, search_term))
            
            routes = cursor.fetchall()

    features = []
    for route in routes:
        geom = json.loads(route['geometry_json']) if route['geometry_json'] else None
        feature = {
            "type": "Feature",
            "id": f"route-{route['id']}",
            "properties": {
                "id": route['id'],
                "nama_armada": route['route_name'],
                "jenis": route['mode_name'] or "Transportasi",
                "color_code": route['color_code'] or "#000000",
            },
            "geometry": geom
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }


def insert_stop(nama_halte: str, latitude: float, longitude: float, fasilitas: str | None = None,
                is_transit: bool = False, route_id: int | None = None) -> dict:
    """
    Insert a new stop into the `stops` table and return the created feature as a dict.

    Note: the existing database schema does not include a `fasilitas` column, so
    `fasilitas` is returned only in the response payload and not persisted.
    """
    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            query = """
                INSERT INTO stops (route_id, stop_name, is_transit, geom)
                VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                RETURNING id, ST_AsGeoJSON(geom) as geometry_json;
            """
            cursor.execute(query, (route_id, nama_halte, is_transit, longitude, latitude))
            row = cursor.fetchone()
        # commit the insert
        connection.commit()

    geom = json.loads(row['geometry_json']) if row and row.get('geometry_json') else None
    return {
        "type": "Feature",
        "id": f"stop-{row['id']}",
        "properties": {
            "id": row['id'],
            "nama_halte": nama_halte,
            "is_transit": is_transit,
            "fasilitas": fasilitas or "",
        },
        "geometry": geom,
    }

def update_stop(stop_id: int, stop_name: str, route_id: int | None, is_transit: bool, lat: float, lon: float) -> bool:
    """
    Update data halte berdasarkan ID.
    """
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            query = """
                UPDATE stops
                SET stop_name = %s,
                    route_id = %s,
                    is_transit = %s,
                    geom = ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                WHERE id = %s
                RETURNING id;
            """
            cursor.execute(query, (stop_name, route_id, is_transit, lon, lat, stop_id))
            updated = cursor.fetchone()
        connection.commit()
        return updated is not None

def delete_stop(stop_id: int) -> bool:
    """
    Hapus halte berdasarkan ID.
    """
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            query = "DELETE FROM stops WHERE id = %s RETURNING id;"
            cursor.execute(query, (stop_id,))
            deleted = cursor.fetchone()
        connection.commit()
        return deleted is not None
