import sqlite3
import json
from flask import g, current_app
from pathlib import Path

# Use a relative path from the instance folder or a simplified config path
DEFAULT_DB_PATH = 'config/channels.db'

def get_db():
    """Get a database connection from the application context."""
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config.get('DATABASE', DEFAULT_DB_PATH),
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Close the database connection if it exists."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db(app):
    """Initialize the database schema."""
    with app.app_context():
        db = get_db()

        # 1. Channels Table
        db.execute("""
            CREATE TABLE IF NOT EXISTS channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                tvg_id TEXT,
                stream_url TEXT NOT NULL,
                logo_url TEXT,
                channel_number TEXT,
                group_title TEXT,
                is_enabled BOOLEAN DEFAULT 1,
                attributes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 2. Playlists Tables
        db.execute("""
            CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        db.execute("""
            CREATE TABLE IF NOT EXISTS playlist_channels (
                playlist_id INTEGER,
                channel_id INTEGER,
                sort_order INTEGER,
                FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                FOREIGN KEY(channel_id) REFERENCES channels(id) ON DELETE CASCADE,
                PRIMARY KEY (playlist_id, channel_id)
            )
        """)

        # 3. New: Settings Table (Replaces setup.flag)
        db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        db.commit()

# --- New Helper for Settings ---
class Settings:
    @staticmethod
    def get(key, default=None):
        db = get_db()
        row = db.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
        if row:
            try:
                return json.loads(row['value'])
            except:
                return row['value']
        return default

    @staticmethod
    def set(key, value):
        db = get_db()
        db.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (key, json.dumps(value))
        )
        db.commit()
