import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv


load_dotenv()


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", "")


@contextmanager
def get_db_connection():
    connection = psycopg2.connect(get_database_url())
    try:
        yield connection
    finally:
        connection.close()


def test_db_connection() -> dict:
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_database(), current_user, version();")
            current_database, current_user, version = cursor.fetchone()

    return {
        "database": current_database,
        "user": current_user,
        "version": version,
    }
