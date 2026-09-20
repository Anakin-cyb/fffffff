"""MySQL connection configuration for ResQSync.

All credentials come from environment variables. For local development the defaults
are host=localhost, user=root, database=resqsync and an empty password.
"""
import os
import mysql.connector


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQLHOST", "localhost"),
        port=int(os.getenv("MYSQLPORT", "3306")),
        user=os.getenv("MYSQLUSER", "root"),
        password=os.getenv("MYSQLPASSWORD", ""),
        database=os.getenv("MYSQLDATABASE", "resqsync"),
        time_zone="+00:00",
    )
