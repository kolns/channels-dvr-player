import os
from flask import Flask
from .models.core import init_db, close_db

def create_app(test_config=None):
    # 1. Initialize Flask
    app = Flask(__name__, instance_relative_config=True)

    # 2. Configuration (Docker friendly)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        DATABASE=os.path.join(app.root_path, '../config/channels.db'),
    )

    # 3. Ensure config directory exists
    try:
        os.makedirs(os.path.dirname(app.config['DATABASE']), exist_ok=True)
    except OSError:
        pass

    # 4. Register Database Hooks
    init_db(app)
    app.teardown_appcontext(close_db)

    # 5. Register Blueprints (Separation of concerns)
    from .blueprints.ui import routes as ui_routes
    from .blueprints.api import routes as api_routes

    app.register_blueprint(ui_routes.bp) # Root URL /
    app.register_blueprint(api_routes.bp, url_prefix='/api')

    return app
