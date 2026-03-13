import os
import sys

# Add the current directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app import create_app
from app.constants import DEFAULT_HOST, DEFAULT_PORT

app = create_app()

if __name__ == '__main__':
    # Use environment variables for production deployment
    host = os.environ.get('HOST', DEFAULT_HOST)
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    app.run(host=host, port=port, debug=debug)