import { useEffect, useState } from 'react';
import axios from 'axios';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, Circle, useMap } from 'react-leaflet';

const PADANG_CENTER = [-0.9471, 100.4172];
const API_BASE_URL = 'http://localhost:8000';

// Komponen helper untuk melakukan auto-zoom ke lokasi pengguna
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function MapComponent() {
  const [routesGeoJson, setRoutesGeoJson] = useState(null);
  const [stopsGeoJson, setStopsGeoJson] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moda, setModa] = useState('all');
  
  // State untuk menghandle sub-rute kereta
  const [selectedTrainRoute, setSelectedTrainRoute] = useState('all_train'); 
  const [selectedCorridor, setSelectedCorridor] = useState('all');
  const [radius, setRadius] = useState(800);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Reset filter rute/koridor setiap kali user pindah moda utama
  useEffect(() => {
    setSelectedCorridor('all');
    setSelectedTrainRoute('all_train');
  }, [moda]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        setNearbyStops([]);

        const params = new URLSearchParams();
        params.set('moda', moda);

        // Logic parameter filtering ke backend FastAPI
        if (moda === 'bus' && selectedCorridor !== 'all') {
          params.set('route_id', selectedCorridor);
        } else if (moda === 'train' && selectedTrainRoute !== 'all_train') {
          params.set('route_id', selectedTrainRoute);
        } else if (moda === 'all' && selectedTrainRoute !== 'all_train') {
          // Jika menu 'Semua' aktif tapi rute kereta disaring spesifik
          params.set('route_id', selectedTrainRoute);
        }

        const stopsParams = new URLSearchParams();
        if (moda === 'bus' && selectedCorridor !== 'all') {
          stopsParams.set('route_id', selectedCorridor);
        } else if (moda === 'train' && selectedTrainRoute !== 'all_train') {
          stopsParams.set('route_id', selectedTrainRoute);
        } else if (moda === 'all' && selectedTrainRoute !== 'all_train') {
          stopsParams.set('route_id', selectedTrainRoute);
        }

        const [routesResponse, stopsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/v1/routes/filter?${params.toString()}`),
          axios.get(`${API_BASE_URL}/api/v1/stops/geojson?${stopsParams.toString()}`),
        ]);

        if (!isMounted) return;

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
  }, [moda, selectedCorridor, selectedTrainRoute]);

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

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLocation([lat, lon]);
        
        try {
          const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lon),
            radius: String(radius),
          });
          
          if (moda === 'bus' && selectedCorridor !== 'all') {
            params.set('route_id', selectedCorridor);
          } else if (moda === 'train' && selectedTrainRoute !== 'all_train') {
            params.set('route_id', selectedTrainRoute);
          } else if (moda === 'all' && selectedTrainRoute !== 'all_train') {
            params.set('route_id', selectedTrainRoute);
          }

          const resp = await axios.get(
            `${API_BASE_URL}/api/v1/stops/nearby?${params.toString()}`
          );
          setNearbyStops(resp.data.features || []);
        } catch (err) {
          alert('Gagal memanggil endpoint nearby.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        alert('Gagal mendapatkan lokasi: ' + err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Right Admin Button */}
      <a href="/admin" className="absolute top-4 right-4 md:top-8 md:right-8 z-[1000] flex items-center gap-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-95 group">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        Panel Admin
      </a>

      {/* Floating Control Panel */}
      <div className="absolute left-4 top-4 md:left-8 md:top-8 z-[500] w-full max-w-[380px] rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 hover:shadow-[0_8px_40px_0_rgba(16,185,129,0.15)] hover:bg-slate-900/70 group">
        
        {/* Header Area */}
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              Live PostGIS
            </div>
            <h1 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-2xl font-black tracking-tight text-transparent">Padang Route</h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Sistem Navigasi Transportasi</p>
          </div>
        </div>

        {/* Moda Filter - Segmented Control */}
        <div className="mb-6 flex rounded-2xl bg-slate-950/80 p-1.5 border border-white/5 shadow-inner">
          {['all', 'bus', 'train'].map((type) => (
            <button
              key={type}
              onClick={() => setModa(type)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all duration-300 hover:scale-[1.03] active:scale-95 ${
                moda === type 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/25' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {type === 'all' ? 'Semua' : type === 'bus' ? 'Bus BRT' : 'Kereta'}
            </button>
          ))}
        </div>

        {/* Dinamis Filter Bus: Muncul kalau pilih 'all' atau 'bus' */}
        {(moda === 'all' || moda === 'bus') && (
          <div className="mb-6 space-y-3 rounded-2xl bg-slate-800/30 p-4 border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter Koridor Bus</label>
              <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                {selectedCorridor === 'all' ? 'Semua Koridor' : `Koridor ${selectedCorridor}`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
              {['all', 1, 2, 3, 4, 5, 6].map((corridor) => {
                const isActive = selectedCorridor === corridor;
                const label = corridor === 'all' ? 'Semua' : `K${corridor}`;

                return (
                  <button
                    key={String(corridor)}
                    onClick={() => {
                      setSelectedCorridor(corridor);
                      // Jika user memfilter koridor bus, matikan filter spesifik rute kereta agar seimbang
                      if (corridor !== 'all') setSelectedTrainRoute('all_train');
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition-all duration-300 hover:scale-[1.03] active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-slate-950/80 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dinamis Filter Kereta: Muncul kalau pilih 'all' atau 'train' */}
        {(moda === 'all' || moda === 'train') && (
          <div className="mb-6 space-y-3 rounded-2xl bg-slate-800/30 p-4 border border-white/5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Rute Kereta</label>
              <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-[11px] font-bold text-cyan-400 ring-1 ring-inset ring-cyan-500/20">
                {selectedTrainRoute === 'all_train' ? 'Semua Rute' : selectedTrainRoute === 'T1' ? 'KA Minangkabau' : 'KA Pariaman'}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { id: 'all_train', name: 'Semua Rute Kereta' },
                { id: 'T1', name: 'KA Minangkabau Ekspres (Bandara)' }, 
                { id: 'T2', name: 'KA Pariaman Ekspres' }
              ].map((trainRoute) => {
                const isActive = selectedTrainRoute === trainRoute.id;

                return (
                  <button
                    key={trainRoute.id}
                    onClick={() => {
                      setSelectedTrainRoute(trainRoute.id);
                      // Jika user memfilter rute kereta pas di menu 'Semua', matikan filter koridor bus
                      if (trainRoute.id !== 'all_train') setSelectedCorridor('all');
                    }}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-all duration-300 hover:scale-[1.01] active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                        : 'bg-slate-950/80 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    {trainRoute.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Nearby Search Section */}
        <div className="space-y-4 rounded-2xl bg-slate-800/30 p-5 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Jangkauan Area</label>
            <span className="rounded-lg bg-sky-500/10 px-2 py-1 text-xs font-bold text-sky-400 ring-1 ring-inset ring-sky-500/20">{radius} meter</span>
          </div>
          <input 
            type="range" 
            min="200" 
            max="5000" 
            step="100" 
            value={radius} 
            onChange={(e) => setRadius(e.target.value)}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-inner transition-transform hover:scale-[1.02]"
          />
          <button 
            onClick={findNearby} 
            disabled={isLocating}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] active:scale-95"
          >
            {isLocating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Mencari Lokasi...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                Temukan Terdekat
              </>
            )}
          </button>
        </div>
      </div>

      <MapContainer center={PADANG_CENTER} zoom={13} className="h-screen w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Helper untuk auto-center peta ketika lokasi pengguna ditemukan */}
        {userLocation && <MapUpdater center={userLocation} />}

        {!loading && routesGeoJson ? <GeoJSON key={JSON.stringify(routesGeoJson)} data={routesGeoJson} style={routeStyle} /> : null}

        {!loading && stopsGeoJson && stopsGeoJson.features
          ? stopsGeoJson.features.map((feature) => {
              if (!feature?.geometry?.coordinates) return null;
              const [longitude, latitude] = feature.geometry.coordinates;

              return (
                <Marker key={feature.properties.id} position={[latitude, longitude]}>
                  <Popup>
                    <div className="font-sans">
                      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
                        {feature.properties.is_transit ? 'Stasiun / Transit' : 'Halte Biasa'}
                      </div>
                      <div className="text-base font-bold text-slate-800 leading-tight mb-1">{feature.properties.nama_halte}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">✅ {feature.properties.fasilitas}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          : null}

        {/* User location marker dan radius */}
        {userLocation && (
          <>
            <Marker position={userLocation}>
              <Popup>
                <div className="text-sm font-bold text-sky-600">📍 Lokasi Anda Saat Ini</div>
              </Popup>
            </Marker>
            <Circle 
              center={userLocation} 
              radius={radius} 
              pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.15, weight: 2 }} 
            />
          </>
        )}

        {/* Nearby results (highlighted) */}
        {nearbyStops && nearbyStops.length > 0
          ? nearbyStops.map((feature) => {
              if (!feature?.geometry?.coordinates) return null;
              const [lon, lat] = feature.geometry.coordinates;
              return (
                <Marker key={`near-${feature.id}`} position={[lat, lon]}>
                  <Popup>
                    <div className="font-sans">
                       <div className="mb-1 inline-flex items-center rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
                        Berjarak {feature.properties.distance_m} m
                      </div>
                      <div className="text-base font-bold text-slate-800 leading-tight mb-1 mt-2">{feature.properties.nama_halte}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">✅ {feature.properties.fasilitas}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })
          : null}
      </MapContainer>

      {loading ? (
        <div className="pointer-events-none absolute inset-0 z-[600] flex items-center justify-center bg-slate-950/60 backdrop-blur-md transition-all duration-500">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute h-full w-full animate-ping rounded-full bg-emerald-500/20"></div>
              <svg className="animate-spin h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
            <span className="text-sm font-bold tracking-widest uppercase text-emerald-400">Sinkronisasi Peta...</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[600] rounded-2xl border border-rose-500/30 bg-rose-950/90 px-6 py-3 text-sm font-medium text-rose-200 shadow-2xl shadow-rose-900/20 backdrop-blur">
          ⚠️ {error}
        </div>
      ) : null}
    </main>
  );
}