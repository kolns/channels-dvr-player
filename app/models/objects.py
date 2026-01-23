import json
import sqlite3
from app.models.core import get_db, DEFAULT_DB_PATH

class Channel:
    """Channel model using the new Flask g.db connection."""
    
    def __init__(self, db=None):
        # Keeps compatibility if legacy code passes a DB object
        pass

    def create_or_update(self, channel_data):
        db = get_db()
        existing = None
        
        # Check by tvg_id
        if channel_data.get('tvg_id'):
            existing = db.execute("SELECT id FROM channels WHERE tvg_id = ?", (channel_data['tvg_id'],)).fetchone()
        
        # Check by name + url
        if not existing:
            existing = db.execute("SELECT id FROM channels WHERE name = ? AND stream_url = ?", 
                                (channel_data['name'], channel_data['stream_url'])).fetchone()

        # Prepare attributes JSON
        attributes = {k: v for k, v in channel_data.items() 
                     if k not in ['name', 'tvg_id', 'stream_url', 'logo_url', 'channel_number', 'group_title']}
        
        if existing:
            db.execute("""
                UPDATE channels 
                SET name = ?, tvg_id = ?, stream_url = ?, logo_url = ?, 
                    channel_number = ?, group_title = ?, attributes = ?, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (
                channel_data['name'], channel_data.get('tvg_id'), channel_data['stream_url'],
                channel_data.get('logo_url'), channel_data.get('channel_number'),
                channel_data.get('group_title'), json.dumps(attributes), existing['id']
            ))
            db.commit()
            return existing['id']
        else:
            cursor = db.execute("""
                INSERT INTO channels (name, tvg_id, stream_url, logo_url, channel_number, group_title, attributes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                channel_data['name'], channel_data.get('tvg_id'), channel_data['stream_url'],
                channel_data.get('logo_url'), channel_data.get('channel_number'),
                channel_data.get('group_title'), json.dumps(attributes)
            ))
            db.commit()
            return cursor.lastrowid

    def get_all(self, enabled_only=False):
        db = get_db()
        query = "SELECT * FROM channels"
        if enabled_only:
            query += " WHERE is_enabled = 1"
        query += " ORDER BY name"
        
        rows = db.execute(query).fetchall()
        return [self._process_row(row) for row in rows]

    def get_by_id(self, channel_id):
        db = get_db()
        row = db.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        return self._process_row(row) if row else None

    def get_by_playlist(self, playlist_id):
        db = get_db()
        rows = db.execute("""
            SELECT c.* FROM channels c
            JOIN playlist_channels pc ON c.id = pc.channel_id
            WHERE pc.playlist_id = ? AND c.is_enabled = 1
            ORDER BY c.name
        """, (playlist_id,)).fetchall()
        return [self._process_row(row) for row in rows]

    def get_groups(self):
        db = get_db()
        rows = db.execute("SELECT DISTINCT group_title FROM channels WHERE group_title IS NOT NULL ORDER BY group_title").fetchall()
        return [row['group_title'] for row in rows]

    def delete_all(self):
        db = get_db()
        db.execute("DELETE FROM channels")
        db.commit()

    def toggle_enabled(self, channel_id):
        db = get_db()
        row = db.execute("SELECT is_enabled FROM channels WHERE id = ?", (channel_id,)).fetchone()
        if row:
            new_status = not row['is_enabled']
            db.execute("UPDATE channels SET is_enabled = ? WHERE id = ?", (new_status, channel_id))
            db.commit()
            return new_status
        return False
        
    def search(self, query):
        db = get_db()
        search_query = f"%{query}%"
        rows = db.execute("""
            SELECT * FROM channels 
            WHERE (name LIKE ? OR tvg_id LIKE ? OR channel_number LIKE ?)
            AND is_enabled = 1
            LIMIT 100
        """, (search_query, search_query, search_query)).fetchall()
        return [self._process_row(row) for row in rows]

    def _process_row(self, row):
        item = dict(row)
        if item.get('attributes'):
            try:
                item['attributes'] = json.loads(item['attributes'])
            except:
                item['attributes'] = {}
        else:
            item['attributes'] = {}
        return item

class Playlist:
    def __init__(self, db=None):
        pass

    def create(self, name, description=""):
        db = get_db()
        cursor = db.execute("INSERT INTO playlists (name, description) VALUES (?, ?)", (name, description))
        db.commit()
        return cursor.lastrowid

    def get_all(self):
        db = get_db()
        rows = db.execute("SELECT * FROM playlists ORDER BY name").fetchall()
        return [dict(row) for row in rows]

    def get_channels(self, playlist_id):
        db = get_db()
        rows = db.execute("""
            SELECT c.*, pc.sort_order 
            FROM channels c 
            JOIN playlist_channels pc ON c.id = pc.channel_id 
            WHERE pc.playlist_id = ? 
            ORDER BY pc.sort_order
        """, (playlist_id,)).fetchall()
        
        results = []
        for row in rows:
            ch = dict(row)
            if ch.get('attributes'):
                try: ch['attributes'] = json.loads(ch['attributes'])
                except: ch['attributes'] = {}
            else: ch['attributes'] = {}
            results.append(ch)
        return results

    def add_channel(self, playlist_id, channel_id, sort_order=None):
        db = get_db()
        if sort_order is None:
            row = db.execute("SELECT MAX(sort_order) FROM playlist_channels WHERE playlist_id = ?", (playlist_id,)).fetchone()
            sort_order = (row[0] or 0) + 1
        
        db.execute("INSERT OR REPLACE INTO playlist_channels (playlist_id, channel_id, sort_order) VALUES (?, ?, ?)",
                  (playlist_id, channel_id, sort_order))
        db.commit()

    def update(self, playlist_id, name, description=""):
        db = get_db()
        db.execute("UPDATE playlists SET name = ?, description = ? WHERE id = ?", (name, description, playlist_id))
        db.commit()

    def delete(self, playlist_id):
        db = get_db()
        db.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
        db.commit()

class SearchHistory:
    def __init__(self, db=None):
        pass

    def add_channel(self, channel_id):
        # Implementation skipped for brevity, but class must exist for imports
        pass
    
    def get_history_channels(self):
        return []
