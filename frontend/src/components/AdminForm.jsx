import { useState } from 'react';
import axios from 'axios';

export default function AdminForm({ onStopAdded }) {
  const [formData, setFormData] = useState({
    stop_name: '',
    route_id: 1, // Default sementara
    latitude: '',
    longitude: '',
    is_transit: false
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Menyimpan...');
    try {
      // Pastikan endpoint backend ini sesuai dengan schema Pydantic-mu
      await axios.post('http://localhost:8000/api/v1/stops', formData);
      setStatus('Berhasil menambahkan halte!');
      setFormData({ stop_name: '', route_id: 1, latitude: '', longitude: '', is_transit: false });
      
      // Panggil fungsi callback agar peta di-refresh otomatis
      if (onStopAdded) onStopAdded();
      
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Gagal menyimpan: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-lg max-w-sm w-full text-slate-200">
      <h2 className="text-lg font-bold text-white mb-4">Tambah Halte Baru (Admin)</h2>
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
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" name="is_transit" id="is_transit" checked={formData.is_transit} onChange={handleChange} 
                 className="w-4 h-4 accent-emerald-500" />
          <label htmlFor="is_transit" className="text-sm">Halte Transit / Stasiun?</label>
        </div>
        <button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-md transition">
          Simpan Data
        </button>
        {status && <p className="text-xs text-center mt-2 font-semibold text-sky-400">{status}</p>}
      </form>
    </div>
  );
}