import { useEffect, useState } from 'react';
import axios from 'axios';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

const PADANG_CENTER = [-0.9471, 100.4172];
const API_BASE_URL = 'http://localhost:8000';

export default function MapComponent() {
  const [routesGeoJson, setRoutesGeoJson] = useState(null);
  const [stopsGeoJson, setStopsGeoJson] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moda, setModa] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [routesResponse, stopsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/v1/routes/filter?moda=${encodeURIComponent(moda)}`),
          axios.get(`${API_BASE_URL}/api/v1/stops/geojson`),
        ]);

        if (!isMounted) {
          return;
        }

        setRoutesGeoJson(routesResponse.data);
        setStopsGeoJson(stopsResponse.data);
      } catch (requestError) {
        if (isMounted) {
          setError('Gagal memuat data GeoJSON dari server lokal.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [moda]);

  const routeStyle = (feature) => ({
    color: feature?.properties?.color_code || '#2563eb',
    weight: 6,
    opacity: 0.9,
  });

  const findNearby = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser ini.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const resp = await axios.get(
            `${API_BASE_URL}/api/v1/stops/nearby?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius=800`
          );
          setNearbyStops(resp.data.features || []);
        } catch (err) {
          alert('Gagal memanggil endpoint nearby.');
        }
      },
      (err) => {
        alert('Gagal mendapatkan lokasi: ' + err.message);
      },
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute left-6 top-6 z-[500] max-w-md rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 shadow-glow backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
          Kota Padang WebGIS Prototype
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white">Rute dan Halte Angkutan Umum</h1>
        <p className="mt-1 text-sm text-slate-300">Data dimuat langsung dari database PostGIS melalui backend FastAPI lokal.</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setModa('all')}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${moda === 'all' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-200'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setModa('bus')}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${moda === 'bus' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-200'}`}
          >
            Bus
          </button>
          <button
            onClick={() => setModa('train')}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${moda === 'train' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-200'}`}
          >
            Kereta
          </button>
          <button onClick={findNearby} className="ml-2 rounded-full bg-sky-500 px-3 py-1 text-sm font-semibold text-white">
            Temukan Halte Terdekat
          </button>
        </div>
      </div>

      <MapContainer center={PADANG_CENTER} zoom={13} className="h-screen w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!loading && routesGeoJson ? <GeoJSON data={routesGeoJson} style={routeStyle} /> : null}

        {!loading && stopsGeoJson
          ? stopsGeoJson.features.map((feature) => {
              const [longitude, latitude] = feature.geometry.coordinates;

              return (
                <Marker key={feature.properties.id} position={[latitude, longitude]}>
                  <Popup>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">{feature.properties.nama_halte}</div>
                      <div className="text-sm text-slate-700">{feature.properties.fasilitas}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          : null}

        {/* Nearby results (highlighted) */}
        {nearbyStops && nearbyStops.length > 0
          ? nearbyStops.map((feature) => {
              const [lon, lat] = feature.geometry.coordinates;
              return (
                <Marker key={`near-${feature.id}`} position={[lat, lon]}>
                  <Popup>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">{feature.properties.nama_halte}</div>
                      <div className="text-sm text-slate-700">{feature.properties.fasilitas}</div>
                      <div className="text-xs text-slate-500">Jarak: {feature.properties.distance_m} m</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          : null}
      </MapContainer>

      {loading ? (
        <div className="pointer-events-none absolute inset-0 z-[600] flex items-center justify-center bg-slate-950/35">
          <div className="rounded-full border border-white/15 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 shadow-glow backdrop-blur">
            Memuat GeoJSON mock data...
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute bottom-6 left-6 z-[600] rounded-2xl border border-rose-400/30 bg-rose-950/90 px-4 py-3 text-sm text-rose-100 shadow-glow backdrop-blur">
          {error}
        </div>
      ) : null}
    </main>
  );
}
