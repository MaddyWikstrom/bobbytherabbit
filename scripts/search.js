// Advanced Search Functionality
class SearchManager {
    constructor() {
        this.searchIndex = [];
        this.searchHistory = [];
        this.popularSearches = ['hoodie', 't-shirt', 'streetwear', 'rabbit hardware', 'joggers'];
        this.isSearching = false;
        
        this.loadSearchHistory();
        this.init();
    }

    init() {
        this.buildSearchIndex();
        this.setupEventListeners();
        this.setupVoiceSearch();
    }

    buildSearchIndex() {
        // Build search index from products
        if (window.productManager && window.productManager.products) {
            this.searchIndex = window.productManager.products.map(product => ({
                id: product.id,
                title: product.title.toLowerCase(),
                description: product.description.toLowerCase(),
                category: product.category.toLowerCase(),
                colors: product.colors.map(c => c.toLowerCase()),
                sizes: product.sizes.map(s => s.toLowerCase()),
                tags: this.generateTags(product),
                price: product.price,
                featured: product.featured,
                new: product.new,
                sale: product.sale
            }));
        }
    }

    generateTags(product) {
        const tags = [];
        
        // Extract tags from title
        const titleWords = product.title.toLowerCase().split(/\s+/);
        tags.push(...titleWords);
        
        // Add category-specific tags
        switch (product.category) {
            case 'hoodie':
                tags.push('sweatshirt', 'pullover', 'warm', 'casual');
                break;
            case 't-shirt':
                tags.push('tee', 'shirt', 'casual', 'cotton');
                break;
            case 'joggers':
                tags.push('pants', 'sweatpants', 'athletic', 'comfortable');
                break;
            case 'windbreaker':
                tags.push('jacket', 'outerwear', 'lightweight', 'weather');
                break;
            case 'beanie':
                tags.push('hat', 'cap', 'winter', 'accessory');
                break;
        }
        
        // Add brand tags
        if (product.title.includes('BUNGI')) tags.push('bungi');
        if (product.title.includes('BOBBY')) tags.push('bobby');
        if (product.title.includes('RABBIT')) tags.push('rabbit');
        if (product.title.includes('HARDWARE')) tags.push('hardware');
        
        // Add style tags
        if (product.title.includes('DARKMODE')) tags.push('dark', 'black');
        if (product.title.includes('LIGHTMODE')) tags.push('light', 'white');
        if (product.title.includes('COWBOY')) tags.push('western', 'vintage');
        
        return [...new Set(tags)]; // Remove duplicates
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const searchToggle = document.getElementById('search-toggle');
        const searchClose = document.getElementById('search-close');
        const searchOverlay = document.getElementById('search-overlay');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });

            searchInput.addEventListener('keydown', (e) => {
                this.handleSearchKeydown(e);
            });

            searchInput.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });
        }

        if (searchToggle) {
            searchToggle.addEventListener('click', () => {
                this.openSearch();
            });
        }

        if (searchClose) {
            searchClose.addEventListener('click', () => {
                this.closeSearch();
            });
        }

        if (searchOverlay) {
            searchOverlay.addEventListener('click', (e) => {
                if (e.target === searchOverlay) {
                    this.closeSearch();
                }
            });
        }

        // Global search shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
        });
    }

    setupVoiceSearch() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = transcript;
                    this.handleSearchInput(transcript);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };

            // Add voice search button
            this.addVoiceSearchButton();
        }
    }

    addVoiceSearchButton() {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            const voiceBtn = document.createElement('button');
            voiceBtn.className = 'voice-search-btn';
            voiceBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
            `;
            voiceBtn.title = 'Voice Search';
            voiceBtn.addEventListener('click', () => this.startVoiceSearch());
            
            searchContainer.appendChild(voiceBtn);
        }
    }

    startVoiceSearch() {
        if (this.recognition) {
            const voiceBtn = document.querySelector('.voice-search-btn');
            voiceBtn.classList.add('listening');
            this.recognition.start();
            
            setTimeout(() => {
                voiceBtn.classList.remove('listening');
            }, 5000);
        }
    }

    handleSearchInput(query) {
        const trimmedQuery = query.trim();
        
        if (trimmedQuery.length === 0) {
            this.showSearchSuggestions();
            return;
        }

        if (trimmedQuery.length < 2) {
            this.clearSearchResults();
            return;
        }

        this.isSearching = true;
        this.performSearch(trimmedQuery);
    }

    handleSearchKeydown(e) {
        const searchResults = document.getElementById('search-results');
        const activeResult = searchResults.querySelector('.search-result-item.active');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.navigateResults('down');
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateResults('up');
                break;
            case 'Enter':
                e.preventDefault();
                if (activeResult) {
                    this.selectResult(activeResult);
                } else {
                    this.performFullSearch(e.target.value);
                }
                break;
            case 'Escape':
                this.closeSearch();
                break;
        }
    }

    navigateResults(direction) {
        const searchResults = document.getElementById('search-results');
        const results = searchResults.querySelectorAll('.search-result-item');
        const activeResult = searchResults.querySelector('.search-result-item.active');
        
        if (results.length === 0) return;
        
        let newIndex = 0;
        
        if (activeResult) {
            const currentIndex = Array.from(results).indexOf(activeResult);
            activeResult.classList.remove('active');
            
            if (direction === 'down') {
                newIndex = (currentIndex + 1) % results.length;
            } else {
                newIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
            }
        }
        
        results[newIndex].classList.add('active');
        results[newIndex].scrollIntoView({ block: 'nearest' });
    }

    selectResult(resultElement) {
        const productId = resultElement.dataset.productId;
        if (productId) {
            this.addToSearchHistory(resultElement.querySelector('.search-result-title').textContent);
            this.closeSearch();
            
            if (window.productManager) {
                window.productManager.viewProduct(productId);
            }
        }
    }

    performSearch(query) {
        const results = this.searchProducts(query);
        this.renderSearchResults(results, query);
        this.addSearchSuggestions(query);
    }

    searchProducts(query) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const results = [];

        this.searchIndex.forEach(item => {
            let score = 0;
            let matches = [];

            queryWords.forEach(word => {
                // Title matches (highest priority)
                if (item.title.includes(word)) {
                    score += item.title.indexOf(word) === 0 ? 10 : 5;
                    matches.push('title');
                }

                // Category matches
                if (item.category.includes(word)) {
                    score += 8;
                    matches.push('category');
                }

                // Tag matches
                if (item.tags.some(tag => tag.includes(word))) {
                    score += 3;
                    matches.push('tags');
                }

                // Color matches
                if (item.colors.some(color => color.includes(word))) {
                    score += 2;
                    matches.push('colors');
                }

                // Size matches
                if (item.sizes.some(size => size.includes(word))) {
                    score += 2;
                    matches.push('sizes');
                }

                // Description matches (lowest priority)
                if (item.description.includes(word)) {
                    score += 1;
                    matches.push('description');
                }
            });

            // Boost score for special attributes
            if (item.featured) score += 2;
            if (item.new) score += 1;
            if (item.sale) score += 1;

            if (score > 0) {
                results.push({
                    ...item,
                    score,
                    matches: [...new Set(matches)]
                });
            }
        });

        // Sort by score (descending) and return top 10
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }

    renderSearchResults(results, query) {
        const searchResults = document.getElementById('search-results');
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="no-search-results">
                    <div class="no-results-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>
                    <h4>No results found for "${query}"</h4>
                    <p>Try different keywords or browse our categories</p>
                    <div class="search-suggestions">
                        <h5>Popular searches:</h5>
                        <div class="suggestion-tags">
                            ${this.popularSearches.map(term => 
                                `<button class="suggestion-tag" onclick="searchManager.performFullSearch('${term}')">${term}</button>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const resultsHTML = results.map(result => {
            const product = window.productManager.products.find(p => p.id === result.id);
            if (!product) return '';

            return `
                <div class="search-result-item" data-product-id="${result.id}" onclick="searchManager.selectResult(this)">
                    <img src="${product.mainImage}" alt="${product.title}" class="search-result-image">
                    <div class="search-result-info">
                        <div class="search-result-title">${this.highlightQuery(product.title, query)}</div>
                        <div class="search-result-category">${product.category.replace('-', ' ')}</div>
                        <div class="search-result-price">$${product.price.toFixed(2)}</div>
                        <div class="search-result-matches">
                            ${result.matches.slice(0, 3).map(match => 
                                `<span class="match-tag">${match}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="search-result-actions">
                        <button class="quick-add-btn" onclick="event.stopPropagation(); searchManager.quickAdd('${result.id}')" title="Quick add to cart">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        searchResults.innerHTML = `
            <div class="search-results-header">
                <span class="results-count">${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"</span>
                <button class="view-all-btn" onclick="searchManager.performFullSearch('${query}')">View all</button>
            </div>
            ${resultsHTML}
        `;
    }

    highlightQuery(text, query) {
        const queryWords = query.toLowerCase().split(/\s+/);
        let highlightedText = text;

        queryWords.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });

        return highlightedText;
    }

    showSearchSuggestions() {
        const searchResults = document.getElementById('search-results');
        const recentSearches = this.searchHistory.slice(0, 5);
        
        searchResults.innerHTML = `
            <div class="search-suggestions">
                ${recentSearches.length > 0 ? `
                    <div class="suggestion-section">
                        <h5>Recent searches</h5>
                        <div class="suggestion-list">
                            ${recentSearches.map(term => 
                                `<button class="suggestion-item" onclick="searchManager.performFullSearch('${term}')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M12 1v6m0 6v6m6-12h-6m-6 0h6"></path>
                                    </svg>
                                    ${term}
                                </button>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="suggestion-section">
                    <h5>Popular searches</h5>
                    <div class="suggestion-list">
                        ${this.popularSearches.map(term => 
                            `<button class="suggestion-item" onclick="searchManager.performFullSearch('${term}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                ${term}
                            </button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    clearSearchResults() {
        const searchResults = document.getElementById('search-results');
        searchResults.innerHTML = '';
    }

    performFullSearch(query) {
        this.addToSearchHistory(query);
        this.closeSearch();
        
        // Update product manager with search query
        if (window.productManager) {
            window.productManager.searchQuery = query;
            window.productManager.currentCategory = 'all';
            window.productManager.currentPage = 1;
            window.productManager.filterProducts();
            window.productManager.renderProducts();
        }
    }

    quickAdd(productId) {
        const product = window.productManager.products.find(p => p.id === productId);
        if (product && window.cartManager) {
            window.cartManager.addItem(product);
        }
    }

    openSearch() {
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('search-input');
        
        if (searchOverlay) {
            searchOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    }

    closeSearch() {
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('search-input');
        
        if (searchOverlay) {
            searchOverlay.classList.remove('active');
            document.body.style.overflow = '';
            
            if (searchInput) {
                searchInput.value = '';
            }
            
            this.clearSearchResults();
        }
    }

    addToSearchHistory(query) {
        const trimmedQuery = query.trim().toLowerCase();
        if (trimmedQuery && !this.searchHistory.includes(trimmedQuery)) {
            this.searchHistory.unshift(trimmedQuery);
            this.searchHistory = this.searchHistory.slice(0, 10); // Keep only last 10
            this.saveSearchHistory();
        }
    }

    addSearchSuggestions(query) {
        // Add to popular searches if it gets searched frequently
        // This would typically be handled by analytics
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('bobby-streetwear-search-history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    loadSearchHistory() {
        try {
            const savedHistory = localStorage.getItem('bobby-streetwear-search-history');
            if (savedHistory) {
                this.searchHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
            this.searchHistory = [];
        }
    }

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        this.showSearchSuggestions();
    }
}

// Initialize search manager
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});

// Add search-specific styles
const searchStyles = `
    .voice-search-btn {
        position: absolute;
        right: 4rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        padding: 0.5rem;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .voice-search-btn:hover {
        color: #ffffff;
        background: rgba(168, 85, 247, 0.2);
    }

    .voice-search-btn.listening {
        color: #ef4444;
        animation: pulse 1s infinite;
    }

    .search-results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid rgba(168, 85, 247, 0.2);
        margin-bottom: 1rem;
    }

    .results-count {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
    }

    .view-all-btn {
        background: rgba(168, 85, 247, 0.2);
        border: 1px solid rgba(168, 85, 247, 0.3);
        color: #a855f7;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }

    .view-all-btn:hover {
        background: rgba(168, 85, 247, 0.4);
    }

    .search-result-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: rgba(26, 26, 46, 0.8);
        border-radius: 12px;
        margin-bottom: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid transparent;
    }

    .search-result-item:hover,
    .search-result-item.active {
        background: rgba(168, 85, 247, 0.1);
        border-color: rgba(168, 85, 247, 0.3);
        transform: translateX(5px);
    }

    .search-result-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
        flex-shrink: 0;
    }

    .search-result-info {
        flex: 1;
        min-width: 0;
    }

    .search-result-title {
        color: #ffffff;
        font-weight: 600;
        margin-bottom: 0.25rem;
        font-size: 0.95rem;
    }

    .search-result-title mark {
        background: rgba(168, 85, 247, 0.3);
        color: #a855f7;
        padding: 0.1em 0.2em;
        border-radius: 3px;
    }

    .search-result-category {
        color: rgba(168, 85, 247, 0.8);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
    }

    .search-result-price {
        color: #ffffff;
        font-weight: 600;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
    }

    .search-result-matches {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
    }

    .match-tag {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
    }

    .search-result-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .quick-add-btn {
        background: rgba(34, 197, 94, 0.2);
        border: none;
        color: #22c55e;
        padding: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .quick-add-btn:hover {
        background: rgba(34, 197, 94, 0.4);
        transform: scale(1.1);
    }

    .no-search-results {
        text-align: center;
        padding: 3rem 1rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .no-results-icon {
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .no-search-results h4 {
        color: #ffffff;
        margin-bottom: 0.5rem;
    }

    .search-suggestions {
        padding: 1rem 0;
    }

    .suggestion-section {
        margin-bottom: 2rem;
    }

    .suggestion-section h5 {
        color: #ffffff;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .suggestion-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .suggestion-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(168, 85, 247, 0.2);
        color: rgba(255, 255, 255, 0.8);
        padding: 0.75rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;
        width: 100%;
    }

    .suggestion-item:hover {
        background: rgba(168, 85, 247, 0.1);
        border-color: rgba(168, 85, 247, 0.3);
        color: #ffffff;
        transform: translateX(5px);
    }

    .suggestion-tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 1rem;
    }

    .suggestion-tag {
        background: rgba(168, 85, 247, 0.2);
        border: 1px solid rgba(168, 85, 247, 0.3);
        color: #a855f7;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }

    .suggestion-tag:hover {
        background: rgba(168, 85, 247, 0.4);
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        .search-result-item {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
        }

        .search-result-image {
            width: 80px;
            height: 80px;
        }

        .search-result-actions {
            justify-content: center;
        }

        .voice-search-btn {
            right: 3rem;
        }
    }
`;

// Inject search styles
const searchStyleSheet = document.createElement('style');
searchStyleSheet.textContent = searchStyles;
document.head.appendChild(searchStyleSheet);