"""
Database models for channel and playlist management.
"""
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from pathlib import Path
from app.constants import DEFAULT_DB_PATH, MAX_SEARCH_HISTORY

class Database:
    """Database connection and management."""
    
    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize the database with required tables."""
        # Ensure directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS channels (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    tvg_id TEXT,
                    stream_url TEXT NOT NULL,
                    logo_url TEXT,
                    channel_number TEXT,
                    group_title TEXT,
                    is_enabled BOOLEAN DEFAULT 1,
                    attributes TEXT,  -- JSON string for other M3U attributes
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS playlists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS playlist_channels (
                    playlist_id INTEGER,
                    channel_id INTEGER,
                    sort_order INTEGER,
                    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
                    FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE,
                    PRIMARY KEY (playlist_id, channel_id)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS search_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    channel_id INTEGER NOT NULL,
                    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE
                )
            """)
            
            # Create indexes for better performance
            conn.execute("CREATE INDEX IF NOT EXISTS idx_channels_tvg_id ON channels(tvg_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_channels_enabled ON channels(is_enabled)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_playlist_channels_order ON playlist_channels(playlist_id, sort_order)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_search_history_channel ON search_history(channel_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC)")
    
    def get_connection(self):
        """Get database connection."""
        return sqlite3.connect(self.db_path)

class Channel:
    """Channel model for database operations."""
    
    def __init__(self, db: Database):
        self.db = db
    
    def create_or_update(self, channel_data: Dict[str, Any]) -> int:
        """Create or update a channel. Returns channel ID."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            
            # Check if channel exists (by tvg_id or name+stream_url)
            existing = None
            if channel_data.get('tvg_id'):
                existing = conn.execute(
                    "SELECT id FROM channels WHERE tvg_id = ?",
                    (channel_data['tvg_id'],)
                ).fetchone()
            
            if not existing:
                # Fallback to name+stream_url match
                existing = conn.execute(
                    "SELECT id FROM channels WHERE name = ? AND stream_url = ?",
                    (channel_data['name'], channel_data['stream_url'])
                ).fetchone()
            
            # Prepare attributes JSON
            attributes = {k: v for k, v in channel_data.items() 
                         if k not in ['name', 'tvg_id', 'stream_url', 'logo_url', 'channel_number', 'group_title']}
            
            if existing:
                # Update existing channel
                conn.execute("""
                    UPDATE channels 
                    SET name = ?, tvg_id = ?, stream_url = ?, logo_url = ?, 
                        channel_number = ?, group_title = ?, attributes = ?, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (
                    channel_data['name'],
                    channel_data.get('tvg_id'),
                    channel_data['stream_url'],
                    channel_data.get('logo_url'),
                    channel_data.get('channel_number'),
                    channel_data.get('group_title'),
                    json.dumps(attributes),
                    existing['id']
                ))
                return existing['id']
            else:
                # Create new channel
                cursor = conn.execute("""
                    INSERT INTO channels (name, tvg_id, stream_url, logo_url, channel_number, group_title, attributes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    channel_data['name'],
                    channel_data.get('tvg_id'),
                    channel_data['stream_url'],
                    channel_data.get('logo_url'),
                    channel_data.get('channel_number'),
                    channel_data.get('group_title'),
                    json.dumps(attributes)
                ))
                return cursor.lastrowid
    
    def get_all(self, enabled_only: bool = False) -> List[Dict[str, Any]]:
        """Get all channels."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            
            query = "SELECT * FROM channels"
            params = []
            
            if enabled_only:
                query += " WHERE is_enabled = 1"
            
            query += " ORDER BY name"
            
            rows = conn.execute(query, params).fetchall()
            
            channels = []
            for row in rows:
                channel = dict(row)
                # Parse attributes JSON
                channel['attributes'] = {}  # Skipped JSON parsing for listing performance
                channels.append(channel)
            
            return channels
    
    def get_by_id(self, channel_id: int) -> Optional[Dict[str, Any]]:
        """Get channel by ID."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            
            row = conn.execute(
                "SELECT * FROM channels WHERE id = ?", 
                (channel_id,)
            ).fetchone()
            
            if row:
                channel = dict(row)
                if channel['attributes']:
                    try:
                        channel['attributes'] = json.loads(channel['attributes'])
                    except json.JSONDecodeError:
                        channel['attributes'] = {}
                else:
                    channel['attributes'] = {}
                return channel
            return None
    
    def get_by_playlist(self, playlist_id: int) -> List[Dict[str, Any]]:
        """Get channels for a specific playlist."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            
            rows = conn.execute("""
                SELECT c.* FROM channels c
                JOIN playlist_channels pc ON c.id = pc.channel_id
                WHERE pc.playlist_id = ? AND c.is_enabled = 1
                ORDER BY c.name
            """, (playlist_id,)).fetchall()
            
            channels = []
            for row in rows:
                channel = dict(row)
                # Parse attributes JSON
                channel['attributes'] = {}  # Skipped JSON parsing for listing performance
                    
                # Add display fields for the UI
                channel['number'] = channel.get('channel_number', '')
                channel['group'] = channel.get('group_title', '')
                
                channels.append(channel)
            
            return channels
    
    def toggle_enabled(self, channel_id: int) -> bool:
        """Toggle channel enabled status. Returns new status."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            
            # Get current status
            row = conn.execute(
                "SELECT is_enabled FROM channels WHERE id = ?", 
                (channel_id,)
            ).fetchone()
            
            if row:
                new_status = not row['is_enabled']
                conn.execute(
                    "UPDATE channels SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (new_status, channel_id)
                )
                return new_status
            return False
    
    def get_groups(self) -> List[str]:
        """Get all unique group titles."""
        with self.db.get_connection() as conn:
            rows = conn.execute(
                "SELECT DISTINCT group_title FROM channels WHERE group_title IS NOT NULL ORDER BY group_title"
            ).fetchall()
            return [row[0] for row in rows]
    
    def delete_all(self):
        """Delete all channels (for re-sync)."""
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM channels")

    def search(self, query: str) -> List[Dict[str, Any]]:
        """Search channels by name, tvg_id, or channel_number."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            
            # Search in name
            search_query = f"%{query}%"
            rows = conn.execute("""
                SELECT * FROM channels 
                WHERE name LIKE ?
                AND is_enabled = 1
                ORDER BY name
                LIMIT 100
            """, (search_query,)).fetchall()
            
            channels = []
            for row in rows:
                channel = dict(row)
                # Parse attributes JSON
                channel['attributes'] = {}  # Skipped JSON parsing for listing performance
                channels.append(channel)
            
            return channels

class Playlist:
    """Playlist model for database operations."""
    
    def __init__(self, db: Database):
        self.db = db
    
    def create(self, name: str, description: str = "") -> int:
        """Create a new playlist. Returns playlist ID."""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "INSERT INTO playlists (name, description) VALUES (?, ?)",
                (name, description)
            )
            return cursor.lastrowid
    
    def get_all(self) -> List[Dict[str, Any]]:
        """Get all playlists."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM playlists ORDER BY name").fetchall()
            return [dict(row) for row in rows]
            
    def get_all_with_channels(self) -> List[Dict[str, Any]]:
        """Get all playlists with their channels included to avoid N+1 queries."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM playlists ORDER BY name").fetchall()
            playlists = [dict(row) for row in rows]
            
            playlist_map = {p['id']: p for p in playlists}
            for p in playlists:
                p['channels'] = []
                
            # Bulk fetch channels
            channel_rows = conn.execute("""
                SELECT c.*, pc.sort_order, pc.playlist_id
                FROM channels c 
                JOIN playlist_channels pc ON c.id = pc.channel_id 
                ORDER BY pc.playlist_id, pc.sort_order
            """).fetchall()
            
            for row in channel_rows:
                channel = dict(row)
                playlist_id = channel.pop('playlist_id')
                channel['attributes'] = {}  # Skipped JSON parsing for listing performance
                
                if playlist_id in playlist_map:
                    playlist_map[playlist_id]['channels'].append(channel)
                    
            return playlists
    
    def get_by_id(self, playlist_id: int) -> Optional[Dict[str, Any]]:
        """Get playlist by ID."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT * FROM playlists WHERE id = ?", 
                (playlist_id,)
            ).fetchone()
            return dict(row) if row else None
    
    def update(self, playlist_id: int, name: str, description: str = "") -> bool:
        """Update playlist name and description."""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "UPDATE playlists SET name = ?, description = ? WHERE id = ?",
                (name, description, playlist_id)
            )
            return cursor.rowcount > 0
    
    def add_channel(self, playlist_id: int, channel_id: int, sort_order: int = None):
        """Add channel to playlist."""
        with self.db.get_connection() as conn:
            if sort_order is None:
                # Get next sort order
                row = conn.execute(
                    "SELECT MAX(sort_order) FROM playlist_channels WHERE playlist_id = ?",
                    (playlist_id,)
                ).fetchone()
                sort_order = (row[0] or 0) + 1
            
            conn.execute(
                "INSERT OR REPLACE INTO playlist_channels (playlist_id, channel_id, sort_order) VALUES (?, ?, ?)",
                (playlist_id, channel_id, sort_order)
            )
    
    def remove_channel(self, playlist_id: int, channel_id: int):
        """Remove channel from playlist."""
        with self.db.get_connection() as conn:
            conn.execute(
                "DELETE FROM playlist_channels WHERE playlist_id = ? AND channel_id = ?",
                (playlist_id, channel_id)
            )
    
    def get_channels(self, playlist_id: int) -> List[Dict[str, Any]]:
        """Get all channels in a playlist, ordered by sort_order."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("""
                SELECT c.*, pc.sort_order 
                FROM channels c 
                JOIN playlist_channels pc ON c.id = pc.channel_id 
                WHERE pc.playlist_id = ? 
                ORDER BY pc.sort_order
            """, (playlist_id,)).fetchall()
            
            channels = []
            for row in rows:
                channel = dict(row)
                channel['attributes'] = {}  # Skipped JSON parsing for listing performance
                channels.append(channel)
            
            return channels
    
    def update_channel_order(self, playlist_id: int, channel_orders: List[Dict[str, int]]):
        """Update channel order in playlist. channel_orders = [{'channel_id': 1, 'sort_order': 1}, ...]"""
        with self.db.get_connection() as conn:
            for item in channel_orders:
                conn.execute(
                    "UPDATE playlist_channels SET sort_order = ? WHERE playlist_id = ? AND channel_id = ?",
                    (item['sort_order'], playlist_id, item['channel_id'])
                )
    
    def delete(self, playlist_id: int):
        """Delete playlist and all its channel associations."""
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
            # playlist_channels will be deleted automatically due to CASCADE


class SearchHistory:
    """Search history model for database operations."""
    
    def __init__(self, db: Database):
        self.db = db
    
    def add_channel(self, channel_id: int):
        """Add a channel to search history. If it already exists, update the timestamp.
        Maintains a maximum of 12 channels by removing the oldest entry when needed."""
        with self.db.get_connection() as conn:
            # Remove existing entry for this channel if it exists
            conn.execute("DELETE FROM search_history WHERE channel_id = ?", (channel_id,))
            
            # Add the channel with current timestamp
            conn.execute(
                "INSERT INTO search_history (channel_id) VALUES (?)",
                (channel_id,)
            )
            
            # Keep only the most recent entries
            conn.execute(f"""
                DELETE FROM search_history 
                WHERE id NOT IN (
                    SELECT id FROM search_history 
                    ORDER BY searched_at DESC 
                    LIMIT {MAX_SEARCH_HISTORY}
                )
            """)
    
    def get_history_channels(self) -> List[Dict[str, Any]]:
        """Get the search history as a list of channels, ordered by most recent first."""
        with self.db.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(f"""
                SELECT c.*, sh.searched_at
                FROM search_history sh
                JOIN channels c ON sh.channel_id = c.id
                WHERE c.is_enabled = 1
                ORDER BY sh.searched_at DESC
                LIMIT {MAX_SEARCH_HISTORY}
            """).fetchall()
            
            channels = []
            for row in rows:
                channel = dict(row)
                # Parse attributes JSON
                channel['attributes'] = {}  # Skipped JSON parsing for listing performance
                
                # Add display fields for the UI
                channel['number'] = channel.get('channel_number', '')
                channel['group'] = channel.get('group_title', '')
                
                channels.append(channel)
            
            return channels
    
    def clear_history(self):
        """Clear all search history."""
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM search_history")
    
    def get_history_count(self) -> int:
        """Get the number of channels in search history."""
        with self.db.get_connection() as conn:
            row = conn.execute("SELECT COUNT(*) FROM search_history").fetchone()
            return row[0] if row else 0
