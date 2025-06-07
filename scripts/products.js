// Products Management System - No Fallbacks
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
            
            // API calls will only work when deployed, not locally
            console.log('⚠️ IMPORTANT: Shopify API only works when deployed to Netlify, not during local development');
            console.log('⚠️ Please deploy to Netlify to test with real products - mock data is no longer supported');
            
            // Do not use mock products - clear products instead
            this.products = [];
            this.filteredProducts = [];
            
            // Show error notification
            this.showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
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
                },
                // Add a timeout to prevent hanging if the server is slow
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!response.ok) {
                console.log('❌ Netlify function failed, status:', response.status);
                throw new Error(`Netlify function failed with status: ${response.status}`);
            }

            const data = await response.json();
            
            // Check if we received valid data in new or old format
            let products = [];
            
            if (data.products && Array.isArray(data.products)) {
                // New API format with products array inside an object
                console.log(`🛍️ Fetched ${data.products.length} products from Shopify via Netlify function (new format)`);
                products = data.products;
            } else if (Array.isArray(data)) {
                // Old API format with direct array
                console.log(`🛍️ Fetched ${data.length} products from Shopify via Netlify function (legacy format)`);
                products = data;
            } else {
                console.error('❌ Received invalid product data from API:', data);
                throw new Error('Invalid product data format received');
            }
            
            if (products.length > 0) {
                // Convert Shopify products to our format
                return this.convertShopifyProducts(products);
            } else {
                console.error('❌ No products found in API response');
                throw new Error('No products found in API response');
            }
            
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
            
            // Extract images from Shopify - this will be our only image source
            const shopifyImages = product.images.edges.map(imgEdge => imgEdge.node.url);
            
            // Create a map to track which images are associated with which variants
            const variantImageMap = new Map();
            
            // Use images directly from Shopify API only
            let images = shopifyImages;
            
            // Extract variants and organize by color/size
            const variants = [];
            const colors = new Set();
            const sizes = new Set();
            
            // Maps to associate images with colors
            const colorToImagesMap = new Map();
            
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
                
                // If variant has an image, associate it with the color
                if (variant.image && variant.image.url) {
                    if (!colorToImagesMap.has(color)) {
                        colorToImagesMap.set(color, []);
                    }
                    colorToImagesMap.get(color).push(variant.image.url);
                }
                
                variants.push({
                    id: variant.id,
                    color: color,
                    size: size,
                    price: parseFloat(variant.price.amount),
                    comparePrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                    availableForSale: variant.availableForSale,
                    image: variant.image ? variant.image.url : (images[0] || '')
                });
            });
            
            // Assign images to colors if we don't have explicit associations
            if (colorToImagesMap.size === 0 && colors.size > 0) {
                // If we don't have color-specific images, just assign all images to all colors
                colors.forEach(color => {
                    colorToImagesMap.set(color, [...images]);
                });
            }
            
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
                images: images,
                mainImage: images[0] || '',
                variants: variants,
                colors: Array.from(colors),
                sizes: Array.from(sizes),
                featured: product.tags.includes('featured'),
                new: product.tags.includes('new'),
                sale: comparePrice > minPrice,
                tags: product.tags,
                productType: product.productType,
                // Add the color to images mapping for easy filtering
                colorImages: Object.fromEntries(colorToImagesMap)
            };
            
            uniqueProductsMap.set(product.handle, convertedProduct);
        });
        
        return Array.from(uniqueProductsMap.values());
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
                ${product.mainImage ? 
                  `<img src="${product.mainImage}" alt="${product.title}" class="search-result-image" onerror="this.style.display='none';">` : 
                  `<div class="search-result-no-image">${product.title.charAt(0)}</div>`}
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
                // Show generic no products message regardless of environment
                productsGrid.innerHTML = `
                    <div class="no-products">
                        <h3>No products found</h3>
                        <p>Try adjusting your filters or search terms</p>
                        <p class="small-text">This app requires deployment to Netlify to load products.</p>
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
        
        // Store color-specific data for JavaScript handling
        const colorImagesJSON = product.colorImages ? JSON.stringify(product.colorImages) : '{}';
        
        // Create HTML for variant options with data attributes for main page color switching
        const variantOptionsHTML = product.colors.length > 0
            ? product.colors.slice(0, 4).map((color, index) => {
                // Get the first image for this color
                const colorImage = product.colorImages && product.colorImages[color] && product.colorImages[color].length > 0
                    ? product.colorImages[color][0]
                    : product.mainImage;
                
                // Set the first color as active by default
                const isActive = index === 0 ? 'active' : '';
                
                return `<div class="variant-option ${isActive}"
                           data-color="${color}"
                           data-color-image="${colorImage}"
                           style="background-color: ${this.getColorCode(color)}"
                           title="${color}"></div>`;
            }).join('')
            : '';
        
        return `
            <div class="product-card" data-product-id="${product.id}" data-color-images='${colorImagesJSON}'>
                <div class="product-image-container">
                    ${product.mainImage ? 
                      `<img src="${product.mainImage}" alt="${product.title}" class="product-image" onerror="this.style.display='none'; this.parentElement.querySelector('.product-no-image').style.display='flex';">
                       <div class="product-no-image" style="display:none; width:100%; height:100%; align-items:center; justify-content:center; background:rgba(60,60,80,0.1); color:#555;">
                         <div>${product.title.charAt(0)}</div>
                       </div>` :
                      `<div class="product-no-image" style="display:flex; width:100%; height:100%; align-items:center; justify-content:center; background:rgba(60,60,80,0.1); color:#555;">
                         <div>${product.title.charAt(0)}</div>
                       </div>`
                    }
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
                            ${variantOptionsHTML}
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

        // Color variant options for product cards
        document.querySelectorAll('.variant-option').forEach(option => {
            // Change product image on hover
            option.addEventListener('mouseenter', (e) => {
                const colorOption = e.target;
                const productCard = colorOption.closest('.product-card');
                const productImage = productCard.querySelector('.product-image');
                const colorImage = colorOption.dataset.colorImage;
                
                // Store original image to restore on mouseleave
                if (!productImage.dataset.originalSrc) {
                    productImage.dataset.originalSrc = productImage.src;
                }
                
                // Change to color-specific image
                if (colorImage) {
                    productImage.src = colorImage;
                }
            });
            
            // Restore original image on mouse leave
            option.addEventListener('mouseleave', (e) => {
                const productCard = e.target.closest('.product-card');
                const productImage = productCard.querySelector('.product-image');
                
                // Only restore if not the active color
                if (!e.target.classList.contains('active') && productImage.dataset.originalSrc) {
                    productImage.src = productImage.dataset.originalSrc;
                }
            });
            
            // Set active color on click
            option.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                
                const colorOption = e.target;
                const productCard = colorOption.closest('.product-card');
                const productImage = productCard.querySelector('.product-image');
                const colorImage = colorOption.dataset.colorImage;
                
                // Remove active class from all options in this card
                productCard.querySelectorAll('.variant-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                
                // Add active class to clicked option
                colorOption.classList.add('active');
                
                // Update main image and save as new original
                if (colorImage) {
                    productImage.src = colorImage;
                    productImage.dataset.originalSrc = colorImage;
                }
            });
        });

        // Product card clicks
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('.variant-option')) {
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
        console.log(`Adding product to cart: ${productId}`);
        
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            console.error(`Product with ID ${productId} not found`);
            return;
        }

        // Show size selection modal before adding to cart
        this.showSizeSelectionModal(product);
    }
    
    // Method to show size selection modal
    showSizeSelectionModal(product) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'size-selection-modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'size-selection-modal';
        
        // Get color options for the product
        const colorOptionsHTML = product.colors && product.colors.length > 0
            ? product.colors.map(color => `
                <button class="color-option" data-color="${color}" style="background-color: ${this.getColorCode(color)}" title="${color}">
                    <span class="color-name">${color}</span>
                </button>
            `).join('')
            : '<div class="no-options">No color options available</div>';
        
        // Get size options - find available sizes from product variants
        const sizeOptionsHTML = product.sizes && product.sizes.length > 0
            ? product.sizes.map(size => `
                <button class="size-option" data-size="${size}">${size}</button>
            `).join('')
            : '<div class="no-options">No size options available</div>';
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>Select Options</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="product-preview">
                    <img src="${product.mainImage}" alt="${product.title}">
                    <div class="product-info">
                        <h4>${product.title}</h4>
                        <div class="product-price">$${product.price.toFixed(2)}</div>
                    </div>
                </div>
                
                ${product.colors && product.colors.length > 0 ? `
                    <div class="option-group">
                        <label>Color:</label>
                        <div class="color-options">
                           ${colorOptionsHTML}
                       </div>
                    </div>
                ` : ''}
                
                <div class="option-group">
                    <label>Size: <span class="required">*</span></label>
                    <div class="size-options">
                        ${sizeOptionsHTML}
                    </div>
                    <div class="size-error" style="display: none; color: red; margin-top: 5px;">
                        Please select a size before adding to cart
                    </div>
                </div>
                
                <button class="confirm-add-to-cart" disabled>Add to Cart</button>
            </div>
        `;
        
        // Append modal to body
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Add CSS styles for the modal
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .size-selection-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .size-selection-modal {
                width: 400px;
                max-width: 90vw;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                animation: modalFadeIn 0.3s ease;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #eee;
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: 18px;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #555;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .product-preview {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            
            .product-preview img {
                width: 80px;
                height: 80px;
                object-fit: cover;
                border-radius: 4px;
                margin-right: 15px;
            }
            
            .product-info h4 {
                margin: 0 0 5px 0;
                font-size: 16px;
            }
            
            .option-group {
                margin-bottom: 20px;
            }
            
            .option-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
            }
            
            .color-options, .size-options {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .color-option {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 2px solid #ddd;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }
            
            .color-option.active {
                border-color: #a855f7;
                transform: scale(1.1);
            }
            
            .color-option .color-name {
                position: absolute;
                width: 1px;
                height: 1px;
                clip: rect(0 0 0 0);
                clip-path: inset(50%);
                overflow: hidden;
            }
            
            .size-option {
                min-width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: #f8f8f8;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .size-option:hover {
                background: #f0f0f0;
            }
            
            .size-option.active {
                border-color: #a855f7;
                background: rgba(168, 85, 247, 0.1);
                color: #a855f7;
            }
            
            .confirm-add-to-cart {
                width: 100%;
                padding: 12px;
                background: linear-gradient(45deg, #a855f7, #3b82f6);
                border: none;
                border-radius: 4px;
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 10px;
            }
            
            .confirm-add-to-cart:disabled {
                background: #ccc;
                cursor: not-allowed;
                opacity: 0.7;
            }
            
            .confirm-add-to-cart:not(:disabled):hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(168, 85, 247, 0.4);
            }
            
            .required {
                color: red;
            }
            
            @keyframes modalFadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(styleEl);
        
        // Set up event listeners
        const closeBtn = modalOverlay.querySelector('.close-modal');
        const colorOptionElements = modalOverlay.querySelectorAll('.color-option');
        const sizeOptionElements = modalOverlay.querySelectorAll('.size-option');
        const confirmBtn = modalOverlay.querySelector('.confirm-add-to-cart');
        const sizeError = modalOverlay.querySelector('.size-error');
        
        // Selected options
        let selectedColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;
        let selectedSize = null;
        
        // Preselect first color if available
        if (selectedColor && colorOptionElements.length > 0) {
            colorOptionElements[0].classList.add('active');
        }
        
        // Close modal
        closeBtn.addEventListener('click', () => {
            modalOverlay.remove();
            styleEl.remove();
        });
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                styleEl.remove();
            }
        });
        
        // Color selection
        colorOptionElements.forEach(option => {
            option.addEventListener('click', () => {
                colorOptionElements.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                selectedColor = option.dataset.color;
            });
        });
        
        // Size selection
        sizeOptionElements.forEach(option => {
            option.addEventListener('click', () => {
                sizeOptionElements.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                selectedSize = option.dataset.size;
                
                // Enable add to cart button if size is selected
                confirmBtn.disabled = !selectedSize;
                
                // Hide error message
                sizeError.style.display = 'none';
            });
        });
        
        // Add to cart confirmation
        confirmBtn.addEventListener('click', () => {
            if (!selectedSize) {
                sizeError.style.display = 'block';
                return;
            }
            
            // Prepare product with selected options
            const cartProduct = {
                ...product,
                id: product.id || 'unknown-product',
                title: product.title || 'Product',
                price: product.price || 0,
                mainImage: product.mainImage || '',
                selectedColor: selectedColor,
                selectedSize: selectedSize,
                quantity: 1
            };
            
            // Animation for confirmation
            confirmBtn.textContent = 'Adding...';
            confirmBtn.disabled = true;
            
            try {
                // Add to cart with specific color and size
                // Try to use any available cart system, in order of preference
                let cartAdded = false;
                
                // Try BobbyCart (consolidated cart)
                if (window.BobbyCart) {
                    window.BobbyCart.addToCart(cartProduct);
                    console.log('Item added to cart with BobbyCart');
                    cartAdded = true;
                    
                    // Force cart to open
                    setTimeout(() => {
                        window.BobbyCart.openCart();
                    }, 300);
                }
                // Try BobbyCarts (older system)
                else if (window.BobbyCarts) {
                    window.BobbyCarts.addToCart(cartProduct);
                    console.log('Item added to cart with BobbyCarts');
                    cartAdded = true;
                    
                    // Force cart to open
                    setTimeout(() => {
                        window.BobbyCarts.openCart();
                    }, 300);
                }
                // Try cartManager (legacy system)
                else if (window.cartManager) {
                    window.cartManager.addItem(cartProduct);
                    console.log('Item added to cart with cartManager');
                    cartAdded = true;
                    
                    // Force cart to open
                    setTimeout(() => {
                        window.cartManager.openCart();
                    }, 300);
                }
                // Try to initialize CartManager as last resort
                else if (typeof CartManager !== 'undefined') {
                    console.log('Cart system not found, initializing CartManager...');
                    window.cartManager = new CartManager();
                    
                    setTimeout(() => {
                        try {
                            window.cartManager.addItem(cartProduct);
                            window.cartManager.openCart();
                            console.log('Item added to cart with new CartManager');
                            cartAdded = true;
                        } catch (e) {
                            console.error('Error adding to cart with new CartManager:', e);
                            this.showNotification('Error adding to cart. This app requires deployment to Netlify.', 'error');
                        }
                    }, 100);
                }
                
                if (cartAdded) {
                    // Show success notification
                    this.showNotification('Product added to cart!', 'success');
                    
                    // Remove modal after adding
                    setTimeout(() => {
                        modalOverlay.remove();
                        styleEl.remove();
                    }, 500);
                } else {
                    // No cart system available
                    this.showNotification('Cart system is not available. This app requires deployment to Netlify.', 'error');
                    console.warn('No cart system available');
                    
                    // Remove modal after error
                    setTimeout(() => {
                        modalOverlay.remove();
                        styleEl.remove();
                    }, 1000);
                }
            } catch (error) {
                console.error('Error adding product to cart:', error);
                this.showNotification('Error adding to cart. This app requires deployment to Netlify.', 'error');
                
                // Remove modal after error
                setTimeout(() => {
                    modalOverlay.remove();
                    styleEl.remove();
                }, 1000);
            }
        });
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
        // Use the new QuickViewManager to handle quick view functionality
        if (window.quickViewManager) {
            window.quickViewManager.openQuickView(productId);
        } else {
            console.error('Quick View Manager not initialized');
            this.showNotification('Quick View is not available at the moment', 'error');
        }
    }

    viewProduct(productId) {
        // Get the selected color from the product card if available
        let selectedColor = '';
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        
        if (productCard) {
            const activeColorOption = productCard.querySelector('.variant-option.active');
            if (activeColorOption) {
                selectedColor = activeColorOption.dataset.color;
            }
        }
        
        // Navigate to individual product page with product ID and selected color
        if (selectedColor) {
            window.location.href = `product.html?id=${productId}&color=${encodeURIComponent(selectedColor)}`;
        } else {
            window.location.href = `product.html?id=${productId}`;
        }
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