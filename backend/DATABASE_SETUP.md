# Database Integration - Setup Guide

Database telah terintegrasi ke dalam sistem. Berikut adalah langkah-langkah untuk setup dan restore database.

## 1. Persyaratan

- PostgreSQL 12 atau lebih tinggi
- PostGIS extension
- Python 3.8+

## 2. Setup Database

### Opsi A: Restore dari Backup dengan Batch Script (⭐ Recommended untuk Windows)

**Cara termudah di Windows:**

1. Buka Command Prompt atau PowerShell
2. Navigasi ke folder backend:
   ```bash
   cd backend
   ```

3. Jalankan batch file (perlu PostgreSQL sudah terinstall):
   ```bash
   restore_db.bat
   ```

   Atau dengan parameter custom:
   ```bash
   restore_db.bat postgres "" localhost 5432
   ```

### Opsi B: Restore dari Backup dengan PowerShell Script

Jika menggunakan PowerShell:

```powershell
cd backend
.\restore_db.ps1 -user postgres -password "" -host localhost -port 5432
```

### Opsi C: Restore dari Backup dengan Python Script (⭐ Works tanpa psql)

Script Python ini **tidak memerlukan psql** di PATH, hanya perlu `psycopg2`:

```bash
cd backend
pip install psycopg2-binary  # jika belum install
python restore_db.py --user postgres --password "" --host localhost --port 5432
```

**Output contoh:**
```
============================================================
🗄️  PostgreSQL Database Restore Tool
============================================================

📄 Membaca SQL file: backend/database/backup_webgis_padang.sql
📏 Ukuran: 2847394 bytes

🔗 Menghubung ke PostgreSQL: postgres@localhost:5432
⏳ Menjalankan restore script...
  ✓ Executed 50 statements...
  ✓ Executed 100 statements...
✅ Restore berhasil! 127 SQL statements executed

🔍 Verifikasi database...
✅ Database 'SIG_DB_PDG' ditemukan
📋 Tables (3):
  • transport_modes: 2 rows
  • routes: 9 rows
  • stops: 270 rows

✨ Selesai! Database siap digunakan
```

### Opsi D: Restore Manual dengan psql CLI

Jika psql sudah ada di PATH:

```bash
psql -U postgres -h localhost -f backend/database/backup_webgis_padang.sql
```

Atau import ke database tertentu:
```bash
psql -U postgres -h localhost SIG_DB_PDG < backend/database/backup_webgis_padang.sql
```

```sql
CREATE DATABASE "SIG_DB_PDG" WITH ENCODING 'UTF8' LOCALE = 'en_US.UTF-8';

\c "SIG_DB_PDG"

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- Buat tabel routes
CREATE TABLE public.transport_modes (
    id integer PRIMARY KEY,
    mode_name character varying(50) NOT NULL,
    color_code character varying(10) NOT NULL
);

CREATE TABLE public.routes (
    id integer PRIMARY KEY,
    mode_id integer REFERENCES public.transport_modes(id),
    route_name character varying(255) NOT NULL,
    geom public.geometry(LineString,4326),
    color_code character varying(10)
);

CREATE TABLE public.stops (
    id integer PRIMARY KEY,
    route_id integer REFERENCES public.routes(id),
    stop_name character varying(255) NOT NULL,
    is_transit boolean DEFAULT false,
    geom public.geometry(Point,4326)
);

-- Verifikasi
SELECT * FROM transport_modes LIMIT 5;
```

## 3. Konfigurasi Environment Variables

1. Buat file `.env` di folder `backend/`:

```bash
cd backend
copy .env.example .env
```

2. Edit file `.env` dan sesuaikan `DATABASE_URL`:

```
DATABASE_URL=postgresql://username:password@localhost:5432/SIG_DB_PDG
```

Ganti `username`, `password` dengan kredensial PostgreSQL Anda.

## 4. Test Koneksi Database

Jalankan backend dan test endpoint ping:

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Kemudian di browser atau curl:

```bash
curl http://localhost:8000/api/v1/db/ping
```

Response yang diharapkan:

```json
{
  "status": "success",
  "data": {
    "database": "SIG_DB_PDG",
    "user": "username",
    "version": "PostgreSQL 12.0..."
  }
}
```

## 5. Test Routes dan Stops

Setelah koneksi berhasil, test endpoints GeoJSON:

```bash
# Get semua routes
curl http://localhost:8000/api/v1/routes/geojson

# Get semua stops
curl http://localhost:8000/api/v1/stops/geojson

# Get stops nearby (lat, lon, radius dalam meter)
curl "http://localhost:8000/api/v1/stops/nearby?lat=-0.9291&lon=100.3507&radius=1000"

# Filter routes by moda
curl "http://localhost:8000/api/v1/routes/filter?moda=bus"
```

## 6. Database Schema

Database memiliki 3 tabel utama:

### transport_modes
- id (integer) - Primary Key
- mode_name (varchar) - Jenis transportasi (Bus, Kereta, dll)
- color_code (varchar) - Warna untuk visualisasi di peta

### routes
- id (integer) - Primary Key
- mode_id (integer) - FK ke transport_modes
- route_name (varchar) - Nama rute/koridor
- geom (geometry) - LineString dalam SRID 4326 (WGS84)
- color_code (varchar) - Warna spesifik rute

### stops
- id (integer) - Primary Key
- route_id (integer) - FK ke routes
- stop_name (varchar) - Nama halte
- is_transit (boolean) - Flag untuk halte transit/stasiun
- geom (geometry) - Point dalam SRID 4326 (WGS84)

## 7. Troubleshooting

### Masalah: "psycopg2.OperationalError: could not connect to server"

**Solusi:**
- Pastikan PostgreSQL sudah running: `pg_isready`
- Cek DATABASE_URL di `.env` sudah benar
- Pastikan hostname/port sudah sesuai

### Masalah: "FATAL: role "username" does not exist"

**Solusi:**
- Gunakan user yang ada, default adalah `postgres`
- Atau buat user baru di PostgreSQL:
```sql
CREATE ROLE username WITH LOGIN PASSWORD 'password' CREATEDB;
```

### Masalah: "CREATE EXTENSION... already exists"

**Solusi:**
- Sudah normal, extension sudah terpasang

## 8. Integrasi API Frontend

Frontend sekarang dapat menggunakan endpoint berikut:

### Endpoints Tersedia

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/db/ping` | Test koneksi database |
| GET | `/api/v1/routes/geojson` | Fetch semua routes sebagai GeoJSON |
| GET | `/api/v1/stops/geojson` | Fetch semua stops sebagai GeoJSON |
| GET | `/api/v1/stops/nearby` | Fetch stops dalam radius tertentu |
| GET | `/api/v1/routes/filter` | Filter routes by transport mode |
| POST | `/api/v1/stops` | Create new stop (work in progress) |

Response format: GeoJSON FeatureCollection

Contoh GeoJSON Route:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "route-1",
      "properties": {
        "id": 1,
        "nama_armada": "Koridor 1: Terminal Anak Air - Imam Bonjol",
        "jenis": "Bus Rapid Transit",
        "color_code": "#ED1C24"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [[100.35, -0.93], [100.36, -0.94], ...]
      }
    }
  ]
}
```

## 9. Next Steps

- [x] Implement POST endpoint untuk create stop dengan database insertion
- [x] Tambahan: Update stop (PUT endpoint)
- [x] Tambahan: Delete stop (DELETE endpoint)
- [ ] Tambahan: Create route (POST endpoint)
- [ ] Testing: Setup automated tests untuk database queries
- [ ] Documentation: API documentation dengan Swagger (sudah built-in di FastAPI)

Database sudah fully integrated dan CRUD Halte sudah beroperasi! 🎉
