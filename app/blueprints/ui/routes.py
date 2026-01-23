from flask import Blueprint, render_template, redirect, url_for, session, request
from app.models.core import Settings
from app.models.objects import Channel, Playlist
from app.services.m3u_parser import M3UParser
from app.services.channels_dvr_services import discover_dvr_server

bp = Blueprint('ui', __name__)

@bp.route('/')
def index():
    # Check setup status
    if not Settings.get('setup_completed'):
        return redirect(url_for('ui.setup_server'))
    
    # Get stats for the dashboard
    channel_model = Channel()
    playlist_model = Playlist()
    
    all_channels = channel_model.get_all()
    enabled = [c for c in all_channels if c.get('is_enabled')]
    
    return render_template('index.html', 
                         user_state="ready_to_stream" if enabled else "need_setup",
                         channels_count=len(all_channels),
                         enabled_channels_count=len(enabled),
                         playlists_count=len(playlist_model.get_all()))

@bp.route('/setup')
def setup():
    return redirect(url_for('ui.setup_server'))

@bp.route('/setup/server')
def setup_server():
    # Attempt discovery for convenience
    discovered = discover_dvr_server(timeout=1)
    configured = Settings.get('configured_server')
    
    return render_template('setup_server.html', 
                         server_info=discovered, 
                         configured_server=configured)

@bp.route('/setup/sync')
def setup_sync():
    parser = M3UParser()
    stats = parser.get_channel_stats()
    server_info = Settings.get('configured_server')
    return render_template('setup_sync.html', 
                         server_info=server_info,
                         channel_stats=stats)

@bp.route('/setup/channels')
def setup_channels():
    model = Channel()
    channels = model.get_all()
    return render_template('setup_channels.html', 
                         channels=channels, 
                         groups=model.get_groups(),
                         channels_count=len(channels),
                         enabled_channels_count=len([c for c in channels if c.get('is_enabled')]))

@bp.route('/playlist')
def playlist():
    p_model = Playlist()
    c_model = Channel()
    
    playlists = p_model.get_all()
    for p in playlists:
        p['channels'] = p_model.get_channels(p['id'])
        
    return render_template('playlist.html',
                         playlists=playlists,
                         channels=c_model.get_all())

@bp.route('/player')
def player():
    p_model = Playlist()
    c_model = Channel()
    
    playlists = p_model.get_all()
    for p in playlists:
        p['channels'] = p_model.get_channels(p['id'])
        
    return render_template('player.html',
                         playlists=playlists,
                         channels=c_model.get_all())
