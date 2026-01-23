import socket
import logging
from zeroconf import Zeroconf, ServiceBrowser, ServiceListener
from threading import Event
from typing import Optional, Dict, Any
from app.constants import (
    DVR_DISCOVERY_DEFAULT_TIMEOUT, 
    CHANNELS_DVR_DEFAULT_PORT, 
    EPG_DURATION_SECONDS
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChannelsListener(ServiceListener):
    def __init__(self):
        self.event = Event()
        self.discovered_server_info = None

    def add_service(self, zeroconf, type, name):
        """Called when a service is discovered."""
        try:
            info = zeroconf.get_service_info(type, name)
            if info:
                self.discovered_server_info = info
                self.event.set()
        except Exception as e:
            logger.error(f"Error getting service info for {name}: {e}")

    def update_service(self, zeroconf, type, name):
        """Called when a service is updated."""
        pass

    def remove_service(self, zeroconf, type, name):
        """Called when a service is removed."""
        pass

class ChannelsDVRClient:
    """A client for discovering and interacting with Channels DVR servers."""
    
    def __init__(self, timeout: int = DVR_DISCOVERY_DEFAULT_TIMEOUT):
        self.timeout = timeout
        self._cached_server_info = None
        self._zeroconf = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    
    def close(self):
        """Clean up resources."""
        if self._zeroconf:
            self._zeroconf.close()
            self._zeroconf = None
    
    def _get_ip_address(self, addresses) -> Optional[str]:
        """Extract IP address from service addresses, supporting both IPv4 and IPv6."""
        if not addresses:
            return None
        
        # Prefer IPv4 addresses
        for addr in addresses:
            if len(addr) == 4:  # IPv4
                return socket.inet_ntoa(addr)
        
        # Fall back to IPv6 if no IPv4 found
        for addr in addresses:
            if len(addr) == 16:  # IPv6
                return socket.inet_ntop(socket.AF_INET6, addr)
        
        return None

    def discover_server(self) -> Optional[Dict[str, Any]]:
        """Discover and cache DVR server information."""
        if self._cached_server_info:
            return self._cached_server_info
        
        self._cached_server_info = discover_dvr_server(self.timeout)
        return self._cached_server_info
    
    def get_server_url(self) -> Optional[str]:
        """Get the base URL of the DVR server."""
        server_info = self.discover_server()
        return server_info.get('url') if server_info else None
    
    def get_m3u_url(self, device: str = "ANY", format: str = "hls", codec: str = "copy") -> Optional[str]:
        """
        Get M3U playlist URL for channels.
        
        Args:
            device: Device identifier (default: "ANY")
            format: Stream format (default: "hls")
            codec: Video codec (default: "copy")
            
        Returns:
            M3U playlist URL or None if server not found
        """
        server_info = self.discover_server()
        if not server_info:
            logger.error("No Channels DVR server found")
            return None
        
        base_url = server_info['url']
        return f"{base_url}/devices/{device}/channels.m3u?format={format}&codec={codec}"
    
    def get_epg_url(self, device: str = "ANY") -> Optional[str]:
        """
        Get EPG (Electronic Program Guide) URL.
        
        Args:
            device: Device identifier (default: "ANY")
            
        Returns:
            EPG URL or None if server not found
        """
        server_info = self.discover_server()
        if not server_info:
            logger.error("No Channels DVR server found")
            return None
        
        base_url = server_info['url']
        return f"{base_url}/devices/{device}/guide/xmltv?duration={EPG_DURATION_SECONDS}"

def discover_dvr_server(timeout: int = DVR_DISCOVERY_DEFAULT_TIMEOUT) -> Optional[Dict[str, Any]]:
    """Discover DVR server via mDNS with improved error handling."""
    zeroconf = None
    try:
        zeroconf = Zeroconf()
        listener = ChannelsListener()
        browser = ServiceBrowser(zeroconf, "_channels_dvr._tcp.local.", listener)
        
        found = listener.event.wait(timeout=timeout)
        
        if found and listener.discovered_server_info:
            info = listener.discovered_server_info
            
            # Create client instance to use IP address extraction method
            client = ChannelsDVRClient()
            ip_address = client._get_ip_address(info.addresses)
            
            if not ip_address:
                logger.warning("No valid IP address found for DVR server")
                return None
            
            port = info.port or CHANNELS_DVR_DEFAULT_PORT
            
            server_info = {
                "name": info.name,
                "ip_address": ip_address,
                "port": port,
                "url": f"http://{ip_address}:{port}",
                "properties": dict(info.properties) if info.properties else {}
            }
            
            return server_info
        
        logger.warning(f"No Channels DVR server found within {timeout} seconds")
        return None
        
    except Exception as e:
        logger.error(f"Error discovering DVR server: {e}")
        return None
    finally:
        if zeroconf:
            zeroconf.close()

# Convenience functions for backward compatibility
def get_m3u_url(device: str = "ANY", format: str = "hls", codec: str = "copy") -> Optional[str]:
    """
    Get M3U playlist URL for channels.
    
    Args:
        device: Device identifier (default: "ANY")
        format: Stream format (default: "hls")
        codec: Video codec (default: "copy")
        
    Returns:
        M3U playlist URL or None if server not found
        
    Raises:
        RuntimeError: If no DVR server is found
    """
    with ChannelsDVRClient() as client:
        url = client.get_m3u_url(device, format, codec)
        if url is None:
            raise RuntimeError("No Channels DVR server found")
        return url

def get_epg_url(device: str = "ANY") -> Optional[str]:
    """
    Get EPG (Electronic Program Guide) URL.
    
    Args:
        device: Device identifier (default: "ANY")
        
    Returns:
        EPG URL or None if server not found
        
    Raises:
        RuntimeError: If no DVR server is found
    """
    with ChannelsDVRClient() as client:
        url = client.get_epg_url(device)
        if url is None:
            raise RuntimeError("No Channels DVR server found")
        return url