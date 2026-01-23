// Search functionality for Channels DVR Player
class SearchManager {
    constructor() {
        this.directSearchInput = null;
        this.searchResultsDropdown = null;
        this.clearSearchBtn = null;
        this.searchResults = null;
        this.searchTimeout = null;
        
        this.init();
    }

    init() {
        this.directSearchInput = document.getElementById('directSearchInput');
        this.searchResultsDropdown = document.getElementById('searchResultsDropdown');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.searchResults = document.getElementById('searchResults');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Direct search functionality
        if (this.directSearchInput) {
            this.directSearchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length === 0) {
                    this.hideSearchResults();
                    return;
                }
                
                if (query.length < 2) {
                    this.showSearchResults();
                    this.showSearchMessage('Type at least 2 characters to search');
                    return;
                }
                
                this.showSearchResults();
                this.searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300);
            });
            
            this.directSearchInput.addEventListener('focus', () => {
                if (this.directSearchInput.value.trim().length >= 2) {
                    this.showSearchResults();
                }
            });
            
            // Clear search on escape
            this.directSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.directSearchInput.value = '';
                    this.hideSearchResults();
                    this.directSearchInput.blur();
                }
            });
        }
        
        // Clear search button
        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', () => {
                this.directSearchInput.value = '';
                this.hideSearchResults();
                this.directSearchInput.focus();
            });
        }
        
        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#directSearchInput') && !e.target.closest('#searchResultsDropdown')) {
                this.hideSearchResults();
            }
        });
    }

    showSearchResults() {
        if (this.searchResultsDropdown) {
            this.searchResultsDropdown.classList.remove('hidden');
        }
    }
    
    hideSearchResults() {
        if (this.searchResultsDropdown) {
            this.searchResultsDropdown.classList.add('hidden');
        }
    }
    
    showDefaultSearchMessage() {
        if (this.searchResults) {
            this.searchResults.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-search text-4xl mb-4 opacity-50"></i>
                    <p>Start typing to search for channels and programs</p>
                </div>
            `;
        }
    }
    
    showSearchMessage(message) {
        if (this.searchResults) {
            this.searchResults.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-info-circle text-2xl mb-4 opacity-50"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    async performSearch(query) {
        if (!this.searchResults) return;
        
        // Show loading state
        this.searchResults.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i class="fas fa-spinner fa-spin text-2xl mb-4"></i>
                <p>Searching...</p>
            </div>
        `;
        
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success) {
                this.displaySearchResults(data.results);
            } else {
                this.showSearchMessage('Search failed. Please try again.');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchMessage('Search error. Please check your connection.');
        }
    }
    
    displaySearchResults(results) {
        if (!this.searchResults) return;
        
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-search text-2xl mb-4 opacity-50"></i>
                    <p>No results found</p>
                    <p class="text-sm">Try a different search term</p>
                </div>
            `;
            return;
        }
        
        const resultHtml = results.map(result => {
            if (result.type === 'channel') {
                return `
                    <div class="group bg-gradient-to-r from-gray-800/60 to-gray-700/60 hover:from-blue-600/60 hover:to-purple-600/60 backdrop-blur-sm border border-gray-600/40 hover:border-blue-500/50 rounded-xl p-4 mb-3 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" onclick="selectChannel('${result.id}')">
                        <div class="flex items-center">
                            ${result.logo_url ? 
                                `<div class="w-12 h-12 rounded-lg overflow-hidden mr-4 bg-gray-700/50 flex items-center justify-center border border-gray-600/30">
                                    <img src="${result.logo_url}" alt="${result.name}" class="w-full h-full object-contain">
                                 </div>` :
                                `<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4 shadow-lg">
                                    <span class="text-white font-bold text-sm">${result.name.substr(0, 2)}</span>
                                 </div>`
                            }
                            <div class="flex-1">
                                <h4 class="text-white font-semibold group-hover:text-blue-200 transition-colors">${result.name}</h4>
                                <p class="text-gray-400 text-sm group-hover:text-blue-300 transition-colors">${result.current_program || 'Channel'}</p>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div class="bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium border border-green-500/30">
                                    LIVE
                                </div>
                                <i class="fas fa-play text-green-400 group-hover:text-green-300 transition-colors text-lg"></i>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="group bg-gradient-to-r from-gray-800/60 to-gray-700/60 hover:from-purple-600/60 hover:to-pink-600/60 backdrop-blur-sm border border-gray-600/40 hover:border-purple-500/50 rounded-xl p-4 mb-3 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" onclick="selectProgram('${result.channel_id}')">
                        <div class="flex items-center">
                            ${result.artwork_url ? 
                                `<div class="w-12 h-12 rounded-lg overflow-hidden mr-4 bg-gray-700/50 flex items-center justify-center border border-gray-600/30">
                                    <img src="${result.artwork_url}" alt="${result.title}" class="w-full h-full object-cover">
                                 </div>` :
                                `<div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4 shadow-lg">
                                    <i class="fas fa-tv text-white"></i>
                                 </div>`
                            }
                            <div class="flex-1">
                                <h4 class="text-white font-semibold group-hover:text-purple-200 transition-colors">${result.title}</h4>
                                <p class="text-gray-400 text-sm group-hover:text-purple-300 transition-colors">${result.channel_name} • ${result.start_time}</p>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div class="bg-purple-600/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium border border-purple-500/30">
                                    PROGRAM
                                </div>
                                <i class="fas fa-play text-green-400 group-hover:text-green-300 transition-colors text-lg"></i>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        this.searchResults.innerHTML = resultHtml;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
}