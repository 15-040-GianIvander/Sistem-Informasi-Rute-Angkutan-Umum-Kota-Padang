# PostgreSQL Database Restore Script for PowerShell
# Usage: .\restore_db.ps1 -user postgres -password "" -host localhost -port 5432

param(
    [string]$user = "postgres",
    [string]$password = "",
    [string]$host = "localhost",
    [int]$port = 5432
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Database Restore Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sqlFile = "backend/database/backup_webgis_padang.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: File $sqlFile tidak ditemukan" -ForegroundColor Red
    exit 1
}

Write-Host "📄 SQL File: $sqlFile" -ForegroundColor Yellow
Write-Host "🔗 Connecting to: $user@${host}:${port}" -ForegroundColor Yellow
Write-Host ""

# Check if psql is available
$psqlExists = $null -ne (Get-Command psql -ErrorAction SilentlyContinue)

if ($psqlExists) {
    Write-Host "Using psql command line tool..." -ForegroundColor Green
    psql -U $user -h $host -p $port -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Restore berhasil!" -ForegroundColor Green
    } else {
        Write-Host "✗ Restore gagal" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  psql tidak ditemukan di PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Menggunakan Python restore script sebagai alternatif..." -ForegroundColor Green
    Write-Host ""
    
    $pythonArgs = @(
        "restore_db.py",
        "--user", $user,
        "--password", $password,
        "--host", $host,
        "--port", $port
    )
    
    & python @pythonArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Restore berhasil!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Sekarang buat file .env di folder backend:" -ForegroundColor Yellow
        Write-Host "   DATABASE_URL=postgresql://${user}:password@${host}:${port}/SIG_DB_PDG" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "✗ Restore gagal" -ForegroundColor Red
        exit 1
    }
}
