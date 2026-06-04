Sistem Informasi Rute Angkutan Umum Kota Padang
Kelompok 8

Anggota:
- Muhammad Dzaky (123140039)
- Gian Ivander (123140040)
- Nahli Saud Ramdani (123140049)
- Muharyan Syaifullah (123140045)

Deskripsi singkat
-----------------
Proyek ini adalah prototype WebGIS untuk menampilkan rute dan halte angkutan umum multi-moda (TransPadang dan Kereta) di Kota Padang. Backend menggunakan FastAPI yang menyajikan mock GeoJSON (sementara belum terhubung ke PostGIS). Frontend dibangun dengan React + Vite + Tailwind CSS dan menggunakan react-leaflet untuk visualisasi peta.

Struktur monorepo
-----------------
- `backend/` — FastAPI mock GIS API
- `frontend/` — React (Vite) + Tailwind + react-leaflet

Menjalankan proyek (lokal)
---------------------------

1) Backend (FastAPI)

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Server API akan tersedia di `http://localhost:8000`.

2) Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:5173` secara default.

Unit tests (backend)
--------------------

Jalankan dari folder `backend`:

```bash
pytest -q
```

Endpoint mock yang tersedia
--------------------------
Semua respons GeoJSON menggunakan urutan koordinat `[longitude, latitude]` sesuai spesifikasi GeoJSON.

- `GET /api/v1/routes/geojson` — FeatureCollection berisi semua rute (LineString).
- `GET /api/v1/routes/filter?moda={bus|train|all}` — FeatureCollection rute yang difilter berdasarkan moda (mock filter).
- `GET /api/v1/stops/geojson` — FeatureCollection halte/stasiun (Point).
- `GET /api/v1/stops/nearby?lat={lat}&lon={lon}&radius={m}` — FeatureCollection halte dalam radius (meter) dari titik yang diberikan (menggunakan perhitungan Haversine pada mock data).
- `POST /api/v1/stops` — Simulasi pembuatan halte baru; menerima payload JSON sesuai schema Pydantic (`nama_halte`, `latitude`, `longitude`, `fasilitas`) dan mengembalikan `{"status": "success", "data": ...}`.

Catatan teknis
--------------
- Semua mock GeoJSON disimpan di memory di `backend/app/routes.py`.
- Frontend merender GeoJSON menggunakan `<GeoJSON>` dari `react-leaflet`; ada perbaikan icon marker di `frontend/src/components/LeafletBugFix.js`.
- Kontrol moda (Semua / Bus / Kereta) dan tombol "Temukan Halte Terdekat" ditambahkan pada `frontend/src/components/MapComponent.jsx`.

Rencana pengembangan selanjutnya
-------------------------------
1. Migrasi ke PostgreSQL + PostGIS
	- Simpan rute dan halte di PostGIS, gunakan `ST_AsGeoJSON`, `ST_DWithin` dan `ST_Distance` untuk kueri spasial.
	- Gunakan `ogr2ogr` atau skrip untuk mengimpor mock GeoJSON ke database.

2. Integrasi dan manajemen dengan pgAdmin / Admin UI
	- Gunakan `pgAdmin` untuk administrasi DB; siapkan user khusus aplikasi dan role terbatas.

3. CRUD lengkap dan autentikasi
	- Tambah endpoint `PUT /api/v1/stops/{id}`, `DELETE /api/v1/stops/{id}` dan mekanisme autentikasi sederhana (token/API key) untuk admin.

4. Frontend: fitur pengguna
	- Pencarian halte terdekat berbasis lokasi pengguna dengan parameter radius yang dapat diatur.
	- Filter interaktif dan penyimpanan preferensi (URL/state).

5. Pengujian dan CI
	- Tambah lebih banyak unit/integration tests dan pipeline CI (GitHub Actions).

Kontak / Referensi
------------------
Untuk dokumentasi lebih lanjut lihat file sumber utama:
- Backend: [backend/app/main.py](backend/app/main.py)
- Backend routes: [backend/app/routes.py](backend/app/routes.py)
- Frontend map component: [frontend/src/components/MapComponent.jsx](frontend/src/components/MapComponent.jsx)
- Frontend admin form: [frontend/src/components/AdminForm.jsx](frontend/src/components/AdminForm.jsx)

Jika mau, saya bisa menambahkan petunjuk migrasi PostGIS (skrip SQL + contoh `ogr2ogr`) atau menyiapkan README deploy singkat. Pilih yang kamu mau selanjutnya.