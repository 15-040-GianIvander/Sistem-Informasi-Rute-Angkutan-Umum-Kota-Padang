import { useState } from 'react';
import axios from 'axios';

const initialFormState = {
  nama_halte: '',
  latitude: '',
  longitude: '',
  fasilitas: '',
};

const API_BASE_URL = 'http://localhost:8000';

export default function AdminForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        nama_halte: formData.nama_halte.trim(),
        latitude: Number.parseFloat(formData.latitude),
        longitude: Number.parseFloat(formData.longitude),
        fasilitas: formData.fasilitas.trim(),
      };

      const response = await axios.post(`${API_BASE_URL}/api/v1/stops`, payload);

      alert(`Berhasil: ${response.data.status}`);
      setFormData(initialFormState);
    } catch (submitError) {
      alert('Gagal menyimpan halte baru. Periksa input dan koneksi backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="relative flex min-h-screen flex-col justify-between border-b border-white/10 bg-slate-950/95 px-6 py-8 text-slate-100 shadow-2xl lg:border-b-0 lg:border-r lg:border-white/10">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/20 to-transparent" />

      <div className="relative z-10 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
            Admin Panel
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Tambah Transit Stop</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Form ini menyimpan data halte baru langsung ke database melalui API backend.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="space-y-2">
            <label htmlFor="nama_halte" className="text-sm font-medium text-slate-200">
              Nama Halte
            </label>
            <input
              id="nama_halte"
              name="nama_halte"
              type="text"
              value={formData.nama_halte}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
              placeholder="Contoh: Halte Kampus UNP"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <label htmlFor="latitude" className="text-sm font-medium text-slate-200">
                Latitude
              </label>
              <input
                id="latitude"
                name="latitude"
                type="text"
                inputMode="decimal"
                value={formData.latitude}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
                placeholder="-0.9471"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="longitude" className="text-sm font-medium text-slate-200">
                Longitude
              </label>
              <input
                id="longitude"
                name="longitude"
                type="text"
                inputMode="decimal"
                value={formData.longitude}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
                placeholder="100.4172"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="fasilitas" className="text-sm font-medium text-slate-200">
              Fasilitas
            </label>
            <input
              id="fasilitas"
              name="fasilitas"
              type="text"
              value={formData.fasilitas}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
              placeholder="Shelter, kursi tunggu, papan informasi"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Halte'}
          </button>
        </form>
      </div>

      <div className="relative z-10 mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-sky-500/10 p-5 text-sm text-slate-300">
        Backend target: <span className="font-semibold text-slate-100">http://localhost:8000</span>
      </div>
    </aside>
  );
}
