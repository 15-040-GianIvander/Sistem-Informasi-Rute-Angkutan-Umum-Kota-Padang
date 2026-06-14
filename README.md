# Sistem Informasi Rute Angkutan Umum Kota Padang

Proyek ini adalah prototype WebGIS untuk menampilkan rute dan halte angkutan umum multi-moda (TransPadang dan Kereta) di Kota Padang.

## Anggota
- Muhammad Dzaky (123140039)
- Gian Ivander (123140040)
- Nahli Saud Ramdani (123140049)
- Muharyan Syaifullah (123140045)

## Deskripsi
Proyek ini menghadirkan sistem informasi rute transportasi umum dengan:
- Peta interaktif untuk rute bus dan kereta
- Marker halte/stasiun dengan metadata detail
- Pencarian halte berdasarkan radius menggunakan PostGIS
- Filter rute berdasarkan moda
- CRUD data rute dan halte

Backend dibangun dengan FastAPI, PostgreSQL + PostGIS, dan frontend dibangun dengan React + Vite + Tailwind CSS menggunakan `react-leaflet`.

## Fitur Utama
- Visualisasi rute sebagai GeoJSON `LineString`
- Marker halte/stasiun sebagai GeoJSON `Point`
- Pencarian halte dalam radius tertentu
- Filter rute berdasarkan moda transportasi
- CRUD rute dengan endpoint `POST`, `GET`, `PUT`, `DELETE`
- CRUD halte awal untuk create/update/delete di backend
- Unit test untuk backend

## Arsitektur Proyek
- `backend/` – API FastAPI, koneksi database, schema Pydantic, logika CRUD, dan unit test
- `backend/database/` – backup SQL dengan schema PostGIS dan data awal
- `frontend/` – aplikasi React + Vite yang menampilkan peta dan antarmuka pengguna

## Struktur Folder
- `backend/app/`:
  - `main.py` — entrypoint FastAPI
  - `routes.py` — router API produksi
  - `db.py` — helper koneksi database dan operasi PostGIS
  - `schemas.py` — schema Pydantic untuk request/response
- `backend/tests/`:
  - `test_routes.py` — unit test backend
- `backend/database/`:
  - `backup_webgis_padang.sql` — dump database PostGIS dengan tabel `routes`, `stops`, `transport_modes`
- `frontend/src/`:
  - `App.jsx`, `main.jsx`, `index.css`
  - `components/` — komponen peta dan form

## Persyaratan
- Python 3.14
- PostgreSQL 12+ dengan PostGIS
- Node.js + npm

## Setup Lokal
### Backend
```bash
cd backend
python -m pip install -r requirements.txt
```

Buat file `.env` di folder `backend/`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/SIG_DB_PDG
```

Jalankan server backend:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Akses frontend di `http://localhost:5173`.

## Konfigurasi Database
Gunakan file `backend/database/backup_webgis_padang.sql` untuk restore data.

Contoh restore manual:
```bash
psql -U postgres -h localhost -f backend/database/backup_webgis_padang.sql
```

Atau gunakan script restore yang sudah tersedia di `backend/`.

## Pengujian
Jalankan unit test backend:
```bash
cd backend
pytest -q
```

## API Endpoint
Semua respons GeoJSON menggunakan format `[longitude, latitude]`.

### Route API
- `GET /api/v1/routes/geojson` — semua rute
- `GET /api/v1/routes/{route_id}` — satu rute
- `POST /api/v1/routes` — buat rute baru
- `PUT /api/v1/routes/{route_id}` — update rute
- `DELETE /api/v1/routes/{route_id}` — hapus rute
- `GET /api/v1/routes/filter?moda={bus|train|all}` — filter rute berdasarkan moda

### Stop API
- `GET /api/v1/stops/geojson` — semua halte/stasiun
- `GET /api/v1/stops/nearby?lat={lat}&lon={lon}&radius={m}` — halte dalam radius
- `POST /api/v1/stops` — buat halte baru

## Catatan Teknis
- Backend kini membaca dan menyimpan geometri dengan PostGIS.
- Rute disimpan sebagai `LINESTRING`, halte disimpan sebagai `POINT`.
- `backend/app/db.py` menggunakan `ST_AsGeoJSON`, `ST_GeomFromGeoJSON`, `ST_DWithin`, dan `ST_Distance`.
- `frontend/src/components/MapComponent.jsx` merender GeoJSON dengan `react-leaflet`.

## Perubahan Terbaru
- Menambahkan CRUD rute penuh (`POST/GET/PUT/DELETE`)
- Menambahkan schema GeoJSON LineString untuk request/response
- Menambahkan unit test route CRUD
- Menambahkan dependensi `httpx` untuk test FastAPI
- Memperbaiki kompatibilitas Pydantic schema

## Rencana Selanjutnya
1. Lengkapi CRUD halte penuh dengan `PUT` dan `DELETE`
2. Tambahkan autentikasi sederhana untuk admin
3. Perbaiki UX pencarian dan filter peta
4. Tambahkan CI/CD untuk tes otomatis

## Referensi
- Backend: `backend/app/main.py`
- Router backend: `backend/app/routes.py`
- Database helper: `backend/app/db.py`
- Frontend map: `frontend/src/components/MapComponent.jsx`
- Frontend form: `frontend/src/components/AdminForm.jsx`
