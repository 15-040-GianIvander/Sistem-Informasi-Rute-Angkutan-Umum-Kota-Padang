from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_routes_filter_bus():
    resp = client.get('/api/v1/routes/filter?moda=bus')
    assert resp.status_code == 200
    data = resp.json()
    assert data.get('type') == 'FeatureCollection'
    features = data.get('features', [])
    assert len(features) >= 1
    # every returned feature should have properties and jenis matching the TransPadang bus mode
    assert any(
        'bus' in (f.get('properties', {}).get('jenis', '').lower() or f.get('properties', {}).get('nama_armada', '').lower())
        or 'transpadang' in (f.get('properties', {}).get('jenis', '').lower() or f.get('properties', {}).get('nama_armada', '').lower())
        for f in features
    )


def test_routes_filter_all():
    resp = client.get('/api/v1/routes/filter')
    assert resp.status_code == 200
    data = resp.json()
    assert data.get('type') == 'FeatureCollection'
    features = data.get('features', [])
    assert len(features) >= 2


def test_stops_nearby():
    # use coordinates close to an existing mock stop
    lat = -0.9482
    lon = 100.3604
    resp = client.get(f'/api/v1/stops/nearby?lat={lat}&lon={lon}&radius=500')
    assert resp.status_code == 200
    data = resp.json()
    assert data.get('type') == 'FeatureCollection'
    features = data.get('features', [])
    assert len(features) >= 1
    # ensure distance_m property exists on returned features
    assert all('distance_m' in f.get('properties', {}) for f in features)


def test_create_route(monkeypatch):
    expected = {
        "type": "Feature",
        "id": "route-1",
        "properties": {
            "id": 1,
            "nama_armada": "Koridor Tes",
            "jenis": "Bus",
            "color_code": "#FF0000",
            "mode_id": 1,
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [100.0, -0.9000],
                [100.1, -0.9100]
            ]
        }
    }

    def fake_create_route(route_name, mode_id, color_code, geometry):
        assert route_name == "Koridor Tes"
        assert mode_id == 1
        assert color_code == "#FF0000"
        assert geometry["type"] == "LineString"
        return expected

    monkeypatch.setattr("app.routes.create_route", fake_create_route)

    payload = {
        "route_name": "Koridor Tes",
        "mode_id": 1,
        "color_code": "#FF0000",
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [100.0, -0.9000],
                [100.1, -0.9100]
            ]
        }
    }

    resp = client.post("/api/v1/routes", json=payload)
    assert resp.status_code == 200
    assert resp.json() == expected


def test_get_route(monkeypatch):
    expected = {
        "type": "Feature",
        "id": "route-1",
        "properties": {
            "id": 1,
            "nama_armada": "Koridor Tes",
            "jenis": "Bus",
            "color_code": "#FF0000",
            "mode_id": 1,
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [100.0, -0.9000],
                [100.1, -0.9100]
            ]
        }
    }

    monkeypatch.setattr("app.routes.get_route_by_id", lambda route_id: expected if route_id == 1 else None)

    resp = client.get("/api/v1/routes/1")
    assert resp.status_code == 200
    assert resp.json()["id"] == "route-1"
    assert resp.json()["properties"]["nama_armada"] == "Koridor Tes"


def test_update_route(monkeypatch):
    expected = {
        "type": "Feature",
        "id": "route-1",
        "properties": {
            "id": 1,
            "nama_armada": "Koridor Ubah",
            "jenis": "Bus",
            "color_code": "#FF0000",
            "mode_id": 1,
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [100.0, -0.9000],
                [100.2, -0.9200]
            ]
        }
    }

    def fake_update_route(route_id, route_name=None, mode_id=None, color_code=None, geometry=None):
        assert route_id == 1
        assert route_name == "Koridor Ubah"
        assert geometry is None
        return True

    monkeypatch.setattr("app.routes.update_route", fake_update_route)
    monkeypatch.setattr("app.routes.get_route_by_id", lambda route_id: expected)

    resp = client.put("/api/v1/routes/1", json={"route_name": "Koridor Ubah"})
    assert resp.status_code == 200
    assert resp.json()["properties"]["nama_armada"] == "Koridor Ubah"


def test_delete_route(monkeypatch):
    monkeypatch.setattr("app.routes.delete_route", lambda route_id: True)

    resp = client.delete("/api/v1/routes/1")
    assert resp.status_code == 200
    assert resp.json() == {
        "status": "success",
        "message": "Rute dengan ID 1 berhasil dihapus"
    }
