"""MySQL connection configuration for ResQSync.

All credentials come from environment variables. For local development the defaults
are host=localhost, user=root, database=resqsync and an empty password.
"""
import os
import mysql.connector


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("RESQ_DB_HOST", "localhost"),
        port=int(os.getenv("RESQ_DB_PORT", "3306")),
        user=os.getenv("RESQ_DB_USER", "root"),
        password=os.getenv("RESQ_DB_PASSWORD", ""),
        database=os.getenv("RESQ_DB_NAME", "resqsync"),
        time_zone="+00:00",
    )
