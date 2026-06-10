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
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-lg w-full md:w-1/3 text-slate-200 h-fit">
        <h2 className="text-lg font-bold text-white mb-4">{isEditing ? 'Edit Halte' : 'Tambah Halte Baru'}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold mb-1">Nama Halte</label>
          <input required type="text" name="stop_name" value={formData.stop_name} onChange={handleChange} 
                 className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:border-emerald-500" />
        </div>
        <div className="flex gap-2">
          <div className="w-1/2">
            <label className="block text-xs font-semibold mb-1">Latitude</label>
            <input required type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} 
                   className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
          </div>
          <div className="w-1/2">
            <label className="block text-xs font-semibold mb-1">Longitude</label>
            <input required type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} 
                   className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md" />
          </div>
        </div>
        <button 
          type="button" 
          onClick={handleGetLocation} 
          disabled={isFetchingLoc}
          className="w-full mt-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-1.5 px-3 rounded-md transition disabled:opacity-50"
        >
          {isFetchingLoc ? 'Mencari Koordinat...' : '📍 Ambil Koordinat Saya Saat Ini'}
        </button>
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" name="is_transit" id="is_transit" checked={formData.is_transit} onChange={handleChange} 
                 className="w-4 h-4 accent-emerald-500" />
          <label htmlFor="is_transit" className="text-sm">Halte Transit / Stasiun?</label>
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-md transition">
            {isEditing ? 'Simpan Perubahan' : 'Simpan Data'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleCancelEdit} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-md transition">
              Batal
            </button>
          )}
        </div>
        {status && <p className="text-xs text-center mt-2 font-semibold text-sky-400">{status}</p>}
      </form>
    </div>
      
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-lg w-full md:w-2/3 text-slate-200 h-[36rem] flex flex-col">
        <h2 className="text-lg font-bold text-white mb-4">Daftar Halte & Stasiun</h2>
        <div className="overflow-y-auto flex-1 pr-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2 px-3 text-sm">Nama Halte</th>
                <th className="py-2 px-3 text-sm">Koordinat</th>
                <th className="py-2 px-3 text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stops.map(stop => (
                <tr key={stop.properties.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-2 px-3 text-sm">{stop.properties.nama_halte} {stop.properties.is_transit && '🚆'}</td>
                  <td className="py-2 px-3 text-xs text-slate-400">
                    {stop.geometry.coordinates[1].toFixed(4)}, {stop.geometry.coordinates[0].toFixed(4)}
                  </td>
                  <td className="py-2 px-3 text-center flex gap-2 justify-center">
                    <button onClick={() => handleEdit(stop)} className="bg-sky-600 hover:bg-sky-500 px-3 py-1 rounded text-xs text-white transition">Edit</button>
                    <button onClick={() => handleDelete(stop.properties.id)} className="bg-rose-600 hover:bg-rose-500 px-3 py-1 rounded text-xs text-white transition">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stops.length === 0 && <p className="text-center text-slate-500 text-sm mt-4">Belum ada data halte.</p>}
        </div>
      </div>
    </div>
  );
}