// Carousel functionality for featured programs
class CarouselManager {
    constructor() {
        this.cardsContainer = null;
        this.indicatorsContainer = null;
        this.cardTemplate = null;
        this.allCards = [];
        this.totalCards = 0;
        this.cardsPerView = 3;
        this.totalPages = 0;
        this.currentPage = 0;
        this.autoPlayInterval = null;
        
        this.init();
    }

    init() {
        this.cardsContainer = document.getElementById('cards-container');
        this.indicatorsContainer = document.getElementById('carousel-indicators');
        this.cardTemplate = document.getElementById('card-template');
        
        if (!this.cardsContainer || !this.cardTemplate) return;
        
        this.allCards = Array.from(this.cardTemplate.querySelectorAll('.program-card'));
        this.totalCards = this.allCards.length;
        this.totalPages = Math.ceil(this.totalCards / this.cardsPerView);
        
        this.setupCarousel();
    }

    setupCarousel() {
        if (this.totalPages > 1) {
            this.createIndicators();
            this.startAutoPlay();
        }
        
        this.goToPage(0);
    }

    createIndicators() {
        for (let i = 0; i < this.totalPages; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'w-2 h-2 rounded-full transition-all duration-300 cursor-pointer';
            indicator.onclick = () => this.goToPage(i);
            this.indicatorsContainer.appendChild(indicator);
        }
    }

    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            this.nextPage();
        }, 12000);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    showPage(pageIndex) {
        this.cardsContainer.innerHTML = '';
        const startIndex = pageIndex * this.cardsPerView;
        const endIndex = Math.min(startIndex + this.cardsPerView, this.totalCards);
        
        for (let i = startIndex; i < endIndex; i++) {
            const cardClone = this.allCards[i].cloneNode(true);
            this.cardsContainer.appendChild(cardClone);
        }
    }
    
    updateIndicators() {
        const indicators = this.indicatorsContainer.children;
        for (let i = 0; i < indicators.length; i++) {
            if (i === this.currentPage) {
                indicators[i].className = 'w-2 h-2 rounded-full bg-blue-400 transition-all duration-300 cursor-pointer';
            } else {
                indicators[i].className = 'w-2 h-2 rounded-full bg-gray-600 transition-all duration-300 cursor-pointer';
            }
        }
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.showPage(this.currentPage);
        this.updateIndicators();
    }
    
    nextPage() {
        this.currentPage = (this.currentPage + 1) % this.totalPages;
        this.goToPage(this.currentPage);
    }

    prevPage() {
        this.currentPage = (this.currentPage - 1 + this.totalPages) % this.totalPages;
        this.goToPage(this.currentPage);
    }

    destroy() {
        this.stopAutoPlay();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CarouselManager;
}