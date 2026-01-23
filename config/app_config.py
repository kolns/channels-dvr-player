import os

class AppConfig:
    """Main application configuration."""
    
    # Application Identity
    APP_NAME = "Channels DVR Player"
    APP_TAGLINE = "Watch Channels DVR Live TV from your Desktop"
    APP_VERSION = "1.0.0"
    APP_AUTHOR = "mike_here"
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # UI Theme Configuration
    class UI_THEME:
        primary_color = '#374151'
        primary_dark = '#1f2937'
        secondary_color = '#10b981'
        accent_color = '#f59e0b'
        max_width = '7xl'
    
    # Features Configuration
    class FEATURES:
        show_app_version = True
    
    @staticmethod
    def get_page_title(page_name):
        """Get page title for different pages."""
        titles = {
            'home': f"{AppConfig.APP_NAME} - Home",
            'index': f"{AppConfig.APP_NAME} - {AppConfig.APP_TAGLINE}",
            'setup': f"{AppConfig.APP_NAME} - Setup",
            'playlist': f"{AppConfig.APP_NAME} - Playlist Builder",
            'player': f"{AppConfig.APP_NAME} - Live TV",
        }
        return titles.get(page_name, AppConfig.APP_NAME)
    
    @staticmethod
    def get_setup_flag(key):
        """Get a value from the setup.flag file."""
        import os
        import json
        
        flag_file = os.path.join(os.path.dirname(__file__), 'setup.flag')
        
        try:
            if os.path.exists(flag_file):
                with open(flag_file, 'r') as f:
                    content = f.read().strip()
                    if content:
                        flags = json.loads(content)
                        return flags.get(key, False)
            return False
        except Exception:
            return False
    
    @staticmethod
    def set_setup_flag(key, value):
        """Set a value in the setup.flag file."""
        import os
        import json
        
        flag_file = os.path.join(os.path.dirname(__file__), 'setup.flag')
        
        try:
            # Read existing flags
            flags = {}
            if os.path.exists(flag_file):
                with open(flag_file, 'r') as f:
                    content = f.read().strip()
                    if content:
                        flags = json.loads(content)
            
            # Update the flag
            flags[key] = value
            
            # Write back to file
            with open(flag_file, 'w') as f:
                json.dump(flags, f, indent=2)
                
            return True
        except Exception as e:
            print(f"Error setting setup flag: {e}")
            return False
