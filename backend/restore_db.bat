@echo off
REM PostgreSQL Database Restore Script for Windows
REM Usage: restore_db.bat [username] [password] [host] [port]

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Database Restore Tool
echo ========================================
echo.

REM Default values
set DB_USER=postgres
set DB_PASSWORD=
set DB_HOST=localhost
set DB_PORT=5432

REM Parse arguments
if not "%1"=="" set DB_USER=%1
if not "%2"=="" set DB_PASSWORD=%2
if not "%3"=="" set DB_HOST=%3
if not "%4"=="" set DB_PORT=%4

echo Connecting to: %DB_USER%@%DB_HOST%:%DB_PORT%
echo.

REM Check if psql exists in PATH
where psql >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using psql command line tool...
    psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -f backend\database\backup_webgis_padang.sql
) else (
    echo psql tidak ditemukan di PATH
    echo.
    echo Menggunakan Python restore script sebagai alternatif...
    echo.
    
    REM Run Python script
    python restore_db.py --user %DB_USER% --password "%DB_PASSWORD%" --host %DB_HOST% --port %DB_PORT%
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✓ Restore berhasil!
    ) else (
        echo.
        echo ✗ Restore gagal
        pause
        exit /b 1
    )
)

pause
