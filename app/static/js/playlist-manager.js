// Playlist Manager functionality for Channels DVR Player

class PlaylistManager {
    constructor() {
        this.playlists = window.playlistsData || [];
        this.channels = window.channelsData || [];
        this.selectedPlaylist = null;
        this.showCreatePlaylistModal = false;
        this.editingPlaylist = null;
        this.newPlaylistName = '';
        this.channelSearch = '';
        this.showAllChannels = false;
        this.filteredAvailableChannels = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderPlaylists();
        this.renderAvailableChannels();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Create playlist button
        document.getElementById('createPlaylistBtn').addEventListener('click', () => {
            this.showModal();
        });
        
        // Modal buttons
        document.getElementById('savePlaylistModalBtn').addEventListener('click', () => {
            this.createOrUpdatePlaylist();
        });
        
        document.getElementById('cancelPlaylistModalBtn').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Modal input
        document.getElementById('newPlaylistName').addEventListener('input', (e) => {
            this.newPlaylistName = e.target.value;
            this.updateModalSaveButton();
        });
        
        document.getElementById('newPlaylistName').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.createOrUpdatePlaylist();
            }
        });
        
        // Channel search
        document.getElementById('channelSearch').addEventListener('input', (e) => {
            this.channelSearch = e.target.value;
            this.renderAvailableChannels();
        });
        
        // Toggle channels button
        document.getElementById('toggleChannelsBtn').addEventListener('click', () => {
            this.showAllChannels = !this.showAllChannels;
            this.updateToggleButton();
            this.renderAvailableChannels();
        });
        
        // Playlist editor buttons
        document.getElementById('clearPlaylistBtn').addEventListener('click', () => {
            this.clearPlaylist();
        });
        
        document.getElementById('savePlaylistBtn').addEventListener('click', () => {
            this.savePlaylist();
        });
        
        // Modal close on background click
        document.getElementById('playlistModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('playlistModal')) {
                this.hideModal();
            }
        });
    }
    
    get enabledChannels() {
        return this.channels.filter(channel => channel.is_enabled);
    }
    
    getFilteredAvailableChannels() {
        let filtered = this.showAllChannels ? this.channels : this.enabledChannels;
        
        if (this.channelSearch) {
            const query = this.channelSearch.toLowerCase();
            filtered = filtered.filter(channel => 
                channel.name.toLowerCase().includes(query) ||
                (channel.channel_number && channel.channel_number.toString().includes(query))
            );
        }
        
        return filtered;
    }
    
    renderPlaylists() {
        const playlistsList = document.getElementById('playlistsList');
        const playlistsEmptyState = document.getElementById('playlistsEmptyState');
        const playlistCount = document.getElementById('playlistCount');
        
        playlistCount.textContent = `${this.playlists.length} playlists`;
        
        if (this.playlists.length === 0) {
            playlistsList.innerHTML = '';
            playlistsEmptyState.classList.remove('hidden');
        } else {
            playlistsEmptyState.classList.add('hidden');
            playlistsList.innerHTML = this.playlists.map(playlist => this.renderPlaylistCard(playlist)).join('');
            
            // Add event listeners to playlist cards
            this.playlists.forEach(playlist => {
                const card = document.getElementById(`playlist-${playlist.id}`);
                if (card) {
                    card.addEventListener('click', () => {
                        this.selectPlaylist(playlist);
                    });
                }
                
                // Only add edit/delete buttons for non-read-only playlists
                const isReadOnly = playlist.isReadOnly || playlist.isSearchHistory;
                
                const editBtn = document.getElementById(`edit-playlist-${playlist.id}`);
                if (editBtn && !isReadOnly) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.editPlaylist(playlist);
                    });
                }
                
                const deleteBtn = document.getElementById(`delete-playlist-${playlist.id}`);
                if (deleteBtn && !isReadOnly) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deletePlaylist(playlist.id);
                    });
                }
            });
        }
    }
    
    renderPlaylistCard(playlist) {
        const isSelected = this.selectedPlaylist?.id === playlist.id;
        const isSearchHistory = playlist.isSearchHistory;
        const isReadOnly = playlist.isReadOnly || isSearchHistory;
        
        let cardClasses, iconColor, titlePrefix;
        
        if (isSearchHistory) {
            cardClasses = isSelected 
                ? 'bg-purple-600/20 border-purple-500/50' 
                : 'bg-purple-600/10 border-purple-700/50';
            iconColor = 'text-purple-400';
            titlePrefix = '';
        } else {
            cardClasses = isSelected 
                ? 'bg-purple-600/20 border-purple-500/50' 
                : 'bg-gray-800/30 border-gray-700/50';
            iconColor = 'text-gray-400';
            titlePrefix = '';
        }
            
        return `
            <div id="playlist-${playlist.id}" class="mb-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:bg-gray-700/30 ${cardClasses}">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h3 class="font-medium text-white text-sm flex items-center">
                            ${isSearchHistory ? '<i class="fas fa-clock text-purple-400 mr-2 text-xs"></i>' : ''}
                            ${playlist.name}
                        </h3>
                        <p class="text-xs ${isSearchHistory ? 'text-purple-300' : 'text-gray-400'} mt-1">
                            ${playlist.channels.length} channels${isReadOnly ? ' (read-only)' : ''}
                        </p>
                    </div>
                    ${!isReadOnly ? `
                    <div class="flex items-center gap-2">
                        <button id="edit-playlist-${playlist.id}" class="${iconColor} hover:text-white p-1">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button id="delete-playlist-${playlist.id}" class="${iconColor} hover:text-red-400 p-1">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                    ` : `
                    <div class="flex items-center gap-2">
                        <i class="fas fa-lock text-purple-400 text-sm" title="Read-only playlist"></i>
                    </div>
                    `}
                </div>
            </div>
        `;
    }
    
    renderAvailableChannels() {
        this.filteredAvailableChannels = this.getFilteredAvailableChannels();
        const channelsGrid = document.getElementById('availableChannelsGrid');
        const noChannelsMessage = document.getElementById('noChannelsMessage');
        const channelsCount = document.getElementById('availableChannelsCount');
        
        channelsCount.textContent = `${this.filteredAvailableChannels.length} channels`;
        
        if (this.filteredAvailableChannels.length === 0) {
            channelsGrid.innerHTML = '';
            noChannelsMessage.classList.remove('hidden');
        } else {
            noChannelsMessage.classList.add('hidden');
            channelsGrid.innerHTML = this.filteredAvailableChannels.map(channel => this.renderChannelCard(channel)).join('');
            
            // Add event listeners to channel cards
            this.filteredAvailableChannels.forEach(channel => {
                const addBtn = document.getElementById(`add-channel-${channel.id}`);
                if (addBtn) {
                    addBtn.addEventListener('click', () => {
                        this.addChannelToPlaylist(channel);
                    });
                }
            });
        }
    }
    
    renderChannelCard(channel) {
        const isReadOnly = this.selectedPlaylist?.isReadOnly || this.selectedPlaylist?.isSearchHistory;
        const isDisabled = !this.selectedPlaylist || this.isChannelInPlaylist(channel.id) || isReadOnly;
        const buttonClasses = isDisabled 
            ? 'text-gray-600 cursor-not-allowed' 
            : 'text-purple-400 hover:text-purple-300';
            
        return `
            <div class="available-channel-card bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 hover:bg-gray-700/40 transition-colors">
                <div class="flex items-center justify-between h-full">
                    <div class="flex items-center flex-1">
                        ${channel.logo_url ? 
                            `<img src="${channel.logo_url}" 
                                 alt="${channel.name}"
                                 class="w-6 h-6 rounded mr-3 object-cover"
                                 onerror="this.style.display='none'">` : 
                            ''
                        }
                        <div class="flex-1 min-w-0">
                            <h4 class="text-white font-medium text-sm truncate">${channel.name}</h4>
                            <p class="text-gray-400 text-xs">${channel.channel_number ? 'Ch. ' + channel.channel_number : ''}</p>
                        </div>
                    </div>
                    <button id="add-channel-${channel.id}" 
                            ${isDisabled ? 'disabled' : ''}
                            class="ml-2 p-1 transition-colors ${buttonClasses}"
                            ${isReadOnly ? 'title="Cannot modify read-only playlist"' : ''}>
                        <i class="fas fa-plus-circle"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderPlaylistChannels() {
        const channelsList = document.getElementById('playlistChannelsList');
        const emptyState = document.getElementById('emptyPlaylistState');
        
        if (!this.selectedPlaylist || this.selectedPlaylist.channels.length === 0) {
            channelsList.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            channelsList.innerHTML = this.selectedPlaylist.channels.map((channel, index) => 
                this.renderPlaylistChannelCard(channel, index)
            ).join('');
            
            const isReadOnly = this.selectedPlaylist.isReadOnly || this.selectedPlaylist.isSearchHistory;
            
            // Add event listeners to remove buttons (only for non-read-only playlists)
            if (!isReadOnly) {
                this.selectedPlaylist.channels.forEach(channel => {
                    const removeBtn = document.getElementById(`remove-channel-${channel.id}`);
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            this.removeChannelFromPlaylist(channel.id);
                        });
                    }
                });
                
                // Initialize drag and drop functionality
                this.initializeDragAndDrop();
            }
        }
    }
    
    initializeDragAndDrop() {
        const channelsList = document.getElementById('playlistChannelsList');
        let draggedElement = null;
        let draggedIndex = null;
        
        // Add drag event listeners to all channel items
        this.selectedPlaylist.channels.forEach((channel, index) => {
            const channelElement = channelsList.children[index];
            if (channelElement) {
                channelElement.setAttribute('draggable', 'true');
                channelElement.dataset.index = index;
                
                // Drag start
                channelElement.addEventListener('dragstart', (e) => {
                    draggedElement = channelElement;
                    draggedIndex = parseInt(channelElement.dataset.index);
                    channelElement.style.opacity = '0.5';
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', channelElement.outerHTML);
                });
                
                // Drag end
                channelElement.addEventListener('dragend', (e) => {
                    channelElement.style.opacity = '1';
                    draggedElement = null;
                    draggedIndex = null;
                    
                    // Remove drag over styles from all elements
                    const allItems = channelsList.querySelectorAll('.drag-over');
                    allItems.forEach(item => item.classList.remove('drag-over'));
                });
                
                // Drag over
                channelElement.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    
                    if (draggedElement && channelElement !== draggedElement) {
                        channelElement.classList.add('drag-over');
                    }
                });
                
                // Drag leave
                channelElement.addEventListener('dragleave', (e) => {
                    channelElement.classList.remove('drag-over');
                });
                
                // Drop
                channelElement.addEventListener('drop', (e) => {
                    e.preventDefault();
                    channelElement.classList.remove('drag-over');
                    
                    if (draggedElement && channelElement !== draggedElement) {
                        const dropIndex = parseInt(channelElement.dataset.index);
                        this.reorderChannel(draggedIndex, dropIndex);
                    }
                });
            }
        });
    }
    
    reorderChannel(fromIndex, toIndex) {
        if (!this.selectedPlaylist || fromIndex === toIndex) return;
        
        // Remove the channel from the old position
        const [movedChannel] = this.selectedPlaylist.channels.splice(fromIndex, 1);
        
        // Insert the channel at the new position
        this.selectedPlaylist.channels.splice(toIndex, 0, movedChannel);
        
        // Re-render the playlist channels to reflect the new order
        this.renderPlaylistChannels();
        this.updateUI();
    }
    
    renderPlaylistChannelCard(channel, index) {
        const isReadOnly = this.selectedPlaylist?.isReadOnly || this.selectedPlaylist?.isSearchHistory;
        
        return `
            <div class="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 hover:bg-gray-700/40 transition-colors">
                <div class="flex items-center">
                    ${!isReadOnly ? `
                    <div class="drag-handle cursor-move text-gray-400 hover:text-white mr-3 p-1">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    ` : `
                    <div class="mr-3 p-1 text-gray-600">
                        <i class="fas fa-lock text-xs"></i>
                    </div>
                    `}
                    <div class="flex items-center justify-between flex-1">
                        <div class="flex items-center">
                            <span class="text-gray-400 text-sm mr-3 w-6">${index + 1}</span>
                            ${channel.logo_url ? 
                                `<img src="${channel.logo_url}" 
                                     alt="${channel.name}"
                                     class="w-6 h-6 rounded mr-3 object-cover"
                                     onerror="this.style.display='none'">` : 
                                ''
                            }
                            <div>
                                <h4 class="text-white font-medium text-sm">${channel.name}</h4>
                                <p class="text-gray-400 text-xs">${channel.channel_number ? 'Ch. ' + channel.channel_number : ''}</p>
                            </div>
                        </div>
                        ${!isReadOnly ? `
                        <button id="remove-channel-${channel.id}" class="text-gray-400 hover:text-red-400 p-1 transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                        ` : `
                        <div class="text-gray-600 p-1">
                            <i class="fas fa-eye text-sm" title="View only"></i>
                        </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    selectPlaylist(playlist) {
        this.selectedPlaylist = { ...playlist };
        this.renderPlaylists(); // Re-render to update selection styling
        this.updateUI();
        this.renderPlaylistChannels();
        this.renderAvailableChannels(); // Re-render to update add button states
    }
    
    showModal(editingPlaylist = null) {
        this.editingPlaylist = editingPlaylist;
        this.newPlaylistName = editingPlaylist ? editingPlaylist.name : '';
        
        document.getElementById('modalTitle').textContent = editingPlaylist ? 'Edit Playlist' : 'Create New Playlist';
        document.getElementById('savePlaylistModalText').textContent = editingPlaylist ? 'Update' : 'Create';
        document.getElementById('newPlaylistName').value = this.newPlaylistName;
        document.getElementById('playlistModal').classList.remove('hidden');
        
        this.updateModalSaveButton();
        
        // Focus the input
        setTimeout(() => {
            document.getElementById('newPlaylistName').focus();
        }, 100);
    }
    
    hideModal() {
        document.getElementById('playlistModal').classList.add('hidden');
        this.editingPlaylist = null;
        this.newPlaylistName = '';
    }
    
    updateModalSaveButton() {
        const saveBtn = document.getElementById('savePlaylistModalBtn');
        const isValid = this.newPlaylistName.trim().length > 0;
        
        saveBtn.disabled = !isValid;
        saveBtn.className = isValid 
            ? 'flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors'
            : 'flex-1 bg-gray-600 cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors';
    }
    
    updateToggleButton() {
        const toggleBtn = document.getElementById('toggleChannelsBtn');
        const toggleText = document.getElementById('toggleChannelsText');
        
        if (this.showAllChannels) {
            toggleBtn.className = 'bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors';
            toggleText.textContent = 'Show Available';
        } else {
            toggleBtn.className = 'bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors';
            toggleText.textContent = 'Show All';
        }
    }
    
    updateUI() {
        const playlistEditor = document.getElementById('playlistEditor');
        const noPlaylistSelected = document.getElementById('noPlaylistSelected');
        const selectedPlaylistName = document.getElementById('selectedPlaylistName');
        const selectedPlaylistChannelCount = document.getElementById('selectedPlaylistChannelCount');
        const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');
        
        if (this.selectedPlaylist) {
            playlistEditor.classList.remove('hidden');
            noPlaylistSelected.classList.add('hidden');
            
            selectedPlaylistName.textContent = this.selectedPlaylist.name;
            selectedPlaylistChannelCount.textContent = `${this.selectedPlaylist.channels.length} channels`;
            
            const isReadOnly = this.selectedPlaylist.isReadOnly || this.selectedPlaylist.isSearchHistory;
            
            if (this.selectedPlaylist.channels.length > 0 && !isReadOnly) {
                clearPlaylistBtn.classList.remove('hidden');
            } else {
                clearPlaylistBtn.classList.add('hidden');
            }
            
            // Disable drag and drop for read-only playlists
            const playlistChannelsList = document.getElementById('playlistChannelsList');
            if (playlistChannelsList) {
                if (isReadOnly) {
                    playlistChannelsList.classList.add('read-only');
                } else {
                    playlistChannelsList.classList.remove('read-only');
                }
            }
        } else {
            playlistEditor.classList.add('hidden');
            noPlaylistSelected.classList.remove('hidden');
        }
    }
    
    createOrUpdatePlaylist() {
        if (!this.newPlaylistName.trim()) return;
        
        if (this.editingPlaylist) {
            // Update existing playlist
            const index = this.playlists.findIndex(p => p.id === this.editingPlaylist.id);
            if (index !== -1) {
                this.playlists[index].name = this.newPlaylistName.trim();
                if (this.selectedPlaylist?.id === this.editingPlaylist.id) {
                    this.selectedPlaylist.name = this.newPlaylistName.trim();
                }
            }
        } else {
            // Create new playlist
            const newPlaylist = {
                id: Date.now(),
                name: this.newPlaylistName.trim(),
                channels: []
            };
            this.playlists.push(newPlaylist);
            this.selectedPlaylist = newPlaylist;
        }
        
        this.hideModal();
        this.renderPlaylists();
        this.updateUI();
        this.saveAllPlaylists();
    }
    
    editPlaylist(playlist) {
        this.showModal(playlist);
    }
    
    deletePlaylist(playlistId) {
        if (confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
            this.playlists = this.playlists.filter(p => p.id !== playlistId);
            if (this.selectedPlaylist?.id === playlistId) {
                this.selectedPlaylist = null;
            }
            this.renderPlaylists();
            this.updateUI();
            this.saveAllPlaylists();
        }
    }
    
    addChannelToPlaylist(channel) {
        if (!this.selectedPlaylist || this.isChannelInPlaylist(channel.id)) return;
        
        this.selectedPlaylist.channels.push({ ...channel });
        this.renderPlaylistChannels();
        this.renderAvailableChannels(); // Re-render to update add button states
        this.updateUI();
    }
    
    removeChannelFromPlaylist(channelId) {
        if (!this.selectedPlaylist) return;
        
        this.selectedPlaylist.channels = this.selectedPlaylist.channels.filter(
            c => c.id !== channelId
        );
        this.renderPlaylistChannels();
        this.renderAvailableChannels(); // Re-render to update add button states
        this.updateUI();
    }
    
    isChannelInPlaylist(channelId) {
        return this.selectedPlaylist?.channels.some(c => c.id === channelId) || false;
    }
    
    clearPlaylist() {
        if (confirm('Are you sure you want to remove all channels from this playlist?')) {
            this.selectedPlaylist.channels = [];
            this.renderPlaylistChannels();
            this.renderAvailableChannels(); // Re-render to update add button states
            this.updateUI();
        }
    }
    
    savePlaylist() {
        if (!this.selectedPlaylist) return;
        
        const index = this.playlists.findIndex(p => p.id === this.selectedPlaylist.id);
        if (index !== -1) {
            this.playlists[index] = { ...this.selectedPlaylist };
        }
        
        this.saveAllPlaylists();
    }
    
    async saveAllPlaylists() {
        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playlists: this.playlists
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save playlists');
            }
            
            // Show success feedback (could add a toast notification here)
            
        } catch (error) {
            console.error('Error saving playlists:', error);
            alert('Failed to save playlists. Please try again.');
        }
    }
}

// Initialize the playlist manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.playlistManager = new PlaylistManager();
});