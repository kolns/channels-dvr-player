from flask import Blueprint, render_template, redirect, url_for
from app.models.core import Settings, get_db

bp = Blueprint('ui', __name__)

@bp.route('/')
def index():
    # Check setup status from DB
    if not Settings.get('setup_completed'):
        return redirect(url_for('ui.setup'))

    return render_template('index.html')

@bp.route('/setup')
def setup():
    return render_template('setup.html')

@bp.route('/player')
def player():
    return render_template('player.html')
