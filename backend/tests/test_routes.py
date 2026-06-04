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
    # every returned feature should have properties and jenis containing 'bus' or similar
    assert any('bus' in (f.get('properties', {}).get('jenis', '').lower() or f.get('properties', {}).get('nama_armada', '').lower()) for f in features)


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
