from flask import Blueprint, jsonify, request, g
from app.models.core import get_db, Settings
from app.services.m3u_parser import M3UParser # (You would update this to accept db conn)

bp = Blueprint('api', __name__)

@bp.route('/server/configure', methods=['POST'])
def configure_server():
    data = request.json or {}
    ip = data.get('ip_address')
    port = data.get('port', 8089)

    if not ip:
        return jsonify({'success': False, 'error': 'IP Required'}), 400

    # Save to Database instead of file
    server_config = {'ip_address': ip, 'port': port, 'url': f"http://{ip}:{port}"}
    Settings.set('configured_server', server_config)
    Settings.set('setup_completed', True)

    return jsonify({'success': True, 'config': server_config})

@bp.route('/channels', methods=['GET'])
def get_channels():
    db = get_db()
    # Cleaner query execution
    channels = db.execute("SELECT * FROM channels ORDER BY name").fetchall()
    return jsonify({'success': True, 'channels': [dict(c) for c in channels]})

# ... Add other API endpoints here ...
