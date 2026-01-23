"""
M3U Parser Service - Adapted from test_guide.py
Handles parsing M3U files and syncing channels with the database.
"""
import re
import requests
import logging
from typing import Dict, List, Optional, Any
from app.services.channels_dvr_services import ChannelsDVRClient
from app.models.database import Database, Channel

logger = logging.getLogger(__name__)

class M3UParser:
    """M3U parser for Channels DVR streams."""
    
    def __init__(self, db: Database):
        self.db = db
        self.channel_model = Channel(db)
    
    def fetch_m3u_content(self, timeout: int = 30) -> Optional[str]:
        """Fetch M3U content from Channels DVR server."""
        try:
            # Try to use configured server first
            from config.app_config import AppConfig
            configured_server = AppConfig.get_setup_flag('configured_server')
            
            if configured_server:
                # Use configured server directly
                m3u_url = f"{configured_server['url']}/devices/ANY/channels.m3u?format=hls&codec=copy"
                logger.info(f"Using configured server for M3U: {m3u_url}")
                response = requests.get(m3u_url, timeout=timeout)
                response.raise_for_status()
                return response.text
            else:
                # Fallback to discovery
                with ChannelsDVRClient(timeout=timeout) as client:
                    m3u_url = client.get_m3u_url()
                    if not m3u_url:
                        logger.error("Failed to get M3U URL from Channels DVR")
                        return None
                    
                    response = requests.get(m3u_url, timeout=timeout)
                    response.raise_for_status()
                    return response.text
                
        except Exception as e:
            logger.error(f"Error fetching M3U content: {e}")
            return None
    
    def parse_m3u_content(self, m3u_content: str) -> List[Dict[str, Any]]:
        """Parse M3U content and extract channel information."""
        channels = []
        lines = m3u_content.strip().split('\n')
        
        current_channel = None
        for line in lines:
            line = line.strip()
            
            if line.startswith('#EXTINF:'):
                # Extract channel info from EXTINF line
                current_channel = self._parse_extinf_line(line)
                
            elif line and not line.startswith('#') and current_channel:
                # This is the stream URL
                stream_url = line.strip()
                
                # Ensure HLS format for Channels DVR URLs
                if 'channels' in stream_url.lower() and '/devices/' in stream_url:
                    # This looks like a Channels DVR URL - modify it to use HLS format
                    try:
                        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
                        parsed = urlparse(stream_url)
                        query_params = parse_qs(parsed.query)
                        
                        # Force HLS format for web compatibility
                        query_params['format'] = ['hls']
                        query_params['codec'] = ['copy']
                        
                        # Rebuild the URL
                        new_query = urlencode(query_params, doseq=True)
                        stream_url = urlunparse((
                            parsed.scheme, parsed.netloc, parsed.path,
                            parsed.params, new_query, parsed.fragment
                        ))
                        logger.info(f"Modified stream URL for HLS format: {stream_url}")
                    except Exception as e:
                        logger.warning(f"Failed to modify stream URL: {e}")
                
                current_channel['stream_url'] = stream_url
                channels.append(current_channel.copy())
                current_channel = None
        
        return channels
    
    def _parse_extinf_line(self, line: str) -> Dict[str, Any]:
        """Parse an EXTINF line to extract channel attributes."""
        channel_info = {}
        
        # Extract the basic format: #EXTINF:duration,title
        match = re.match(r'#EXTINF:([^,]*),(.*)$', line)
        if match:
            duration_part = match.group(1)
            title = match.group(2)
            
            # Extract attributes from the duration part
            attrs = re.findall(r'([^=\s]+)="([^"]*)"', duration_part)
            for attr, value in attrs:
                if attr == 'tvg-id':
                    channel_info['tvg_id'] = value
                elif attr == 'tvg-name':
                    channel_info['tvg_name'] = value
                elif attr == 'tvg-logo':
                    channel_info['logo_url'] = value
                elif attr == 'tvg-chno':
                    channel_info['channel_number'] = value
                elif attr == 'group-title':
                    channel_info['group_title'] = value
                else:
                    # Store other attributes for future use
                    channel_info[attr] = value
            
            # Set the channel name from title
            channel_info['name'] = title.strip()
        
        return channel_info
    
    def sync_channels_from_dvr(self, replace_existing: bool = False) -> Dict[str, Any]:
        """
        Sync channels from Channels DVR server to local database.
        
        Args:
            replace_existing: If True, delete all existing channels first
            
        Returns:
            Dictionary with sync results
        """
        # Fetch M3U content
        m3u_content = self.fetch_m3u_content()
        if not m3u_content:
            return {
                'success': False,
                'error': 'Failed to fetch M3U content from Channels DVR server',
                'channels_processed': 0,
                'channels_added': 0,
                'channels_updated': 0
            }
        
        # Parse M3U content
        parsed_channels = self.parse_m3u_content(m3u_content)
        if not parsed_channels:
            return {
                'success': False,
                'error': 'No channels found in M3U content',
                'channels_processed': 0,
                'channels_added': 0,
                'channels_updated': 0
            }
        
        # Clear existing channels if requested
        if replace_existing:
            self.channel_model.delete_all()
        
        # Get existing channels for comparison
        existing_channels = self.channel_model.get_all()
        existing_by_tvg_id = {ch['tvg_id']: ch for ch in existing_channels if ch['tvg_id']}
        existing_by_name_url = {f"{ch['name']}|{ch['stream_url']}": ch for ch in existing_channels}
        
        channels_added = 0
        channels_updated = 0
        channels_processed = 0
        
        # Process each parsed channel
        for channel_data in parsed_channels:
            try:
                channels_processed += 1
                
                # Check if channel already exists
                existing_channel = None
                if channel_data.get('tvg_id'):
                    existing_channel = existing_by_tvg_id.get(channel_data['tvg_id'])
                
                if not existing_channel:
                    # Fallback to name+url match
                    key = f"{channel_data['name']}|{channel_data['stream_url']}"
                    existing_channel = existing_by_name_url.get(key)
                
                # Create or update channel
                channel_id = self.channel_model.create_or_update(channel_data)
                
                if existing_channel:
                    channels_updated += 1
                else:
                    channels_added += 1
                
            except Exception as e:
                logger.error(f"Error processing channel {channel_data.get('name', 'Unknown')}: {e}")
                continue
        
        result = {
            'success': True,
            'channels_processed': channels_processed,
            'channels_added': channels_added,
            'channels_updated': channels_updated,
            'total_channels': len(self.channel_model.get_all())
        }
        
        return result
    
    def get_channel_stats(self) -> Dict[str, Any]:
        """Get statistics about stored channels."""
        all_channels = self.channel_model.get_all()
        enabled_channels = self.channel_model.get_all(enabled_only=True)
        groups = self.channel_model.get_groups()
        
        return {
            'total_channels': len(all_channels),
            'enabled_channels': len(enabled_channels),
            'disabled_channels': len(all_channels) - len(enabled_channels),
            'groups': groups,
            'group_count': len(groups)
        }
