// Products Management System
class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.currentCategory = 'all';
        this.currentSort = 'featured';
        this.currentView = 'grid';
        this.searchQuery = '';
        
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.renderProducts();
    }

    async loadProducts() {
        try {
            // Try to parse CSV data from the products_export_1.csv file
            const csvData = await this.loadCSVData();
            this.products = this.parseCSVToProducts(csvData);
            
            // If no products were parsed from CSV, use sample products but log it
            if (this.products.length === 0) {
                console.log('No products parsed from CSV, using sample products');
                this.products = this.getSampleProducts();
            } else {
                console.log(`Successfully loaded ${this.products.length} products from CSV`);
            }
            
            this.filteredProducts = [...this.products];
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback to sample products if CSV loading fails
            console.log('Falling back to sample products due to error');
            this.products = this.getSampleProducts();
            this.filteredProducts = [...this.products];
        }
    }

    async loadCSVData() {
        try {
            const response = await fetch('products_export_1.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return csvText;
        } catch (error) {
            console.error('Error loading CSV:', error);
            // Return empty string to trigger fallback to sample products
            return '';
        }
    }

    parseCSVToProducts(csvText) {
        if (!csvText || csvText.trim() === '') {
            console.log('CSV data is empty, using sample products');
            return this.getSampleProducts();
        }

        const lines = csvText.split('\n');
        if (lines.length < 2) {
            console.log('CSV has insufficient data, using sample products');
            return this.getSampleProducts();
        }

        const headers = lines[0].split(',');
        const products = new Map();

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length < headers.length) continue;

            const handle = values[0];
            const title = values[1];
            const description = values[2];
            const price = parseFloat(values[22]) || 0;
            const comparePrice = parseFloat(values[23]) || 0;
            const imageUrl = values[26];
            const color = values[9] || '';
            const size = values[12] || '';

            if (!handle || !title) continue;

            if (!products.has(handle)) {
                // Map to local mockup images using the CSV image URL
                const localImages = this.getLocalMockupImages(imageUrl);
                
                products.set(handle, {
                    id: handle,
                    title: title,
                    description: this.cleanDescription(description),
                    category: this.extractCategory(title),
                    price: price,
                    comparePrice: comparePrice > price ? comparePrice : null,
                    images: localImages,
                    variants: [],
                    colors: new Set(),
                    sizes: new Set(),
                    featured: Math.random() > 0.7,
                    new: Math.random() > 0.8,
                    sale: comparePrice > price
                });
            }

            const product = products.get(handle);
            if (color) product.colors.add(color);
            if (size) product.sizes.add(size);
            
            // Add local mockup image for this variant using the CSV image URL
            const variantImages = this.getLocalMockupImages(imageUrl);
            variantImages.forEach(img => {
                if (!product.images.includes(img)) {
                    product.images.push(img);
                }
            });

            product.variants.push({
                color: color,
                size: size,
                price: price,
                comparePrice: comparePrice > price ? comparePrice : null,
                image: variantImages[0] || 'assets/placeholder.jpg'
            });
        }

        return Array.from(products.values()).map(product => ({
            ...product,
            colors: Array.from(product.colors),
            sizes: Array.from(product.sizes),
            mainImage: product.images[0] || 'assets/placeholder.jpg'
        }));
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    cleanDescription(description) {
        if (!description) return '';
        return description
            .replace(/<[^>]*>/g, '')
            .replace(/&[^;]+;/g, ' ')
            .trim()
            .substring(0, 200) + '...';
    }

    extractCategory(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('hoodie')) return 'hoodie';
        if (titleLower.includes('t-shirt') || titleLower.includes('tee')) return 't-shirt';
        if (titleLower.includes('sweatshirt')) return 'sweatshirt';
        if (titleLower.includes('joggers') || titleLower.includes('pants')) return 'joggers';
        if (titleLower.includes('windbreaker') || titleLower.includes('jacket')) return 'windbreaker';
        if (titleLower.includes('beanie') || titleLower.includes('hat')) return 'beanie';
        return 'other';
    }

    getLocalMockupImages(imageUrl) {
        if (!imageUrl) return ['assets/placeholder.jpg'];
        
        // Extract the unique identifier from the CSV image URL
        // Example: https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png?v=1748999462
        // We want to extract: 683f9d11a7936
        const match = imageUrl.match(/([a-f0-9]{13})\.png/);
        if (!match) return ['assets/placeholder.jpg'];
        
        const identifier = match[1];
        
        // Find matching mockup files with this identifier
        const mockupImages = this.findMockupsByIdentifier(identifier);
        
        return mockupImages.length > 0 ? mockupImages : ['assets/placeholder.jpg'];
    }

    findMockupsByIdentifier(identifier) {
        // Create a mapping of known identifiers to mockup files
        // This maps the CSV image identifiers to local mockup files
        const identifierMap = {
            // Black hoodie identifiers from CSV
            '683f9d11a7936': ['mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png'],
            '683f9d11a9742': ['mockups/unisex-premium-hoodie-black-front-683f9021c7dbc.png'],
            
            // Navy Blazer hoodie identifiers
            '683f9d11ab4fe': ['mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png'],
            '683f9d11ae0c4': ['mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png'],
            
            // Maroon hoodie identifiers
            '683f9d11b1d12': ['mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png'],
            '683f9d11b64a3': ['mockups/unisex-premium-hoodie-maroon-back-683f90225ac87.png'],
            
            // Charcoal Heather hoodie identifiers
            '683f9d11bbc17': ['mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png'],
            '683f9d11c14f8': ['mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022d94ea.png'],
            
            // Vintage Black hoodie identifiers
            '683f9d11c724f': ['mockups/unisex-premium-hoodie-vintage-black-front-683f9023cc9cc.png'],
            '683f9d11ce1c5': ['mockups/unisex-premium-hoodie-vintage-black-back-683f9023a579e.png'],
            
            // White hoodie identifiers
            '683f9ce1094eb': ['mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png'],
            '683f9ce10ab8f': ['mockups/unisex-premium-hoodie-white-back-683f8fddcabb2.png']
        };
        
        // Check if we have a direct mapping for this identifier
        if (identifierMap[identifier]) {
            return identifierMap[identifier];
        }
        
        // If no exact match, return fallback images
        return this.findSimilarMockups(identifier);
    }

    findSimilarMockups(identifier) {
        // Fallback: return a default set of hoodie images since most products are hoodies
        return [
            'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
            'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
            'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png'
        ];
    }


    getSampleProducts() {
        return [
            {
                id: 'bungi-hoodie-black',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie - Black',
                description: 'Premium streetwear hoodie with unique rabbit hardware design. Made from high-quality cotton blend for ultimate comfort.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: 65.00,
                mainImage: 'assets/hoodie-black.png',
                images: ['assets/hoodie-black.png'],
                colors: ['Black'],
                sizes: ['S', 'M', 'L', 'XL', '2XL'],
                featured: true,
                new: true,
                sale: true
            },
            {
                id: 'bungi-hoodie-navy',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie - Navy Blazer',
                description: 'Premium streetwear hoodie with unique rabbit hardware design. Made from high-quality cotton blend for ultimate comfort.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'assets/hoodie-navy.png',
                images: ['assets/hoodie-navy.png'],
                colors: ['Navy Blazer'],
                sizes: ['S', 'M', 'L', 'XL', '2XL'],
                featured: true,
                new: false,
                sale: false
            },
            {
                id: 'bungi-hoodie-maroon',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie - Maroon',
                description: 'Premium streetwear hoodie with unique rabbit hardware design. Made from high-quality cotton blend for ultimate comfort.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'assets/hoodie-maroon.png',
                images: ['assets/hoodie-maroon.png'],
                colors: ['Maroon'],
                sizes: ['S', 'M', 'L', 'XL', '2XL'],
                featured: false,
                new: true,
                sale: false
            },
            {
                id: 'bungi-hoodie-charcoal',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie - Charcoal Heather',
                description: 'Premium streetwear hoodie with unique rabbit hardware design. Made from high-quality cotton blend for ultimate comfort.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: 58.00,
                mainImage: 'assets/hoodie-charcoal.png',
                images: ['assets/hoodie-charcoal.png'],
                colors: ['Charcoal Heather'],
                sizes: ['S', 'M', 'L', 'XL', '2XL'],
                featured: false,
                new: false,
                sale: true
            },
            {
                id: 'bungi-hoodie-white',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie - White',
                description: 'Premium streetwear hoodie with unique rabbit hardware design. Made from high-quality cotton blend for ultimate comfort.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'assets/hoodie-white.png',
                images: ['assets/hoodie-white.png'],
                colors: ['White'],
                sizes: ['S', 'M', 'L', 'XL', '2XL'],
                featured: true,
                new: false,
                sale: false
            },
            {
                id: 'bungi-hoodie-vintage-black',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie - Vintage Black',
                description: 'Premium streetwear hoodie with unique rabbit hardware design. Made from high-quality cotton blend for ultimate comfort.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'assets/hoodie-vintage-black.png',
                images: ['assets/hoodie-vintage-black.png'],
                colors: ['Vintage Black'],
                sizes: ['S', 'M', 'L', 'XL', '2XL'],
                featured: false,
                new: true,
                sale: false
            }
        ];
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.currentPage = 1;
                this.filterProducts();
                this.renderProducts();
            });
        });

        // Sort select
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.sortProducts();
                this.renderProducts();
            });
        }

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.updateView();
            });
        });

        // Search functionality
        this.setupSearch();

        // Navigation
        this.setupNavigation();
    }

    setupSearch() {
        const searchToggle = document.getElementById('search-toggle');
        const searchOverlay = document.getElementById('search-overlay');
        const searchClose = document.getElementById('search-close');
        const searchInput = document.getElementById('search-input');

        if (searchToggle && searchOverlay) {
            searchToggle.addEventListener('click', () => {
                searchOverlay.classList.add('active');
                searchInput.focus();
            });

            searchClose.addEventListener('click', () => {
                searchOverlay.classList.remove('active');
                searchInput.value = '';
                this.searchQuery = '';
                this.filterProducts();
                this.renderProducts();
            });

            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.performSearch();
            });

            // Close on escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                    searchOverlay.classList.remove('active');
                }
            });
        }
    }

    setupNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }
    }

    performSearch() {
        if (this.searchQuery.length === 0) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }

        const results = this.products.filter(product =>
            product.title.toLowerCase().includes(this.searchQuery) ||
            product.description.toLowerCase().includes(this.searchQuery) ||
            product.category.toLowerCase().includes(this.searchQuery)
        ).slice(0, 5);

        this.renderSearchResults(results);
    }

    renderSearchResults(results) {
        const searchResults = document.getElementById('search-results');
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No products found</div>';
            return;
        }

        searchResults.innerHTML = results.map(product => `
            <div class="search-result-item" onclick="productManager.viewProduct('${product.id}')">
                <img src="${product.mainImage}" alt="${product.title}" class="search-result-image">
                <div class="search-result-info">
                    <div class="search-result-title">${product.title}</div>
                    <div class="search-result-price">$${product.price.toFixed(2)}</div>
                </div>
            </div>
        `).join('');
    }

    filterProducts() {
        this.filteredProducts = this.products.filter(product => {
            const categoryMatch = this.currentCategory === 'all' || product.category === this.currentCategory;
            const searchMatch = this.searchQuery === '' || 
                product.title.toLowerCase().includes(this.searchQuery) ||
                product.description.toLowerCase().includes(this.searchQuery);
            
            return categoryMatch && searchMatch;
        });

        this.sortProducts();
    }

    sortProducts() {
        switch (this.currentSort) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'featured':
            default:
                this.filteredProducts.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    if (a.new && !b.new) return -1;
                    if (!a.new && b.new) return 1;
                    return 0;
                });
                break;
        }
    }

    updateView() {
        const productsGrid = document.getElementById('products-grid');
        if (this.currentView === 'list') {
            productsGrid.classList.add('list-view');
        } else {
            productsGrid.classList.remove('list-view');
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('products-grid');
        const loadingSkeleton = document.getElementById('loading-skeleton');
        
        // Show loading skeleton
        loadingSkeleton.style.display = 'grid';
        productsGrid.innerHTML = '';

        setTimeout(() => {
            loadingSkeleton.style.display = 'none';
            
            const startIndex = (this.currentPage - 1) * this.productsPerPage;
            const endIndex = startIndex + this.productsPerPage;
            const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

            if (productsToShow.length === 0) {
                productsGrid.innerHTML = `
                    <div class="no-products">
                        <h3>No products found</h3>
                        <p>Try adjusting your filters or search terms</p>
                    </div>
                `;
                return;
            }

            productsGrid.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');
            this.renderPagination();
            this.attachProductEventListeners();
        }, 500);
    }

    createProductCard(product) {
        const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.mainImage}" alt="${product.title}" class="product-image">
                    <div class="product-overlay">
                        <button class="product-action-btn quick-view-btn" title="Quick View">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="product-action-btn add-to-cart-quick" title="Add to Cart">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="product-badges">
                        ${product.new ? '<span class="product-badge new">New</span>' : ''}
                        ${product.sale ? `<span class="product-badge sale">-${discount}%</span>` : ''}
                        ${product.featured ? '<span class="product-badge">Featured</span>' : ''}
                    </div>
                    <button class="wishlist-btn" data-product-id="${product.id}" title="Add to Wishlist">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="product-info">
                    ${this.currentView === 'list' ? '<div class="product-details">' : ''}
                    <div class="product-category">${product.category.replace('-', ' ')}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                        ${product.comparePrice ? `<span class="price-original">$${product.comparePrice.toFixed(2)}</span>` : ''}
                        ${product.sale ? `<span class="price-discount">-${discount}%</span>` : ''}
                    </div>
                    ${product.colors.length > 0 ? `
                        <div class="product-variants">
                            ${product.colors.slice(0, 4).map(color => `
                                <div class="variant-option" style="background-color: ${this.getColorCode(color)}" title="${color}"></div>
                            `).join('')}
                            ${product.colors.length > 4 ? `<span class="variant-more">+${product.colors.length - 4}</span>` : ''}
                        </div>
                    ` : ''}
                    ${this.currentView === 'list' ? '</div><div class="product-actions">' : ''}
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                    ${this.currentView === 'list' ? '</div>' : ''}
                </div>
            </div>
        `;
    }

    getColorCode(colorName) {
        const colorMap = {
            'Black': '#000000',
            'White': '#FFFFFF',
            'Navy': '#001f3f',
            'Navy Blazer': '#001f3f',
            'Maroon': '#800000',
            'Charcoal Heather': '#36454F',
            'Vintage Black': '#2C2C2C',
            'Heather Grey': '#D3D3D3',
            'French Navy': '#002868',
            'Forest Green': '#228B22'
        };
        return colorMap[colorName] || '#a855f7';
    }

    attachProductEventListeners() {
        // Quick view buttons
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.closest('.product-card').dataset.productId;
                this.showQuickView(productId);
            });
        });

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn, .add-to-cart-quick').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.closest('.product-card').dataset.productId || e.target.dataset.productId;
                this.addToCart(productId);
            });
        });

        // Wishlist buttons
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.dataset.productId;
                this.toggleWishlist(productId);
            });
        });

        // Product card clicks
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const productId = card.dataset.productId;
                    this.viewProduct(productId);
                }
            });
        });
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="productManager.goToPage(${this.currentPage - 1})">
                ‹ Previous
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="productManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="productManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="productManager.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="productManager.goToPage(${this.currentPage + 1})">
                Next ›
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Add animation effect
        const button = document.querySelector(`[data-product-id="${productId}"] .add-to-cart-btn`);
        if (button) {
            button.style.transform = 'scale(0.95)';
            button.textContent = 'Added!';
            setTimeout(() => {
                button.style.transform = '';
                button.textContent = 'Add to Cart';
            }, 1000);
        }

        // Trigger cart update (handled by cart.js)
        if (window.cartManager) {
            window.cartManager.addItem(product);
        }

        // Show success notification
        this.showNotification('Product added to cart!', 'success');
    }

    toggleWishlist(productId) {
        const button = document.querySelector(`[data-product-id="${productId}"]`);
        if (button) {
            button.classList.toggle('active');
            
            if (button.classList.contains('active')) {
                this.showNotification('Added to wishlist!', 'success');
            } else {
                this.showNotification('Removed from wishlist!', 'info');
            }
        }

        // Trigger wishlist update (handled by wishlist.js)
        if (window.wishlistManager) {
            window.wishlistManager.toggleItem(productId);
        }
    }

    showQuickView(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('quick-view-modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-images">
                    <img src="${product.mainImage}" alt="${product.title}" class="quick-view-main-image">
                    ${product.images.length > 1 ? `
                        <div class="quick-view-thumbnails">
                            ${product.images.map(img => `
                                <img src="${img}" alt="${product.title}" class="quick-view-thumbnail">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="quick-view-details">
                    <div class="product-category">${product.category.replace('-', ' ')}</div>
                    <h2 class="product-title">${product.title}</h2>
                    <div class="product-price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                        ${product.comparePrice ? `<span class="price-original">$${product.comparePrice.toFixed(2)}</span>` : ''}
                    </div>
                    <p class="product-description">${product.description}</p>
                    ${product.colors.length > 0 ? `
                        <div class="product-options">
                            <h4>Colors:</h4>
                            <div class="color-options">
                                ${product.colors.map(color => `
                                    <button class="color-option" style="background-color: ${this.getColorCode(color)}" title="${color}"></button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${product.sizes.length > 0 ? `
                        <div class="product-options">
                            <h4>Sizes:</h4>
                            <div class="size-options">
                                ${product.sizes.map(size => `
                                    <button class="size-option">${size}</button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="quick-view-actions">
                        <button class="add-to-cart-btn" onclick="productManager.addToCart('${product.id}')">
                            Add to Cart
                        </button>
                        <button class="wishlist-btn" onclick="productManager.toggleWishlist('${product.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');

        // Setup modal close events
        const modalClose = document.getElementById('modal-close');
        const modalOverlay = document.getElementById('modal-overlay');
        
        modalClose.onclick = () => modal.classList.remove('active');
        modalOverlay.onclick = () => modal.classList.remove('active');

        // Setup thumbnail clicks
        document.querySelectorAll('.quick-view-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const mainImage = document.querySelector('.quick-view-main-image');
                mainImage.src = e.target.src;
            });
        });

        // Setup option selections
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        document.querySelectorAll('.size-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.size-option').forEach(o => o.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    viewProduct(productId) {
        // Navigate to individual product page
        window.location.href = `product.html?id=${productId}`;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
}

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: rgba(26, 26, 46, 0.95);
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        color: #ffffff;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        backdrop-filter: blur(10px);
        max-width: 300px;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .notification-message {
        flex: 1;
        font-weight: 500;
    }

    .notification-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    .notification-close:hover {
        color: #ffffff;
    }

    .notification-success {
        border-color: rgba(34, 197, 94, 0.5);
        background: rgba(34, 197, 94, 0.1);
    }

    .notification-error {
        border-color: rgba(239, 68, 68, 0.5);
        background: rgba(239, 68, 68, 0.1);
    }

    .notification-info {
        border-color: rgba(59, 130, 246, 0.5);
        background: rgba(59, 130, 246, 0.1);
    }

    @media (max-width: 768px) {
        .notification {
            right: 10px;
            left: 10px;
            max-width: none;
            transform: translateY(-100px);
        }

        .notification.show {
            transform: translateY(0);
        }
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);