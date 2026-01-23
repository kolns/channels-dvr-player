"""
Artwork Service - Provides fallback artwork for programmes when primary artwork is missing
"""
import re
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class ArtworkService:
    """Service for handling artwork fallbacks and enhancements."""
    
    # Category to icon mapping for fallback artwork
    CATEGORY_ICONS = {
        'News': {
            'icon': 'fas fa-newspaper',
            'color': '#2563eb',  # blue
            'background': 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            'description': 'News'
        },
        'Sports': {
            'icon': 'fas fa-football-ball',
            'color': '#059669',  # green
            'background': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            'description': 'Sports'
        },
        'Sports event': {
            'icon': 'fas fa-trophy',
            'color': '#d97706',  # orange
            'background': 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            'description': 'Sports Event'
        },
        'Football': {
            'icon': 'fas fa-football-ball',
            'color': '#7c3aed',  # purple
            'background': 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            'description': 'Football'
        },
        'Movie': {
            'icon': 'fas fa-film',
            'color': '#dc2626',  # red
            'background': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            'description': 'Movie'
        },
        'Drama': {
            'icon': 'fas fa-theater-masks',
            'color': '#7c2d12',  # brown
            'background': 'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)',
            'description': 'Drama'
        },
        'Comedy': {
            'icon': 'fas fa-laugh',
            'color': '#ea580c',  # orange
            'background': 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            'description': 'Comedy'
        },
        'Documentary': {
            'icon': 'fas fa-book-open',
            'color': '#0891b2',  # cyan
            'background': 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
            'description': 'Documentary'
        },
        'Game show': {
            'icon': 'fas fa-gamepad',
            'color': '#c026d3',  # magenta
            'background': 'linear-gradient(135deg, #c026d3 0%, #a21caf 100%)',
            'description': 'Game Show'
        },
        'Talk': {
            'icon': 'fas fa-microphone',
            'color': '#0d9488',  # teal
            'background': 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            'description': 'Talk Show'
        },
        'Reality': {
            'icon': 'fas fa-users',
            'color': '#7c3aed',  # purple
            'background': 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            'description': 'Reality TV'
        },
        'Shopping': {
            'icon': 'fas fa-shopping-cart',
            'color': '#059669',  # green
            'background': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            'description': 'Shopping'
        },
        'Paid Programming': {
            'icon': 'fas fa-dollar-sign',
            'color': '#dc2626',  # red
            'background': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            'description': 'Paid Programming'
        },
        'TBA': {
            'icon': 'fas fa-question',
            'color': '#6b7280',  # gray
            'background': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            'description': 'To Be Announced'
        },
        'Entertainment': {
            'icon': 'fas fa-star',
            'color': '#f59e0b',  # amber
            'background': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            'description': 'Entertainment'
        },
        'Crime': {
            'icon': 'fas fa-gavel',
            'color': '#374151',  # dark gray
            'background': 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
            'description': 'Crime'
        },
        'Thriller': {
            'icon': 'fas fa-eye',
            'color': '#991b1b',  # dark red
            'background': 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
            'description': 'Thriller'
        },
        'Variety': {
            'icon': 'fas fa-magic',
            'color': '#db2777',  # pink
            'background': 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
            'description': 'Variety'
        }
    }
    
    # Title patterns for detection
    TITLE_PATTERNS = {
        'News': [
            'news', 'nightly news', 'world news', 'evening news', 'morning news',
            'newscast', 'news at', 'news today', 'breaking news'
        ],
        'Weather': [
            'weather', 'local weather', 'weather center', 'weather update',
            'forecast', 'storm watch'
        ],
        'Live': [
            'live:', 'live from', 'live at', 'live coverage', 'live broadcast'
        ],
        'Movie': [
            'movie:', 'film:', 'cinema', 'feature film'
        ],
        'Sports': [
            'football', 'basketball', 'baseball', 'soccer', 'hockey',
            'nfl', 'nba', 'mlb', 'nhl', 'espn', 'sports'
        ]
    }
    
    def get_artwork_with_fallback(self, programme: Dict[str, Any], channel: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get artwork URL with intelligent fallbacks for template usage.
        
        Returns dict with:
        - artwork_url: The primary artwork URL (if available)
        - channel_logo_url: Channel logo URL (if available)  
        - category_info: Category-based fallback info
        - dynamic_placeholder: Dynamic placeholder info
        """
        result = {
            'artwork_url': None,
            'channel_logo_url': None,
            'category_info': {},
            'dynamic_placeholder': {}
        }
        
        # Set artwork URL if available and valid
        programme_artwork = programme.get('artwork_url')
        if programme_artwork and self._is_valid_url(programme_artwork):
            result['artwork_url'] = programme_artwork
        
        # Set channel logo if available
        channel_logo = channel.get('tvg_logo') or channel.get('logo_url')
        if channel_logo and self._is_valid_url(channel_logo):
            result['channel_logo_url'] = channel_logo
        
        # Generate category fallback
        programme_title = programme.get('title', '')
        programme_category = programme.get('category')
        
        # Try category-based fallback first
        if programme_category:
            category_fallback = self._get_category_fallback(programme_category)
            if category_fallback:
                result['category_info'] = category_fallback
        
        # If no category, try title pattern detection
        if not result['category_info'] and programme_title:
            title_fallback = self._get_title_pattern_fallback(programme_title)
            if title_fallback:
                result['category_info'] = title_fallback
        
        # Generate dynamic placeholder
        if programme_title:
            result['dynamic_placeholder'] = self._generate_dynamic_placeholder(
                programme_title, 
                channel.get('name', 'Unknown Channel')
            )
        
        return result
    
    @staticmethod
    def _is_valid_url(url: str) -> bool:
        """Check if URL is valid and accessible."""
        if not url or url.strip() == '':
            return False
        
        # Basic URL validation
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        return url_pattern.match(url) is not None
    
    @staticmethod
    def _get_category_fallback(category: str) -> Optional[Dict[str, Any]]:
        """Get category-based fallback info."""
        if not category:
            return None
        
        # Direct match
        if category in ArtworkService.CATEGORY_ICONS:
            return ArtworkService.CATEGORY_ICONS[category]
        
        # Fuzzy match
        category_lower = category.lower()
        for cat_key, cat_info in ArtworkService.CATEGORY_ICONS.items():
            if cat_key.lower() in category_lower or category_lower in cat_key.lower():
                return cat_info
        
        return None
    
    @staticmethod
    def _get_title_pattern_fallback(title: str) -> Optional[Dict[str, Any]]:
        """Get title pattern-based fallback info."""
        if not title:
            return None
        
        title_lower = title.lower()
        
        for pattern_type, patterns in ArtworkService.TITLE_PATTERNS.items():
            for pattern in patterns:
                if pattern.lower() in title_lower:
                    # Use existing category mapping if available
                    if pattern_type in ArtworkService.CATEGORY_ICONS:
                        return ArtworkService.CATEGORY_ICONS[pattern_type]
                    
                    # Create dynamic mapping for patterns not in categories
                    return {
                        'icon': 'fas fa-broadcast-tower',
                        'color': '#6366f1',
                        'background': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        'description': pattern_type
                    }
        
        return None
    
    @staticmethod
    def identify_artwork_type(url: str) -> str:
        """
        Identify the type of artwork from the URL pattern.
        Returns: 'channel_logo', 'show_poster', 'show_screenshot', 'show_horizontal', 'unknown'
        """
        if not url:
            return 'unknown'
        
        if 'tmsimg.fancybits.co' in url:
            if '_ll_' in url:
                return 'channel_logo'
            elif '_b_' in url:
                return 'show_poster'
            elif '_st_' in url:
                return 'show_screenshot'
            elif '_h9_' in url or '_h15_' in url or '_h3_' in url:
                return 'show_horizontal'
        
        return 'unknown'
    
    @staticmethod
    def get_optimized_image_url(url: str, width: int = 360, height: int = 270) -> str:
        """
        Get optimized image URL with specified dimensions.
        """
        if not url:
            return url
        
        # For tmsimg.fancybits.co URLs, modify the size parameters
        if 'tmsimg.fancybits.co' in url:
            # Remove existing size parameters
            base_url = url.split('?')[0]
            return f"{base_url}?w={width}&h={height}"
        
        return url
    
    def _generate_dynamic_placeholder(self, title: str, channel_name: str) -> Dict[str, Any]:
        """Generate a dynamic placeholder based on title patterns."""
        # Create a simple placeholder based on the first letter
        first_letter = title[0].upper() if title else 'T'
        
        # Color variations based on first letter
        color_map = {
            'A': ('#ec4899', 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'),  # pink
            'B': ('#8b5cf6', 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'),  # violet  
            'C': ('#06b6d4', 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'),  # cyan
            'D': ('#10b981', 'linear-gradient(135deg, #10b981 0%, #059669 100%)'),  # emerald
            'E': ('#f59e0b', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'),  # amber
            'F': ('#ef4444', 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'),  # red
            'G': ('#84cc16', 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)'),  # lime
            'H': ('#6366f1', 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'),  # indigo
            'I': ('#a855f7', 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'),  # purple
            'J': ('#14b8a6', 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'),  # teal
        }
        
        # Default pattern for other letters
        default_colors = [
            ('#3b82f6', 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'),  # blue
            ('#f97316', 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'),  # orange
            ('#8b5cf6', 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'),  # violet
            ('#06b6d4', 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'),  # cyan
        ]
        
        color, background = color_map.get(first_letter, default_colors[ord(first_letter) % len(default_colors)])
        
        return {
            'text': first_letter,
            'icon': 'fas fa-tv',
            'color': color,
            'background': background,
            'description': f'On {channel_name}'
        }