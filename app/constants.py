"""
Constants for the Channels DVR Player application.
"""

# Application constants
DEFAULT_PORT = 7734
DEFAULT_HOST = '0.0.0.0'
DEFAULT_TIMEOUT = 30

# Database constants
DEFAULT_DB_PATH = 'config/channels.db'
MAX_CHANNEL_NAME_LENGTH = 255
MAX_PLAYLIST_NAME_LENGTH = 100

# Network timeouts
DVR_DISCOVERY_TIMEOUT = 5
HTTP_REQUEST_TIMEOUT = 30
QUICK_CHECK_TIMEOUT = 2
CHANNELS_DVR_DEFAULT_PORT = 8089  # Default port for Channels DVR server
DVR_DISCOVERY_DEFAULT_TIMEOUT = 10  # Default timeout for DVR discovery

# UI constants
MAX_FEATURED_PROGRAMS = 6
MAX_SEARCH_RESULTS = 10
MAX_PROGRAM_RESULTS = 5
MAX_TOTAL_SEARCH_RESULTS = 100  # Maximum total search results across all sources
MAX_SEARCH_HISTORY = 12  # Maximum number of channels in search history

# Cache durations (in seconds)
GUIDE_DATA_CACHE_DURATION = 900  # 15 minutes
EPG_CACHE_DURATION = 3600       # 1 hour

# Time windows
GUIDE_LOOKBACK_HOURS = 2
GUIDE_LOOKAHEAD_HOURS = 4
PROGRAM_SEARCH_HOURS = 4

# Guide/EPG constants
EPG_DURATION_SECONDS = 14400  # 4 hours in seconds for xmltv guide data
