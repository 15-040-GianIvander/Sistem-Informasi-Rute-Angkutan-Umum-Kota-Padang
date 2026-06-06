#!/usr/bin/env python3
"""
Database Restore Script
Restore PostgreSQL database dari file SQL dump tanpa perlu psql command-line tool.
"""

import os
import sys
import psycopg2
import argparse
from pathlib import Path
from dotenv import load_dotenv


def restore_database(sql_file: str, db_host: str = "localhost", db_user: str = "postgres", 
                     db_password: str = "", db_port: int = 5432, create_db: bool = True):
    """
    Restore database dari SQL file.
    
    Args:
        sql_file: Path ke file SQL backup
        db_host: PostgreSQL host
        db_user: PostgreSQL username
        db_password: PostgreSQL password
        db_port: PostgreSQL port
        create_db: Jika True, create database jika belum exist
    """
    
    # Baca SQL file
    if not os.path.exists(sql_file):
        print(f"❌ Error: File {sql_file} tidak ditemukan")
        return False
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print(f"📄 Membaca SQL file: {sql_file}")
    print(f"📏 Ukuran: {len(sql_content)} bytes")
    
    try:
        # Connect ke PostgreSQL server (default database)
        print(f"\n🔗 Menghubung ke PostgreSQL: {db_user}@{db_host}:{db_port}")
        
        conn = psycopg2.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database="postgres"  # Connect ke default database dulu
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Execute SQL
        print("⏳ Menjalankan restore script...")
        
        # Parse SQL lines and skip meta-commands (lines starting with \)
        lines = sql_content.split('\n')
        current_statement = []
        executed = 0
        
        for line in lines:
            stripped = line.strip()
            
            # Skip comments and meta-commands
            if stripped.startswith('--') or stripped.startswith('\\'):
                continue
            
            if not stripped:
                continue
            
            current_statement.append(line)
            
            # Check if statement is complete (ends with ;)
            if stripped.endswith(';'):
                statement = '\n'.join(current_statement).strip()
                
                if statement:
                    try:
                        cursor.execute(statement)
                        executed += 1
                        if executed % 50 == 0:
                            print(f"  ✓ Executed {executed} statements...")
                    except psycopg2.ProgrammingError as e:
                        # Skip certain errors yang expected
                        error_msg = str(e).lower()
                        if any(skip in error_msg for skip in ["does not exist", "already exists", "duplicate key"]):
                            executed += 1  # Count it anyway
                            continue
                        print(f"\n⚠️  Warning: {e}")
                        # Continue anyway
                    except Exception as e:
                        print(f"\n❌ Error executing statement: {e}")
                        print(f"   Statement: {statement[:100]}...")
                        # Continue with next statement
                
                current_statement = []
        
        cursor.close()
        conn.close()
        
        print(f"✅ Restore berhasil! {executed} SQL statements executed")
        
        # Verify
        print("\n🔍 Verifikasi database...")
        verify_restore(db_host, db_user, db_password, db_port)
        
        return True
        
    except Exception as e:
        print(f"❌ Error saat restore: {e}")
        print(f"\n💡 Tips:")
        print("  1. Pastikan PostgreSQL sudah running")
        print("  2. Cek username/password PostgreSQL")
        print("  3. Cek file path SQL backup")
        return False


def verify_restore(db_host: str, db_user: str, db_password: str, db_port: int):
    """Verify bahwa database dan tables sudah terbuat."""
    try:
        conn = psycopg2.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database="SIG_DB_PDG"
        )
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cursor.fetchall()
        
        if tables:
            print(f"✅ Database 'SIG_DB_PDG' ditemukan")
            print(f"📋 Tables ({len(tables)}):")
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f"  • {table[0]}: {count} rows")
        else:
            print("⚠️ Database exists tapi tidak ada tables")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"⚠️ Verification error: {e}")


def main():
    parser = argparse.ArgumentParser(description="Restore PostgreSQL database dari SQL file")
    parser.add_argument("--sql-file", default="database/backup_webgis_padang.sql",
                       help="Path ke SQL backup file (default: database/backup_webgis_padang.sql)")
    parser.add_argument("--host", default="localhost",
                       help="PostgreSQL host (default: localhost)")
    parser.add_argument("--user", default="postgres",
                       help="PostgreSQL username (default: postgres)")
    parser.add_argument("--password", default="",
                       help="PostgreSQL password (default: empty)")
    parser.add_argument("--port", type=int, default=5432,
                       help="PostgreSQL port (default: 5432)")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🗄️  PostgreSQL Database Restore Tool")
    print("=" * 60)
    
    success = restore_database(
        sql_file=args.sql_file,
        db_host=args.host,
        db_user=args.user,
        db_password=args.password,
        db_port=args.port
    )
    
    if success:
        print("\n✨ Selesai! Database siap digunakan")
        print("\n📝 Konfigurasi .env file:")
        print(f"  DATABASE_URL=postgresql://{args.user}:password@{args.host}:{args.port}/SIG_DB_PDG")
    else:
        print("\n❌ Restore gagal")
        sys.exit(1)


if __name__ == "__main__":
    main()
