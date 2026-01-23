// Common utilities and shared functions for Channels DVR Player

// Recently watched channels manager
class RecentChannelsManager {
    constructor() {
        this.clearHistoryBtn = null;
        this.recentChannels = null;
        
        this.init();
    }

    init() {
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.recentChannels = document.getElementById('recentChannels');
        
        if (this.clearHistoryBtn && this.recentChannels) {
            this.loadRecentChannels();
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        this.clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Clear all recently watched channels?')) {
                localStorage.removeItem('recentChannels');
                this.loadRecentChannels();
            }
        });
    }

    loadRecentChannels() {
        if (!this.recentChannels) return;
        
        const recent = JSON.parse(localStorage.getItem('recentChannels') || '[]');
        
        if (recent.length === 0) {
            this.recentChannels.innerHTML = `
                <div class="text-center text-gray-400 col-span-full py-8">
                    <i class="fas fa-tv text-4xl mb-4 opacity-50"></i>
                    <p>No recently watched channels yet</p>
                    <p class="text-sm">Start watching to see your history here</p>
                </div>
            `;
            return;
        }
        
        const recentHtml = recent.slice(0, 6).map(channel => `
            <div class="bg-gray-800/60 backdrop-blur-sm border border-gray-600/40 rounded-xl p-3 hover:bg-gray-700/60 transition-all duration-300 cursor-pointer" onclick="selectChannel('${channel.id}')">
                <div class="text-center">
                    ${channel.logo_url ? 
                        `<img src="${channel.logo_url}" alt="${channel.name}" class="w-12 h-12 rounded mx-auto mb-2 object-contain">` :
                        `<div class="w-12 h-12 bg-blue-500 rounded mx-auto mb-2 flex items-center justify-center">
                            <span class="text-white font-bold text-sm">${channel.name.substr(0, 2)}</span>
                         </div>`
                    }
                    <h4 class="text-white font-medium text-sm truncate">${channel.name}</h4>
                    <p class="text-gray-400 text-xs">${channel.last_watched}</p>
                </div>
            </div>
        `).join('');
        
        this.recentChannels.innerHTML = recentHtml;
    }

    addRecentChannel(channel) {
        const recent = JSON.parse(localStorage.getItem('recentChannels') || '[]');
        
        // Remove if already exists
        const filtered = recent.filter(item => item.id !== channel.id);
        
        // Add to beginning
        filtered.unshift({
            ...channel,
            last_watched: new Date().toLocaleString()
        });
        
        // Keep only last 10
        const updated = filtered.slice(0, 10);
        
        localStorage.setItem('recentChannels', JSON.stringify(updated));
        this.loadRecentChannels();
    }
}

// Global navigation functions
window.selectChannel = function(channelId) {
    // Add to search history
    addToSearchHistory(channelId);
    // Navigate to player with this channel
    window.location.href = `/player?channel=${channelId}`;
};

window.selectProgram = function(channelId) {
    // Add to search history
    addToSearchHistory(channelId);
    // Navigate to player with this channel
    window.location.href = `/player?channel=${channelId}`;
};

// Function to add channel to search history
async function addToSearchHistory(channelId) {
    try {
        await fetch('/api/search-history/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ channel_id: parseInt(channelId) })
        });
        // Note: We don't wait for the response or handle errors here
        // to avoid delaying navigation
    } catch (error) {
        console.log('Failed to add to search history:', error);
        // Continue with navigation even if search history fails
    }
}

// Utility functions
const Utils = {
    // Format time from seconds to HH:MM format
    formatTime: function(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    },

    // Get current time in HH:MM format
    getCurrentTime: function() {
        const now = new Date();
        return this.formatTime(now.getHours() * 3600 + now.getMinutes() * 60);
    },

    // Debounce function for search and other inputs
    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Get cookie value by name
    getCookie: function(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    },

    // Set cookie with optional expiration days
    setCookie: function(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
    },

    // Remove cookie
    removeCookie: function(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    },

    // Show notification (could be enhanced with toast library later)
    showNotification: function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // TODO: Implement proper toast notifications
    },

    // Escape HTML to prevent XSS
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
};

// Export utilities
window.Utils = Utils;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RecentChannelsManager, Utils };
}