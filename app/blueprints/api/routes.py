from flask import Blueprint, jsonify, request, Response
from app.models.core import get_db, Settings
from app.models.objects import Channel, Playlist
from app.services.m3u_parser import M3UParser
import requests
import logging

logger = logging.getLogger(__name__)
bp = Blueprint('api', __name__)

@bp.route('/server/configure', methods=['POST'])
def configure_server():
    data = request.json or {}
    ip = data.get('ip_address')
    port = data.get('port', 8089)
    
    if not ip:
        return jsonify({'success': False, 'error': 'IP Required'}), 400
        
    server_config = {'ip_address': ip, 'port': port, 'url': f"http://{ip}:{port}"}
    Settings.set('configured_server', server_config)
    Settings.set('server_configured', True)
    
    return jsonify({'success': True, 'config': server_config})

@bp.route('/setup/complete', methods=['POST'])
def complete_setup():
    Settings.set('setup_completed', True)
    return jsonify({'success': True})

@bp.route('/channels/sync', methods=['POST'])
def sync_channels():
    parser = M3UParser()
    result = parser.sync_channels_from_dvr(replace_existing=True)
    return jsonify(result)

@bp.route('/channels', methods=['GET'])
def get_channels():
    model = Channel()
    return jsonify({'success': True, 'channels': model.get_all()})

@bp.route('/channels/<int:channel_id>/toggle', methods=['POST'])
def toggle_channel(channel_id):
    model = Channel()
    new_status = model.toggle_enabled(channel_id)
    return jsonify({'success': True, 'is_enabled': new_status})

@bp.route('/channels/bulk-toggle', methods=['POST'])
def bulk_toggle():
    data = request.json or {}
    enable = data.get('enable', True)
    db = get_db()
    db.execute("UPDATE channels SET is_enabled = ?", (enable,))
    db.commit()
    return jsonify({'success': True})

@bp.route('/playlists', methods=['GET'])
def get_playlists():
    p_model = Playlist()
    playlists = p_model.get_all()
    for p in playlists:
        p['channels'] = p_model.get_channels(p['id'])
    return jsonify({'success': True, 'playlists': playlists})

@bp.route('/playlists', methods=['POST'])
def save_playlists():
    data = request.json or {}
    playlists_data = data.get('playlists', [])
    p_model = Playlist()
    db = get_db()
    
    # Simple sync: Delete all and recreate (easiest for prototype)
    # Ideally you would diff them, but this is safe for personal use
    # Note: This implementation assumes we update existing ones or create new ones
    
    existing = {p['id']: p for p in p_model.get_all()}
    incoming_ids = {p.get('id') for p in playlists_data if 'id' in p}
    
    # Delete missing
    for pid in existing:
        if pid not in incoming_ids:
            p_model.delete(pid)
            
    for p_data in playlists_data:
        # Check if new (large ID or missing ID)
        pid = p_data.get('id')
        name = p_data['name']
        desc = p_data.get('description', '')
        
        if not pid or pid > 1000000000: # New
            pid = p_model.create(name, desc)
        else:
            p_model.update(pid, name, desc)
            
        # Update channels
        db.execute("DELETE FROM playlist_channels WHERE playlist_id = ?", (pid,))
        for idx, ch in enumerate(p_data.get('channels', [])):
            p_model.add_channel(pid, ch['id'], idx + 1)
            
    return jsonify({'success': True})

@bp.route('/proxy/stream/<int:channel_id>')
def proxy_stream(channel_id):
    """Proxy HLS video streams."""
    try:
        model = Channel()
        channel = model.get_by_id(channel_id)
        if not channel: return jsonify({'error': 'Not found'}), 404
        
        stream_url = channel['stream_url']
        # Force HLS
        if '?' in stream_url: stream_url += "&format=hls&codec=copy"
        else: stream_url += "?format=hls&codec=copy"
        
        def generate():
            with requests.get(stream_url, stream=True, timeout=30) as r:
                r.raise_for_status()
                for chunk in r.iter_content(chunk_size=8192):
                    yield chunk
                    
        return Response(generate(), content_type='application/vnd.apple.mpegurl')
        
    except Exception as e:
        logger.error(f"Stream error: {e}")
        return jsonify({'error': str(e)}), 500
