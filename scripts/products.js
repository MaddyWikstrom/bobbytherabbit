// Products Management System - Fixed Version
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
            // Try to load from Shopify API via Netlify function first
            console.log('🛍️ Loading products from Shopify API...');
            const shopifyProducts = await this.loadShopifyProducts();
            
            if (shopifyProducts && shopifyProducts.length > 0) {
                // Deduplicate products by handle
                const uniqueProducts = new Map();
                shopifyProducts.forEach(product => {
                    if (!uniqueProducts.has(product.id)) {
                        uniqueProducts.set(product.id, product);
                    }
                });
                
                this.products = Array.from(uniqueProducts.values());
                console.log(`✅ Successfully loaded ${this.products.length} unique products from Shopify API!`);
                this.filteredProducts = [...this.products];
                return;
            }
            
            // Fallback: Try to parse CSV data
            console.log('📄 API failed, loading products from CSV data...');
            const csvData = await this.loadCSVData();
            const csvProducts = this.parseCSVToProducts(csvData);
            
            if (csvProducts.length > 0) {
                // Deduplicate CSV products by handle
                const uniqueProducts = new Map();
                csvProducts.forEach(product => {
                    if (!uniqueProducts.has(product.id)) {
                        uniqueProducts.set(product.id, product);
                    }
                });
                
                this.products = Array.from(uniqueProducts.values());
                console.log(`✅ Successfully loaded ${this.products.length} unique products from CSV`);
                this.filteredProducts = [...this.products];
                return;
            }
            // No products found from API or CSV, use mock products for local testing
            console.log('⚠️ No products found from API or CSV, using mock products for local testing');
            this.products = this.getMockProducts();
            this.filteredProducts = [...this.products];
            console.log(`✅ Loaded ${this.products.length} mock products for testing`);
            
            
        } catch (error) {
            console.error('❌ Error loading products:', error);
            console.log('❌ No products loaded due to error');
            this.products = [];
            this.filteredProducts = [];
        }
    }

    async loadShopifyProducts() {
        try {
            console.log('🛍️ Fetching products via Netlify function to bypass CORS...');
            
            // Use Netlify function to bypass CORS restrictions
            const response = await fetch('/.netlify/functions/get-products', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.log('❌ Netlify function failed, status:', response.status);
                throw new Error(`Netlify function failed with status: ${response.status}`);
            }

            const shopifyProducts = await response.json();
            console.log(`🛍️ Fetched ${shopifyProducts.length} products from Shopify via Netlify function`);
            
            // Convert Shopify products to our format
            return this.convertShopifyProducts(shopifyProducts);
            
        } catch (error) {
            console.error('❌ Error loading Shopify products via Netlify function:', error);
            return null;
        }
    }

    convertShopifyProducts(shopifyProducts) {
        // Create a map to track unique products by handle
        const uniqueProductsMap = new Map();
        
        shopifyProducts.forEach(edge => {
            const product = edge.node;
            
            // Skip if we already have this product
            if (uniqueProductsMap.has(product.handle)) {
                return;
            }
            
            // Extract images from Shopify
            const shopifyImages = product.images.edges.map(imgEdge => imgEdge.node.url);
            
            // Get local mockup images
            const localImages = this.getLocalMockupImages(product.handle, product.title);
            
            // Combine both image sources - local mockups first, then Shopify images
            const images = [...localImages, ...shopifyImages].filter(img => img); // Filter out empty strings
            
            // Extract variants and organize by color/size
            const variants = [];
            const colors = new Set();
            const sizes = new Set();
            
            product.variants.edges.forEach(variantEdge => {
                const variant = variantEdge.node;
                
                let color = '';
                let size = '';
                
                variant.selectedOptions.forEach(option => {
                    if (option.name.toLowerCase() === 'color') {
                        color = option.value;
                        colors.add(color);
                    } else if (option.name.toLowerCase() === 'size') {
                        size = option.value;
                        sizes.add(size);
                    }
                });
                
                variants.push({
                    id: variant.id,
                    color: color,
                    size: size,
                    price: parseFloat(variant.price.amount),
                    comparePrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                    availableForSale: variant.availableForSale,
                    image: images[0] || ''
                });
            });
            
            // Determine category from product type or title
            const category = this.extractCategory(product.title);
            
            // Calculate pricing
            const minPrice = parseFloat(product.priceRange.minVariantPrice.amount);
            const maxPrice = parseFloat(product.priceRange.maxVariantPrice.amount);
            const comparePrice = variants.find(v => v.comparePrice)?.comparePrice || null;
            
            const convertedProduct = {
                id: product.handle,
                shopifyId: product.id,
                title: product.title,
                description: this.cleanDescription(product.description),
                category: category,
                price: minPrice,
                comparePrice: comparePrice,
                images: images.length > 0 ? images : ['assets/placeholder.png'], // Fallback to placeholder
                mainImage: images[0] || 'assets/placeholder.png',
                variants: variants,
                colors: Array.from(colors),
                sizes: Array.from(sizes),
                featured: product.tags.includes('featured'),
                new: product.tags.includes('new'),
                sale: comparePrice > minPrice,
                tags: product.tags,
                productType: product.productType
            };
            
            uniqueProductsMap.set(product.handle, convertedProduct);
        });
        
        return Array.from(uniqueProductsMap.values());
    }

    async loadCSVData() {
        try {
            // First try to fetch the CSV file (works when deployed)
            const response = await fetch('products_export_1.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return csvText;
        } catch (error) {
            console.error('Error loading CSV:', error);
            // Return empty string for now
            return '';
        }
    }

    parseCSVToProducts(csvText) {
        if (!csvText || csvText.trim() === '') {
            console.log('CSV data is empty');
            return [];
        }

        const lines = csvText.split('\n');
        if (lines.length < 2) {
            console.log('CSV has insufficient data');
            return [];
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
                // Get local mockup images
                const localImages = this.getLocalMockupImages(handle, title);
                
                // Combine local mockups with CSV image URL
                const images = [...localImages];
                if (imageUrl && !images.includes(imageUrl)) {
                    images.push(imageUrl);
                }
                
                products.set(handle, {
                    id: handle,
                    title: title,
                    description: this.cleanDescription(description),
                    category: this.extractCategory(title),
                    price: price,
                    comparePrice: comparePrice > price ? comparePrice : null,
                    images: images,
                    variants: [],
                    colors: new Set(),
                    sizes: new Set(),
                    featured: title.toLowerCase().includes('featured'),
                    new: title.toLowerCase().includes('new'),
                    sale: comparePrice > price
                });
            }

            const product = products.get(handle);
            if (color) product.colors.add(color);
            if (size) product.sizes.add(size);
            
            // Add image URL if not already included
            if (imageUrl && !product.images.includes(imageUrl)) {
                product.images.push(imageUrl);
            }

            product.variants.push({
                color: color,
                size: size,
                price: price,
                comparePrice: comparePrice > price ? comparePrice : null,
                image: imageUrl || ''
            });
        }

        return Array.from(products.values()).map(product => ({
            ...product,
            colors: Array.from(product.colors),
            sizes: Array.from(product.sizes),
            mainImage: product.images[0] || ''
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

    getLocalMockupImages(productHandle, productTitle) {
        // Map product handles to their local mockup images - simplified to show key images
        const mockupMappings = {
            'bungi-x-bobby-rabbit-hardware-unisex-hoodie': [
                'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d2cb7.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023cc9cc.png'
            ],
            'bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie': [
                'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddcabb2.png'
            ],
            'bungi-x-bobby-dark-mode-wide-leg-joggers': [
                'mockups/all-over-print-unisex-wide-leg-joggers-white-back-68421e1085cf8.png',
                'mockups/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085cf9.png'
            ],
            'wide-leg-joggers': [
                'mockups/all-over-print-unisex-wide-leg-joggers-white-back-68421e1085d00.png',
                'mockups/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085d01.png'
            ],
            'bungi-x-bobby-lightmode-rabbit-hardware-mens-t-shirt': [
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png',
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-back-683f9c9fdd370.png'
            ],
            'bungi-x-bobby-rabbit-hardware-mens-t-shirt': [
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c6a74d70.png'
            ],
            'bungi-x-bobby-rabbit-hardware-unisex-sweatshirt': [
                'mockups/all-over-print-recycled-unisex-sweatshirt-white-front-683f9be9c4dea.png'
            ],
            'bungi-x-bobby-rabbit-hardware-womens-t-shirt': [
                'mockups/all-over-print-womens-crew-neck-t-shirt-white-front-683f9bbadb79f.png'
            ],
            'bungi-x-bobby-rabbit-darkmode-embroidered-unisex-organic-oversized-sweatshirt': [
                'mockups/unisex-organic-oversized-sweatshirt-black-back-683f9b628540b.png',
                'mockups/unisex-organic-oversized-sweatshirt-black-front-683f9b6285f66.png'
            ],
            'bungi-x-bobby-rabbit-hardware-unisex-organic-oversized-sweatshirt': [
                'mockups/unisex-organic-oversized-sweatshirt-black-back-683f9b0bd823b.png',
                'mockups/unisex-organic-oversized-sweatshirt-black-front-683f9b0bd9027.png'
            ],
            'bungi-x-bobby-cuffed-beanie-1': [
                'mockups/cuffed-beanie-black-front-683f9a789ba58.png',
                'mockups/cuffed-beanie-white-front-683f9a789c355.png'
            ],
            'bungi-x-bobby-cowboy-unisex-windbreaker': [
                'mockups/basic-unisex-windbreaker-black-front-683f9890d7838.png'
            ],
            'bungi-x-bobby-cowboy-unisex-sweatshirt': [
                'mockups/all-over-print-recycled-unisex-sweatshirt-white-front-683f985018ab4.png'
            ],
            'bungi-x-bobby-cowboy-mens-t-shirt': [
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f97ee5c7af.png'
            ]
        };

        // Check if we have mockups for this product
        if (mockupMappings[productHandle]) {
            return mockupMappings[productHandle];
        }

        // Try to find mockups based on product title keywords
        const titleLower = productTitle.toLowerCase();
        for (const [handle, images] of Object.entries(mockupMappings)) {
            if (titleLower.includes(handle.replace(/-/g, ' '))) {
                return images;
            }
        }

        return [];
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
        const fallbackImages = [
            'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
            'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f8c07d8c5c.png',
            'mockups/all-over-print-unisex-wide-leg-joggers-white-front-683f8d3f2c662.png',
            'assets/featured-hoodie.svg'
        ];
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.mainImage}" alt="${product.title}" class="product-image"
                         onerror="this.onerror=null;
                                  for(let i=0; i<${JSON.stringify(fallbackImages)}.length; i++) {
                                    try {
                                      this.src=${JSON.stringify(fallbackImages)}[i];
                                      break;
                                    } catch(e) {
                                      continue;
                                    }
                                  }
                                  console.log('Image fallback used for ${product.id}');">
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
                const productCard = e.target.closest('.product-card');
                const productId = productCard ? productCard.dataset.productId : e.target.dataset.productId;
                
                if (productId) {
                    this.addToCart(productId);
                } else {
                    console.error('Product ID not found for add to cart button', e.target);
                }
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
        if (!product) {
            console.error(`Product with ID ${productId} not found`);
            return;
        }

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
            console.log(`Adding product to cart:`, product);
            window.cartManager.addItem(product);
        } else {
            console.error('Cart manager not initialized');
            // Try to initialize cart manager if it doesn't exist
            if (typeof CartManager !== 'undefined') {
                console.log('Initializing cart manager');
                window.cartManager = new CartManager();
                window.cartManager.addItem(product);
            }
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
        
        const fallbackImages = [
            'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
            'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f8c07d8c5c.png',
            'mockups/all-over-print-unisex-wide-leg-joggers-white-front-683f8d3f2c662.png',
            'assets/featured-hoodie.svg'
        ];
        
        modalBody.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-images">
                    <img src="${product.mainImage}" alt="${product.title}" class="quick-view-main-image"
                         onerror="this.onerror=null;
                                  for(let i=0; i<${JSON.stringify(fallbackImages)}.length; i++) {
                                    try {
                                      this.src=${JSON.stringify(fallbackImages)}[i];
                                      break;
                                    } catch(e) {
                                      continue;
                                    }
                                  }
                                  console.log('Image fallback used in modal for ${product.id}');">
                    ${product.images.length > 1 ? `
                        <div class="quick-view-thumbnails">
                            ${product.images.map(img => `
                                <img src="${img}" alt="${product.title}" class="quick-view-thumbnail"
                                     onerror="this.onerror=null;
                                              for(let i=0; i<${JSON.stringify(fallbackImages)}.length; i++) {
                                                try {
                                                  this.src=${JSON.stringify(fallbackImages)}[i];
                                                  break;
                                                } catch(e) {
                                                  continue;
                                                }
                                              }
                                              console.log('Thumbnail fallback used for ${product.id}');">
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
    // Mock products for local testing
    getMockProducts() {
        return [
            {
                id: 'mock-hoodie-1',
                shopifyId: 'mock-shop-1',
                title: 'Bungi x Bobby Rabbit Hardware Hoodie',
                description: 'Premium quality hoodie featuring the Bobby Rabbit hardware design.',
                category: 'hoodie',
                price: 59.99,
                comparePrice: 79.99,
                images: [
                    'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                    'mockups/unisex-premium-hoodie-black-left-683f9021d2cb7.png',
                    'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png',
                    'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                    'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png'
                ],
                mainImage: 'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                variants: [
                    {
                        color: 'Black',
                        size: 'M',
                        price: 59.99,
                        comparePrice: 79.99,
                        availableForSale: true,
                        image: 'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png'
                    },
                    {
                        color: 'Charcoal',
                        size: 'L',
                        price: 59.99,
                        comparePrice: 79.99,
                        availableForSale: true,
                        image: 'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png'
                    }
                ],
                colors: ['Black', 'Charcoal', 'Navy', 'White'],
                sizes: ['S', 'M', 'L', 'XL'],
                featured: true,
                new: true,
                sale: true,
                tags: ['featured', 'new']
            },
            {
                id: 'mock-tshirt-1',
                shopifyId: 'mock-shop-2',
                title: 'Bungi x Bobby Tech Animal T-Shirt',
                description: 'Classic t-shirt with the Tech Animal design.',
                category: 't-shirt',
                price: 29.99,
                comparePrice: null,
                images: [
                    'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f8c07d8c5c.png',
                    'mockups/all-over-print-mens-crew-neck-t-shirt-white-back-683f8c07d91c8.png',
                    'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f8f8fdb3bc.png'
                ],
                mainImage: 'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f8c07d8c5c.png',
                variants: [
                    {
                        color: 'White',
                        size: 'M',
                        price: 29.99,
                        comparePrice: null,
                        availableForSale: true,
                        image: 'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f8c07d8c5c.png'
                    }
                ],
                colors: ['White', 'Black'],
                sizes: ['S', 'M', 'L', 'XL'],
                featured: false,
                new: true,
                sale: false,
                tags: ['new']
            },
            {
                id: 'mock-joggers-1',
                shopifyId: 'mock-shop-3',
                title: 'Bungi x Bobby Wide Leg Joggers',
                description: 'Comfortable wide leg joggers with Bobby the Rabbit design.',
                category: 'joggers',
                price: 49.99,
                comparePrice: 69.99,
                images: [
                    'mockups/all-over-print-unisex-wide-leg-joggers-white-front-683f8d3f2c662.png',
                    'mockups/all-over-print-unisex-wide-leg-joggers-white-back-683f8d3f2c76f.png',
                    'mockups/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085adc.png'
                ],
                mainImage: 'mockups/all-over-print-unisex-wide-leg-joggers-white-front-683f8d3f2c662.png',
                variants: [
                    {
                        color: 'Black',
                        size: 'M',
                        price: 49.99,
                        comparePrice: 69.99,
                        availableForSale: true,
                        image: 'mockups/all-over-print-unisex-wide-leg-joggers-white-front-683f8d3f2c662.png'
                    }
                ],
                colors: ['Black', 'Navy'],
                sizes: ['S', 'M', 'L', 'XL'],
                featured: true,
                new: false,
                sale: true,
                tags: ['featured']
            }
        ];
    }
}

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
});