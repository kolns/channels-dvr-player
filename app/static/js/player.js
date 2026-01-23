// Player functionality for Channels DVR Player
// Main player management class

class ChannelsPlayer {
    constructor() {
        // Global state
        this.currentPlaylist = null;
        this.currentChannel = null;
        this.playlists = window.playlistsData || [];
        this.channels = window.channelsData || [];
        this.guideData = {};
        this.hls = null;
        
        // Update intervals
        this.programUpdateInterval = null;
        this.guideDataRefreshInterval = null;
        this.lastGuideDataFetch = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
        this.populatePlaylistDropdown();
        this.startProgramUpdates();
        this.handleUrlParameters();
        this.handleSavedPlaylist();
    }
    
    // Cookie helper functions
    setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }
    
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const channelIdFromUrl = urlParams.get('channel');
        
        if (channelIdFromUrl) {
            setTimeout(() => {
                this.selectChannelById(parseInt(channelIdFromUrl));
                // Clean up URL parameter after selecting channel
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }, 500);
        }
    }
    
    handleSavedPlaylist() {
        const savedPlaylistName = this.getCookie('selectedPlaylist');
        let playlistToSelect = null;
        
        if (savedPlaylistName && this.playlists.length > 0) {
            playlistToSelect = this.playlists.find(playlist => playlist.name === savedPlaylistName);
        }
        
        if (playlistToSelect) {
            this.selectPlaylist(playlistToSelect);
        } else if (this.playlists.length > 0) {
            this.selectPlaylist(this.playlists[0]);
        }
    }
    
    setupEventListeners() {
        // Playlist dropdown
        document.getElementById('playlistButton').addEventListener('click', () => this.togglePlaylistDropdown());
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#playlistButton') && !e.target.closest('#playlistDropdown')) {
                this.closePlaylistDropdown();
            }
        });
        
        // Video events
        const video = document.getElementById('videoPlayer');
        
        video.addEventListener('loadstart', () => {
            if (video.src && video.src !== '') {
                this.showLoading(true);
            }
        });
        
        video.addEventListener('canplay', () => {
            this.showLoading(false);
        });
        
        video.addEventListener('play', () => {
            this.updateLiveIndicator(true);
        });
        
        video.addEventListener('pause', () => {
            this.updateLiveIndicator(false);
        });
        
        video.addEventListener('error', (e) => {
            if (video.src && video.src !== '' && this.currentChannel) {
                this.handleVideoError(e);
                this.updateLiveIndicator(false);
            }
        });
    }
    
    updateLiveIndicator(isLive) {
        const dot = document.getElementById('liveIndicatorDot');
        const text = document.getElementById('liveIndicatorText');
        
        if (isLive) {
            // Live state - enhanced green glow with pulsing animation
            dot.className = 'w-2.5 h-2.5 bg-green-500 rounded-full shadow-lg';
            text.className = 'text-green-300 text-sm font-semibold tracking-wide';
            text.textContent = 'LIVE';
            
            // Add pulsing animation to the ping effect
            const pingEffect = dot.nextElementSibling;
            if (pingEffect) {
                pingEffect.className = 'absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-75';
            }
        } else {
            // Ready/Offline state - subdued gray
            dot.className = 'w-2.5 h-2.5 bg-gray-500 rounded-full shadow-lg';
            text.className = 'text-gray-400 text-sm font-semibold tracking-wide';
            text.textContent = 'READY';
            
            // Remove pulsing animation
            const pingEffect = dot.nextElementSibling;
            if (pingEffect) {
                pingEffect.className = 'absolute inset-0 w-2.5 h-2.5 bg-gray-500 rounded-full opacity-0';
            }
        }
    }
    
    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        document.getElementById('currentTime').textContent = timeString;
    }
    
    togglePlaylistDropdown() {
        const dropdown = document.getElementById('playlistDropdown');
        dropdown.classList.toggle('hidden');
    }
    
    closePlaylistDropdown() {
        document.getElementById('playlistDropdown').classList.add('hidden');
    }
    
    populatePlaylistDropdown() {
        const playlistList = document.getElementById('playlistList');
        
        if (this.playlists.length === 0) {
            playlistList.innerHTML = `
                <div class="px-3 py-4 text-center text-gray-400 text-sm">
                    <i class="fas fa-list mb-2"></i>
                    <div>No playlists available</div>
                    <a href="/playlist" class="text-red-400 hover:text-red-300 text-xs">Create a playlist</a>
                </div>
            `;
            return;
        }
        
        playlistList.innerHTML = this.playlists.map(playlist => {
            const isTemporary = playlist.isTemporary;
            const isSearchHistory = playlist.isSearchHistory;
            const isSpecial = isTemporary || isSearchHistory;
            
            let buttonClass, iconClass, textClass;
            
            if (isTemporary) {
                buttonClass = 'w-full text-left px-3 py-2 text-white text-sm rounded-lg border border-blue-500/30 bg-blue-600/10 transition-colors flex items-center justify-between hover:bg-blue-600/20';
                iconClass = 'fas fa-search text-blue-400 mr-2 text-xs';
                textClass = 'text-blue-300';
            } else if (isSearchHistory) {
                buttonClass = 'w-full text-left px-3 py-2 text-white text-sm rounded-lg border border-purple-500/30 bg-purple-600/10 transition-colors flex items-center justify-between hover:bg-purple-600/20';
                iconClass = 'fas fa-clock text-purple-400 mr-2 text-xs';
                textClass = 'text-purple-300';
            } else {
                buttonClass = 'w-full text-left px-3 py-2 text-white text-sm rounded-lg border border-transparent transition-colors flex items-center justify-between hover:bg-gray-700/50';
                iconClass = '';
                textClass = 'text-gray-400';
            }
                
            return `
                <button onclick="window.channelsPlayer.selectPlaylist(${JSON.stringify(playlist).replace(/"/g, '&quot;')})" 
                        class="${buttonClass}">
                    <div>
                        <div class="font-medium flex items-center">
                            ${isSpecial ? `<i class="${iconClass}"></i>` : ''}
                            ${playlist.name}
                        </div>
                        <div class="text-xs ${textClass}">${playlist.channels.length} channels</div>
                    </div>
                </button>
            `;
        }).join('');
    }
    
    selectPlaylist(playlist) {
        this.currentPlaylist = playlist;
        this.currentChannel = null;
        
        this.stopCurrentVideo();
        this.setCookie('selectedPlaylist', playlist.name);
        
        document.getElementById('playlistButtonText').textContent = playlist.name;
        document.getElementById('currentPlaylistName').textContent = playlist.name;
        
        this.closePlaylistDropdown();
        this.populateChannels();
        this.loadGuideData();
        this.showNoChannelOverlay(true);
    }
    
    populateChannels() {
        const channelList = document.getElementById('channelList');
        const channels = this.currentPlaylist ? this.currentPlaylist.channels : [];
        
        document.getElementById('channelCount').textContent = `${channels.length} channels`;
        
        if (channels.length === 0) {
            channelList.innerHTML = `
                <div class="p-8 text-center text-gray-400">
                    <i class="fas fa-tv text-3xl mb-4"></i>
                    <p class="text-sm">No channels found</p>
                    <p class="text-xs mt-2">Select a different playlist</p>
                </div>
            `;
            return;
        }
        
        let headerMessage = '';
        if (this.currentPlaylist && this.currentPlaylist.isTemporary) {
            headerMessage = `
                <div class="p-4 bg-blue-600/10 border-b border-blue-500/20">
                    <div class="flex items-center text-blue-300 text-sm">
                        <i class="fas fa-info-circle mr-2"></i>
                        <span>This channel was found through search.</span>
                    </div>
                </div>
            `;
        }
        
        channelList.innerHTML = headerMessage + channels.map(channel => `
            <div class="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer channel-item"
                 data-channel-id="${channel.id}"
                 onclick="window.channelsPlayer.selectChannel(${JSON.stringify(channel).replace(/"/g, '&quot;')})">
                
                <div class="p-4">
                    <div class="flex items-start space-x-3">
                        ${channel.logo_url ? 
                            `<img src="${channel.logo_url}" 
                                 alt="${channel.name}"
                                 class="w-12 h-12 rounded-lg object-contain bg-gray-800/30 border border-gray-600/50 p-1 channel-logo"
                                 onload="window.channelsPlayer.adjustLogoBackground(this)"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                             <div class="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600/50" style="display: none;">
                                 <i class="fas fa-tv text-gray-400"></i>
                             </div>` :
                            `<div class="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600/50">
                                 <i class="fas fa-tv text-gray-400"></i>
                             </div>`
                        }
                        
                        <div class="flex-1 min-w-0">
                            <div class="current-program-info">
                                <div class="text-xs text-gray-500">
                                    No program information
                                </div>
                            </div>
                            <div class="mt-1">
                                <h4 class="text-gray-400 text-xs truncate">${channel.name}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    adjustLogoBackground(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!img.complete) {
            img.addEventListener('load', () => this.adjustLogoBackground(img));
            return;
        }
        
        try {
            canvas.width = img.naturalWidth || 48;
            canvas.height = img.naturalHeight || 48;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let totalBrightness = 0;
            let pixelCount = 0;
            let transparentPixels = 0;
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const alpha = data[i + 3];
                
                if (alpha < 10) {
                    transparentPixels++;
                    continue;
                }
                
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                totalBrightness += brightness;
                pixelCount++;
            }
            
            const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;
            const transparencyRatio = transparentPixels / (data.length / 4);
            
            if (avgBrightness < 80 || transparencyRatio > 0.7) {
                img.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                img.style.padding = '2px';
            } else if (avgBrightness > 200) {
                img.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                img.style.padding = '2px';
            }
            
        } catch (error) {
            console.log('Logo analysis failed, applying fallback background');
            img.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }
    }
    
    selectChannel(channel) {
        this.currentChannel = channel;
        
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('bg-blue-600/20', 'border-blue-500/50');
        });
        
        const selectedItem = document.querySelector(`[data-channel-id="${channel.id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('bg-blue-600/20', 'border-blue-500/50');
        }
        
        this.showNoChannelOverlay(false);
        this.updateCurrentProgramBar();
        this.addToRecentChannels(channel);
        
        const proxyUrl = `/proxy/stream/${channel.id}`;
        console.log(`Loading channel ${channel.name} via proxy: ${proxyUrl}`);
        this.loadVideoStream(proxyUrl);
        
        document.getElementById('loadingChannelName').textContent = channel.name;
    }
    
    selectChannelById(channelId) {
        let targetChannel = null;
        let targetPlaylist = null;
        
        for (const playlist of this.playlists) {
            const channel = playlist.channels.find(ch => ch.id === channelId);
            if (channel) {
                targetChannel = channel;
                targetPlaylist = playlist;
                break;
            }
        }
        
        if (targetChannel && targetPlaylist) {
            if (this.currentPlaylist?.id !== targetPlaylist.id) {
                this.selectPlaylist(targetPlaylist);
                setTimeout(() => {
                    this.selectChannel(targetChannel);
                }, 200);
            } else {
                this.selectChannel(targetChannel);
            }
            console.log(`Auto-selected channel: ${targetChannel.name} from playlist: ${targetPlaylist.name}`);
        } else {
            console.log(`Channel ${channelId} not found in playlists, fetching from database...`);
            this.fetchChannelAndCreateTemporaryPlaylist(channelId);
        }
    }
    
    async fetchChannelAndCreateTemporaryPlaylist(channelId) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/channels/${channelId}`);
            if (!response.ok) {
                throw new Error(`Channel not found: ${response.status}`);
            }
            
            const channelData = await response.json();
            
            if (channelData.success && channelData.channel) {
                const channel = channelData.channel;
                
                // Add to search history since this was accessed via search/direct link
                this.addToSearchHistory(channel.id);
                
                const temporaryPlaylist = {
                    id: 'temp-search',
                    name: '🔍 Search Results',
                    channels: [channel],
                    isTemporary: true
                };
                
                const existingTempIndex = this.playlists.findIndex(p => p.id === 'temp-search');
                if (existingTempIndex !== -1) {
                    this.playlists[existingTempIndex] = temporaryPlaylist;
                } else {
                    this.playlists.unshift(temporaryPlaylist);
                }
                
                this.populatePlaylistDropdown();
                this.selectPlaylist(temporaryPlaylist);
                setTimeout(() => {
                    this.selectChannel(channel);
                    this.showLoading(false);
                }, 200);
                
                console.log(`Created temporary playlist for channel: ${channel.name}`);
            } else {
                throw new Error('Channel data not available');
            }
        } catch (error) {
            console.error('Error fetching channel:', error);
            this.showLoading(false);
            this.showErrorMessage(`Channel not available: ${error.message}`);
            this.showChannelNotAvailableOverlay();
        }
    }
    
    showChannelNotAvailableOverlay() {
        const noChannelOverlay = document.getElementById('noChannelOverlay');
        if (noChannelOverlay) {
            noChannelOverlay.innerHTML = `
                <div class="text-center text-white">
                    <i class="fas fa-exclamation-triangle text-6xl text-yellow-600 mb-6"></i>
                    <h2 class="text-2xl font-bold mb-4">Channel Not Available</h2>
                    <p class="text-gray-400 mb-6">This channel could not be loaded. It may have been removed or is currently unavailable.</p>
                    <button onclick="window.history.back()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>
                        Go Back
                    </button>
                </div>
            `;
            this.showNoChannelOverlay(true);
        }
    }
    
    loadVideoStream(streamUrl) {
        const video = document.getElementById('videoPlayer');
        
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        this.showLoading(true);
        console.log('Loading HLS stream:', streamUrl);
        
        video.setAttribute('crossorigin', 'anonymous');
        
        if (window.Hls && Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                capLevelToPlayerSize: false,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                forceKeyFrameOnDiscontinuity: true,
                abrEwmaFastLive: 3.0,
                abrEwmaSlowLive: 9.0,
                enableSoftwareAES: true
            });
            
            this.hls.loadSource(streamUrl);
            this.hls.attachMedia(video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest parsed successfully');
                video.play().catch(e => {
                    console.log('Autoplay failed:', e);
                    this.showLoading(false);
                });
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.MEDIA_ERROR || 
                        data.details === 'manifestIncompatibleCodecsError') {
                        console.log('Codec error detected, trying fallback...');
                        this.tryCodecFallback(streamUrl);
                    } else {
                        this.handleVideoError({ 
                            message: 'Stream loading failed. This may be due to codec compatibility issues.',
                            details: data.details 
                        });
                    }
                }
            });
            
            this.hls.on(Hls.Events.BUFFER_STALLED, () => {
                console.log('Buffer stalled - HDHomeRun stream may have issues');
            });
            
            this.hls.on(Hls.Events.BUFFER_EMPTY, () => {
                console.log('Buffer empty - waiting for HDHomeRun data');
            });
            
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            console.log('Using Safari native HLS support');
            video.src = streamUrl;
            
            video.play().catch(e => {
                console.log('Autoplay failed:', e);
                this.showLoading(false);
            });
        } else {
            console.error('HLS not supported in this browser');
            this.handleVideoError({ message: 'HLS not supported' });
        }
    }
    
    tryCodecFallback(originalUrl) {
        console.log('Trying codec fallback for HDHomeRun stream');
        
        try {
            const url = new URL(originalUrl);
            const currentCodec = url.searchParams.get('codec');
            
            if (currentCodec === 'copy') {
                url.searchParams.set('codec', 'h264');
                console.log('Fallback: Trying h264 codec instead of copy');
            } else {
                url.searchParams.set('codec', 'copy');
                console.log('Fallback: Trying copy codec');
            }
            
            const fallbackUrl = url.toString();
            console.log('Fallback URL:', fallbackUrl);
            
            if (this.hls) {
                this.hls.destroy();
                this.hls = null;
            }
            
            setTimeout(() => {
                this.loadVideoStreamWithUrl(fallbackUrl);
            }, 1000);
            
        } catch (error) {
            console.error('Fallback failed:', error);
            this.handleVideoError({ 
                message: 'Unable to play HDHomeRun stream. Codec compatibility issue.',
                details: 'Both copy and h264 codecs failed' 
            });
        }
    }
    
    loadVideoStreamWithUrl(streamUrl) {
        const video = document.getElementById('videoPlayer');
        
        if (window.Hls && Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                capLevelToPlayerSize: false,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                forceKeyFrameOnDiscontinuity: true,
                enableSoftwareAES: true
            });
            
            this.hls.loadSource(streamUrl);
            this.hls.attachMedia(video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('Fallback HLS manifest parsed successfully');
                video.play().catch(e => {
                    console.log('Fallback autoplay failed:', e);
                    this.showLoading(false);
                });
            });
            
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('Fallback HLS error:', data);
                if (data.fatal) {
                    this.handleVideoError({ 
                        message: 'HDHomeRun stream failed with both codec options. The stream may be unavailable or use an unsupported format.',
                        details: data.details 
                    });
                }
            });
        }
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    showNoChannelOverlay(show) {
        const overlay = document.getElementById('noChannelOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    stopCurrentVideo() {
        const video = document.getElementById('videoPlayer');
        
        video.pause();
        video.currentTime = 0;
        video.src = '';
        video.load();
        
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        this.showLoading(false);
        document.getElementById('currentProgramBar').style.display = 'none';
        this.updateLiveIndicator(false);
    }
    
    handleVideoError(error) {
        console.error('Video error occurred:', error);
        this.showLoading(false);
        
        const errorMsg = this.getErrorMessage(error);
        this.showErrorMessage(errorMsg);
    }
    
    getErrorMessage(error) {
        if (error.details === 'manifestIncompatibleCodecsError') {
            return 'This channel uses codecs that are not supported by your browser. Please try a different channel.';
        } else if (error.code === 4) {
            return 'Media could not be loaded, either because the server or network failed or because the format is not supported.';
        } else if (error.message && error.message.includes('Network')) {
            return 'Network error - please check your connection and try again.';
        } else if (error.code === 3) {
            return 'Video decoding error - the video format may not be supported by your browser.';
        } else if (error.code === 2) {
            return 'Network error while loading video - please check your connection.';
        } else {
            return 'Unable to load video stream. Please try selecting a different channel.';
        }
    }
    
    showErrorMessage(message) {
        let errorOverlay = document.getElementById('errorOverlay');
        
        if (!errorOverlay) {
            const videoContainer = document.querySelector('[id="videoPlayer"]').parentElement;
            errorOverlay = document.createElement('div');
            errorOverlay.id = 'errorOverlay';
            errorOverlay.className = 'absolute inset-0 bg-black/90 flex items-center justify-center z-10';
            videoContainer.appendChild(errorOverlay);
        }
        
        errorOverlay.innerHTML = `
            <div class="text-center text-white max-w-md mx-auto p-6">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h3 class="text-lg font-semibold mb-3">Playback Error</h3>
                <p class="text-sm text-gray-300 mb-6">${message}</p>
                <button onclick="window.channelsPlayer.hideErrorMessage()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    <i class="fas fa-times mr-2"></i>Close
                </button>
            </div>
        `;
        
        errorOverlay.classList.remove('hidden');
    }
    
    hideErrorMessage() {
        const errorOverlay = document.getElementById('errorOverlay');
        if (errorOverlay) {
            errorOverlay.classList.add('hidden');
        }
    }
    
    async loadGuideData() {
        if (!this.currentPlaylist) return;
        
        try {
            const now = Date.now();
            this.lastGuideDataFetch = now;
            
            const channelIds = this.currentPlaylist.channels.map(ch => ch.id);
            
            console.log(`Loading guide data for ${channelIds.length} channels...`);
            
            const response = await fetch('/api/guide/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channels: channelIds,
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
                })
            });
            
            if (response.ok) {
                const newGuideData = await response.json();
                
                if (newGuideData && Object.keys(newGuideData).length > 0) {
                    this.guideData = newGuideData;
                    console.log(`Guide data updated successfully for ${Object.keys(this.guideData).length} channels`);
                    
                    this.updateChannelListWithPrograms();
                    
                    if (this.currentChannel) {
                        this.updateCurrentProgramBar();
                    }
                } else {
                    console.warn('Received empty guide data, keeping existing data');
                }
            } else {
                console.error('Failed to load guide data:', response.status);
            }
        } catch (error) {
            console.error('Failed to load guide data:', error);
        }
    }
    
    startProgramUpdates() {
        this.programUpdateInterval = setInterval(() => {
            if (this.guideData && Object.keys(this.guideData).length > 0) {
                this.updateChannelListWithPrograms();
                
                if (this.currentChannel) {
                    this.updateCurrentProgramBar();
                    this.checkForProgramChanges();
                }
            }
        }, 30000);
        
        this.guideDataRefreshInterval = setInterval(() => {
            console.log('Refreshing guide data to stay current...');
            this.loadGuideData();
        }, 15 * 60 * 1000);
    }
    
    checkForProgramChanges() {
        if (!this.currentChannel || !this.guideData[this.currentChannel.id]) return;
        
        const now = new Date();
        const programs = this.guideData[this.currentChannel.id];
        let hasCurrentProgram = false;
        
        for (const program of programs) {
            try {
                let startTime, endTime;
                
                if (program.start_time.endsWith('Z') || program.start_time.includes('T')) {
                    startTime = new Date(program.start_time);
                    endTime = new Date(program.end_time);
                } else {
                    startTime = new Date(program.start_time + 'Z');
                    endTime = new Date(program.end_time + 'Z');
                }
                
                if (now >= startTime && now < endTime) {
                    hasCurrentProgram = true;
                    break;
                }
            } catch (error) {
                continue;
            }
        }
        
        if (!hasCurrentProgram) {
            const timeSinceLastFetch = Date.now() - this.lastGuideDataFetch;
            
            if (timeSinceLastFetch > 5 * 60 * 1000) {
                console.log('No current program found, refreshing guide data...');
                this.loadGuideData();
            }
        }
    }
    
    stopProgramUpdates() {
        if (this.programUpdateInterval) {
            clearInterval(this.programUpdateInterval);
            this.programUpdateInterval = null;
        }
        
        if (this.guideDataRefreshInterval) {
            clearInterval(this.guideDataRefreshInterval);
            this.guideDataRefreshInterval = null;
        }
    }
    
    getCurrentProgram(channel) {
        const now = new Date();
        const guideKey = channel.id;
        
        const channelPrograms = this.guideData[guideKey] || [];
        
        const currentProgram = channelPrograms.find(program => {
            let startTime, endTime;
            
            if (program.start_time.endsWith('Z') || program.start_time.includes('T')) {
                startTime = new Date(program.start_time);
                endTime = new Date(program.end_time);
            } else {
                startTime = new Date(program.start_time + 'Z');
                endTime = new Date(program.end_time + 'Z');
            }
            
            const now = new Date();
            return now >= startTime && now < endTime;
        });
        
        return currentProgram;
    }
    
    getProgramProgress(program) {
        if (!program) return 0;
        
        const now = new Date();
        let startTime, endTime;
        
        if (program.start_time.endsWith('Z') || program.start_time.includes('T')) {
            startTime = new Date(program.start_time);
            endTime = new Date(program.end_time);
        } else {
            startTime = new Date(program.start_time + 'Z');
            endTime = new Date(program.end_time + 'Z');
        }
        
        const totalDuration = endTime - startTime;
        const elapsed = now - startTime;
        
        return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    }
    
    formatProgramTime(program) {
        if (!program) return '--:-- - --:--';
        
        let startTime, endTime;
        
        if (program.start_time.endsWith('Z') || program.start_time.includes('T')) {
            startTime = new Date(program.start_time);
            endTime = new Date(program.end_time);
        } else {
            startTime = new Date(program.start_time + 'Z');
            endTime = new Date(program.end_time + 'Z');
        }
        
        const start = startTime.toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        const end = endTime.toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        
        return `${start} - ${end}`;
    }
    
    updateChannelListWithPrograms() {
        const channelItems = document.querySelectorAll('.channel-item');
        
        channelItems.forEach(item => {
            const channelId = parseInt(item.getAttribute('data-channel-id'));
            
            const channel = this.currentPlaylist ? this.currentPlaylist.channels.find(ch => ch.id === channelId) : null;
            
            if (!channel) {
                return;
            }
            
            const currentProgram = this.getCurrentProgram(channel);
            
            const programElement = item.querySelector('.current-program-info');
            
            if (programElement && currentProgram) {
                const progress = this.getProgramProgress(currentProgram);
                const timeRange = this.formatProgramTime(currentProgram);
                
                programElement.innerHTML = `
                    <div class="text-sm text-white font-semibold truncate mb-1">${currentProgram.title || 'Current Program'}</div>
                    <div class="text-xs text-gray-400 mb-1">${timeRange}</div>
                    <div class="w-full bg-gray-700 rounded-full h-1">
                        <div class="bg-slate-400 h-1 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                    </div>
                `;
            } else if (programElement) {
                programElement.innerHTML = `
                    <div class="text-xs text-gray-500">
                        No program information
                    </div>
                `;
            }
        });
    }
    
    updateCurrentProgramBar() {
        const programBar = document.getElementById('currentProgramBar');
        
        if (!this.currentChannel) {
            programBar.style.display = 'none';
            return;
        }
        
        const currentProgram = this.getCurrentProgram(this.currentChannel);
        
        document.getElementById('currentChannelName').textContent = this.currentChannel.name;
        
        if (currentProgram) {
            document.getElementById('currentProgramTitle').textContent = currentProgram.title || 'Current Program';
            document.getElementById('currentProgramTime').textContent = this.formatProgramTime(currentProgram);
            
            const progress = this.getProgramProgress(currentProgram);
            document.getElementById('currentProgramProgress').style.width = `${progress}%`;
            
            programBar.style.display = 'block';
        } else {
            document.getElementById('currentProgramTitle').textContent = 'No program information';
            document.getElementById('currentProgramTime').textContent = '';
            document.getElementById('currentProgramProgress').style.width = '0%';
            
            programBar.style.display = 'block';
        }
    }
    
    addToRecentChannels(channel) {
        try {
            let recentChannels = JSON.parse(localStorage.getItem('recentChannels') || '[]');
            
            const channelEntry = {
                id: channel.id,
                name: channel.name,
                logo_url: channel.logo_url || null,
                last_watched: new Date().toLocaleString()
            };
            
            recentChannels = recentChannels.filter(recent => recent.id !== channel.id);
            recentChannels.unshift(channelEntry);
            recentChannels = recentChannels.slice(0, 10);
            
            localStorage.setItem('recentChannels', JSON.stringify(recentChannels));
            
            console.log('Added to recent channels:', channel.name);
        } catch (error) {
            console.warn('Could not save to recent channels:', error);
        }
    }
    
    async addToSearchHistory(channelId) {
        // Add a channel to search history
        try {
            await fetch('/api/search-history/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ channel_id: parseInt(channelId) })
            });
            console.log('Added channel to search history:', channelId);
        } catch (error) {
            console.warn('Could not add to search history:', error);
        }
    }
    
    destroy() {
        this.stopProgramUpdates();
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }
}

// Initialize the player when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global player instance
    window.channelsPlayer = new ChannelsPlayer();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.channelsPlayer) {
        window.channelsPlayer.destroy();
    }
});