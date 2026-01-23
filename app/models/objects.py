import json
import sqlite3
from app.models.core import get_db

class Channel:
    """Channel model using the new Flask g.db connection."""
    def __init__(self, db=None):
        # We accept 'db' for compatibility with old code, but we don't use it.
        pass

    def create_or_update(self, channel_data):
        db = get_db()
        # Check if channel exists
        existing = None
        if channel_data.get('tvg_id'):
            existing = db.execute("SELECT id FROM channels WHERE tvg_id = ?", (channel_data['tvg_id'],)).fetchone()
        
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
        
    def _process_row(self, row):
        item = dict(row)
        if item.get('attributes'):
            try:
                item['attributes'] = json.loads(item['attributes'])
            except:
                item['attributes'] = {}
        return item

class Playlist:
    def __init__(self, db=None):
        pass

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
        
        # Helper to process attributes
        results = []
        for row in rows:
            ch = dict(row)
            if ch.get('attributes'):
                try: ch['attributes'] = json.loads(ch['attributes'])
                except: ch['attributes'] = {}
            results.append(ch)
        return results

    # Add other methods (create, update, delete, add_channel) as needed
    # copying logic from your original database.py but using get_db()
