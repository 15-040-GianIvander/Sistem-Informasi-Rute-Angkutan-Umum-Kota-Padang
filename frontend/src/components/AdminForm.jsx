import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminForm({ onStopAdded }) {
  const [stops, setStops] = useState([]);
  const [formData, setFormData] = useState({
    stop_name: '',
    route_id: 1, // Default sementara
    latitude: '',
    longitude: '',
    is_transit: false
  });
  const [status, setStatus] = useState('');
  const [isFetchingLoc, setIsFetchingLoc] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchStops = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/stops/geojson');
      if (res.data && res.data.features) {
        setStops(res.data.features);
      }
    } catch (error) {
      console.error('Failed to fetch stops', error);
    }
  };

  useEffect(() => {
    fetchStops();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation tidak didukung oleh browser Anda.');
    
    setIsFetchingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
        setIsFetchingLoc(false);
      },
      (err) => {
        alert('Gagal mengambil lokasi: ' + err.message);
        setIsFetchingLoc(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Menyimpan...');
    try {
      if (isEditing) {
        await axios.put(`http://localhost:8000/api/v1/stops/${editId}`, formData);
        setStatus('Berhasil memperbarui halte!');
      } else {
        await axios.post('http://localhost:8000/api/v1/stops', formData);
        setStatus('Berhasil menambahkan halte!');
      }
      setFormData({ stop_name: '', route_id: 1, latitude: '', longitude: '', is_transit: false });
      setIsEditing(false);
      setEditId(null);
      
      fetchStops();
      if (onStopAdded) onStopAdded();
      
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Gagal menyimpan: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (feature) => {
    setIsEditing(true);
    setEditId(feature.properties.id);
    const [lon, lat] = feature.geometry.coordinates;
    setFormData({
      stop_name: feature.properties.nama_halte,
      route_id: 1,
      latitude: lat,
      longitude: lon,
      is_transit: feature.properties.is_transit || false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus halte ini?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/v1/stops/${id}`);
      fetchStops();
      if (onStopAdded) onStopAdded();
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ stop_name: '', route_id: 1, latitude: '', longitude: '', is_transit: false });
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#0B1120] font-sans text-slate-200 overflow-hidden">
      {/* ================= SIDEBAR (FORM KIRI) ================= */}
      <aside className="w-full lg:w-[400px] xl:w-[460px] shrink-0 bg-slate-900/90 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-slate-800 p-5 lg:p-6 flex flex-col lg:h-screen lg:overflow-y-auto custom-scrollbar relative z-20 shadow-2xl">
        {/* Dekorasi Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-sky-400"></div>
        <div className="absolute -top-12 left-0 w-full h-56 bg-emerald-500/10 blur-[80px] pointer-events-none"></div>

        {/* Header Title Sidebar */}
        <div className="mb-8 relative z-10">
          <a href="/" className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 hover:text-emerald-400 mb-6 transition-all duration-300 hover:-translate-x-2 hover:bg-slate-900 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            KEMBALI KE PETA
          </a>
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-1">
            Admin Panel
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Manajemen Rute & Halte</p>
        </div>
        
        {/* Kotak Formulir */}
        <div className="bg-slate-950/50 p-5 md:p-7 rounded-[2rem] border border-slate-800/80 shadow-inner relative z-10 mr-1 lg:mr-3">
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
            {isEditing ? (
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span> Edit Data Area</span>
            ) : (
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-400"></span> Register Area Baru</span>
            )}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Nama Halte / Stasiun</label>
              <input required type="text" name="stop_name" value={formData.stop_name} onChange={handleChange} 
                    placeholder="Cth: Halte Basko"
                    className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 hover:border-emerald-500/50 text-sm font-bold text-slate-200 transition-all duration-300 focus:-translate-y-0.5 placeholder:text-slate-600 shadow-inner" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Latitude</label>
                <input required type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} 
                      placeholder="-0.9xxx"
                      className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 hover:border-sky-500/50 text-sm font-mono text-slate-200 transition-all duration-300 focus:-translate-y-0.5 placeholder:text-slate-600 shadow-inner" />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Longitude</label>
                <input required type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} 
                      placeholder="100.3xxx"
                      className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 hover:border-sky-500/50 text-sm font-mono text-slate-200 transition-all duration-300 focus:-translate-y-0.5 placeholder:text-slate-600 shadow-inner" />
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleGetLocation} 
              disabled={isFetchingLoc}
              className="w-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-sky-500/50 text-sky-400 text-[11px] font-black uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:scale-[1.02] disabled:opacity-50 active:scale-95 group"
            >
              {isFetchingLoc ? 'Mendeteksi Satelit GPS...' : <><span className="transition-transform group-hover:scale-125 group-hover:-translate-y-1">📍</span> Deteksi Lokasi Otomatis</>}
            </button>
            <div className="flex items-center gap-3 p-4 mt-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors duration-300 hover:bg-slate-800/80 hover:border-emerald-500/30">
              <input type="checkbox" name="is_transit" id="is_transit" checked={formData.is_transit} onChange={handleChange} 
                    className="w-5 h-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-950 cursor-pointer transition-transform hover:scale-110" />
              <label htmlFor="is_transit" className="text-sm font-bold text-slate-300 cursor-pointer select-none">Tandai Halte Transit / Stasiun</label>
            </div>
            <div className="flex gap-3 mt-6 pt-4">
              <button type="submit" className="w-full flex-1 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black tracking-widest uppercase py-4 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95">
                {isEditing ? 'SIMPAN EDIT' : 'TAMBAH DATA'}
              </button>
              {isEditing && (
                <button type="button" onClick={handleCancelEdit} className="w-1/3 bg-slate-800 hover:bg-rose-500/90 text-white font-black tracking-widest uppercase py-4 px-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95">
                  BATAL
                </button>
              )}
            </div>
            {status && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-pulse">
                <p className="text-[11px] font-black tracking-widest uppercase text-emerald-400">{status}</p>
              </div>
            )}
          </form>
        </div>
      </aside>

      {/* ================= MAIN CONTENT (TABEL KANAN) ================= */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 relative z-[1000] min-w-0 overflow-hidden flex flex-col lg:h-screen bg-[#0B1120]">
        {/* Dekorasi Background */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        {/* Header Tabel */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 relative z-10">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-white">Database Master</h2>
            <p className="text-sm font-medium text-slate-400 mt-1">Daftar lokasi halte dan stasiun terdaftar.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center justify-between sm:justify-start gap-4 shadow-lg shadow-black/20">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Total Data</span>
            <span className="bg-emerald-500/20 text-emerald-400 text-sm font-black px-3 py-1 rounded-lg">{stops.length} Lokasi</span>
          </div>
        </div>

        {/* Wrapper Tabel */}
        <div className="flex-1 bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col min-h-[500px] relative z-10">
          <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-xl z-20 shadow-sm border-b border-slate-800">
                <tr className="text-slate-400 uppercase text-[10px] tracking-widest font-black whitespace-nowrap">
                  <th className="py-5 px-6 min-w-[250px]">Nama Pangkalan</th>
                  <th className="py-5 px-6 min-w-[200px]">Koordinat (Lat, Lon)</th>
                  <th className="py-5 px-6 min-w-[140px] text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stops.map(stop => (
                  <tr key={stop.properties.id} className="hover:bg-slate-800/80 transition-all duration-300 group hover:translate-x-2 hover:shadow-lg">
                    <td className="py-4 px-6 text-sm font-bold text-slate-200 whitespace-nowrap">
                      {stop.properties.nama_halte} 
                      {stop.properties.is_transit && (
                        <span className="ml-3 inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 ring-1 ring-inset ring-emerald-500/20 transition-transform group-hover:scale-105">Transit</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm font-mono font-medium text-slate-500 whitespace-nowrap transition-colors group-hover:text-slate-300">
                      <span className="text-slate-400 group-hover:text-sky-400 transition-colors">{stop.geometry.coordinates[1].toFixed(5)}</span>, {stop.geometry.coordinates[0].toFixed(5)}
                    </td>
                    <td className="py-4 px-6 flex gap-2 justify-end opacity-50 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <button onClick={() => handleEdit(stop)} className="p-2.5 bg-slate-950 hover:bg-sky-500 hover:text-white text-slate-400 rounded-xl transition-all duration-300 shadow-sm hover:scale-110 hover:-translate-y-1 hover:shadow-sky-500/40 active:scale-90" title="Edit Data">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDelete(stop.properties.id)} className="p-2.5 bg-slate-950 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all duration-300 shadow-sm hover:scale-110 hover:-translate-y-1 hover:shadow-rose-500/40 active:scale-90" title="Hapus Data">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stops.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-500">
                <div className="p-5 bg-slate-900 rounded-full mb-4 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <p className="text-sm font-black tracking-widest text-slate-400">DATABASE KOSONG</p>
                <p className="text-xs font-medium mt-1">Belum ada titik rute yang terdaftar.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}