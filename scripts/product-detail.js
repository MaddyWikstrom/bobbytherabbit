// Product Detail Page Manager
class ProductDetailManager {
    constructor() {
        this.currentProduct = null;
        this.selectedVariant = {
            color: null,
            size: null,
            quantity: 1
        };
        this.currentImageIndex = 0;
        this.recentlyViewed = [];
        this.filteredImages = []; // Add array to store color-filtered images
        
        this.init();
    }

    async init() {
        // Setup animation styles first
        this.loadAnimationStyles();
        // Start loading sequence
        this.startLoadingSequence();
        // Load saved data
        this.loadRecentlyViewed();
        // Load product data
        await this.loadProduct();
        // Setup event listeners last, after all data is loaded
        this.setupEventListeners();
    }
    
    // Load animation styles
    loadAnimationStyles() {
        // Check if animation styles are already loaded
        if (!document.querySelector('link[href*="add-to-cart-animations.css"]')) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = '/styles/add-to-cart-animations.css';
            document.head.appendChild(styleLink);
        }
    }

    setupEventListeners() {
        try {
            console.log('Setting up event listeners for product detail page');
            
            // Make main image clickable for navigation
            const mainImage = document.querySelector('.main-image');
            if (mainImage) {
                mainImage.addEventListener('click', () => this.navigateImages(1));
            }
            
            // Make thumbnails clickable
            const galleryItems = document.querySelectorAll('.gallery-item');
            galleryItems.forEach((item, index) => {
                item.addEventListener('click', () => {
                    this.currentImageIndex = index;
                    this.updateMainImage();
                    
                    // Update active state on thumbnails
                    galleryItems.forEach((thumbnail, idx) => {
                        if (idx === index) {
                            thumbnail.classList.add('active');
                            thumbnail.style.border = '2px solid #a855f7';
                        } else {
                            thumbnail.classList.remove('active');
                            thumbnail.style.border = '2px solid transparent';
                        }
                    });
                });
            });
            
            // Color selection - use try/catch to avoid breaking if elements don't exist
            try {
                document.querySelectorAll('.color-option').forEach(colorOption => {
                    colorOption.addEventListener('click', (e) => {
                        const color = e.currentTarget.dataset.color;
                        this.selectColor(color);
                    });
                });
            } catch (error) {
                console.warn('Error setting up color option listeners:', error.message);
            }
            
            // Size selection - use try/catch to avoid breaking if elements don't exist
            try {
                document.querySelectorAll('.size-option').forEach(sizeOption => {
                    sizeOption.addEventListener('click', (e) => {
                        const size = e.currentTarget.dataset.size;
                        this.selectSize(size);
                    });
                });
            } catch (error) {
                console.warn('Error setting up size option listeners:', error.message);
            }
            
            // Quantity controls
            const quantityInput = document.getElementById('quantity');
            const incrementBtn = document.getElementById('increment');
            const decrementBtn = document.getElementById('decrement');
            
            if (quantityInput && incrementBtn && decrementBtn) {
                incrementBtn.addEventListener('click', () => {
                    const newValue = Math.min(parseInt(quantityInput.value) + 1, 10);
                    quantityInput.value = newValue;
                    this.selectedVariant.quantity = newValue;
                });
                
                decrementBtn.addEventListener('click', () => {
                    const newValue = Math.max(parseInt(quantityInput.value) - 1, 1);
                    quantityInput.value = newValue;
                    this.selectedVariant.quantity = newValue;
                });
                
                quantityInput.addEventListener('change', () => {
                    let value = parseInt(quantityInput.value);
                    if (isNaN(value) || value < 1) value = 1;
                    if (value > 10) value = 10;
                    quantityInput.value = value;
                    this.selectedVariant.quantity = value;
                });
            } else {
                console.warn('Quantity controls not found in DOM');
            }
            
            // Add to cart button
            const addToCartBtn = document.getElementById('add-to-cart');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => {
                    this.addToCart();
                });
            } else {
                console.warn('Add to cart button not found in DOM');
            }
            
            console.log('Event listeners setup complete');
        } catch (error) {
            console.error('Error in setupEventListeners:', error);
        }
    }

    startLoadingSequence() {
        // Show loading animation
        const loadingElement = document.querySelector('.product-loading');
        if (loadingElement) {
            loadingElement.classList.add('active');
        }
    }
    
    completeLoadingSequence() {
        try {
            console.log('Completing loading sequence');
            
            // Hide the loading screen
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            
            // Show the main content
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
            }
            
            console.log('Loading sequence completed');
        } catch (error) {
            console.error('Error completing loading sequence:', error);
        }
    }
    
    updateLoadingPercentage(percentage) {
        // Update loading percentage if element exists
        const loadingPercentage = document.getElementById('loading-percentage');
        if (loadingPercentage) {
            loadingPercentage.textContent = `${percentage}%`;
        }
        
        // Update progress bar if it exists
        const loadingProgress = document.getElementById('loading-progress');
        if (loadingProgress) {
            loadingProgress.style.width = `${percentage}%`;
        }
    }
    
    loadRecentlyViewed() {
        try {
            const recentlyViewed = localStorage.getItem('recentlyViewed');
            if (recentlyViewed) {
                this.recentlyViewed = JSON.parse(recentlyViewed);
            }
        } catch (error) {
            console.error('Error loading recently viewed products:', error);
        }
    }
    
    addToRecentlyViewed(product) {
        if (!product) return;
        
        // Remove if already exists
        this.recentlyViewed = this.recentlyViewed.filter(p => p.id !== product.id);
        
        // Add to front of array
        this.recentlyViewed.unshift({
            id: product.id,
            title: product.title,
            image: product.mainImage,
            price: product.price
        });
        
        // Limit to 4 items
        this.recentlyViewed = this.recentlyViewed.slice(0, 4);
        
        // Save to localStorage
        try {
            localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
        } catch (error) {
            console.error('Error saving recently viewed products:', error);
        }
    }
    
    loadRelatedProducts() {
        // Render recently viewed products
        const container = document.getElementById('related-products-grid');
        if (!container) {
            console.warn('Related products container not found');
            return;
        }
        
        if (this.recentlyViewed.length > 0) {
            const html = this.recentlyViewed.map(product => `
                <div class="related-product" data-product-id="${product.id}">
                    <img src="${product.image}" alt="${product.title}">
                    <div class="related-product-info">
                        <h4>${product.title}</h4>
                        <span>$${product.price.toFixed(2)}</span>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = html;
            
            // Add event listeners
            document.querySelectorAll('.related-product').forEach(el => {
                el.addEventListener('click', (e) => {
                    const productId = e.currentTarget.dataset.productId;
                    window.location.href = `product.html?id=${productId}`;
                });
            });
        } else {
            container.innerHTML = '<p>No related products found</p>';
        }
    }
    
    async loadShopifyProduct(productId) {
        try {
            if (!productId) {
                throw new Error('Product ID is required');
            }
            
            console.log(`Loading product with ID: ${productId}`);
            
            // Add a timestamp to prevent caching issues
            const timestamp = new Date().getTime();
            const url = `/.netlify/functions/get-product-by-handle?handle=${encodeURIComponent(productId)}&_=${timestamp}`;
            
            // Log the URL we're trying to fetch for debugging
            console.log(`Fetching from URL: ${url}`);
            
            // Set up a controller for the fetch operation that we can abort
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout (increased from 8)
            
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                // Clear the timeout since fetch completed
                clearTimeout(timeoutId);
                
                console.log(`Response status: ${response.status}, type: ${response.headers.get('content-type')}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`API Error (${response.status}): ${errorText.substring(0, 200)}`);
                    throw new Error(`API response error: ${response.status} - ${errorText.substring(0, 200)}`);
                }
                
                const responseText = await response.text();
                console.log(`Response received, length: ${responseText.length} characters`);
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error(`JSON Parse Error: ${parseError.message}`);
                    console.error(`Response text starts with: ${responseText.substring(0, 100)}`);
                    throw new Error(`Failed to parse API response as JSON: ${parseError.message}`);
                }
                
                if (!data) {
                    console.error(`No data returned from API`);
                    return null;
                }
                
                console.log(`API returned data structure:`, Object.keys(data));
                
                // Determine where the product data is in the response
                let productData = null;
                if (data.product) {
                    console.log(`Found product data in data.product`);
                    productData = data.product;
                } else if (data.id || data.handle) {
                    console.log(`Found direct product data with ID or handle`);
                    productData = data;
                } else if (Array.isArray(data) && data.length > 0) {
                    console.log(`Found product data in array`);
                    productData = data[0];
                }
                
                if (!productData) {
                    console.error(`Could not locate product data in API response:`, data);
                    return null;
                }
                
                console.log(`Product data found with title: ${productData.title || 'Unknown'}`);
                return this.convertShopifyProduct(productData);
                
            } catch (fetchError) {
                // Handle timeout or network errors
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    console.error('API request timed out after 10 seconds');
                    throw new Error('API request timed out');
                }
                console.error(`Fetch error: ${fetchError.message}`);
                throw fetchError;
            }
        } catch (error) {
            console.error('Error loading product from Shopify:', error.message);
            return null;
        }
    }
    
    convertShopifyProduct(product) {
        if (!product) {
            console.error('Cannot convert null/undefined product');
            return null;
        }
        
        try {
            // Create a more flexible conversion that handles different API response formats
            
            // Handle missing images
            let images = [];
            if (product.images) {
                if (product.images.edges) {
                    // GraphQL API format
                    images = product.images.edges.map(imgEdge => imgEdge.node.url);
                } else if (Array.isArray(product.images)) {
                    // REST API format
                    images = product.images.map(img => img.src || img.url || img);
                } else if (typeof product.images === 'string') {
                    // Simple string format
                    images = [product.images];
                }
            }
            
            if (images.length === 0) {
                images = ['/assets/product-placeholder.png'];
            }
            
            // Handle missing variants
            let variants = [];
            let colors = new Set();
            let sizes = new Set();
            const colorToImagesMap = new Map();
            
            if (product.variants) {
                // Try to extract variants in different formats
                let variantsArray = [];
                
                if (product.variants.edges) {
                    // GraphQL API format
                    variantsArray = product.variants.edges.map(edge => edge.node);
                } else if (Array.isArray(product.variants)) {
                    // REST API format
                    variantsArray = product.variants;
                } else {
                    // Variant format unrecognized, continue with empty array
                }
                
                // Process variants
                variantsArray.forEach(variant => {
                    let color = '';
                    let size = '';
                    
                    // Extract color and size from variant
                    if (variant.selectedOptions) {
                        // GraphQL API format
                        variant.selectedOptions.forEach(option => {
                            if (option.name.toLowerCase() === 'color') {
                                color = option.value;
                                colors.add(color);
                            } else if (option.name.toLowerCase() === 'size') {
                                size = option.value;
                                sizes.add(size);
                            }
                        });
                    } else if (variant.option1 || variant.option2) {
                        // REST API format - guess which option is color/size
                        if (variant.option1 && variant.option1.match(/black|white|blue|red|green|yellow|purple|orange|pink|gray|grey|navy|maroon|charcoal/i)) {
                            color = variant.option1;
                            colors.add(color);
                            size = variant.option2 || '';
                            if (size) sizes.add(size);
                        } else {
                            size = variant.option1 || '';
                            if (size) sizes.add(size);
                            color = variant.option2 || '';
                            if (color) colors.add(color);
                        }
                    }
                    
                    // Handle variant images
                    if (variant.image) {
                        const imageUrl = variant.image.url || variant.image.src || variant.image;
                        if (imageUrl && color) {
                            if (!colorToImagesMap.has(color)) {
                                colorToImagesMap.set(color, []);
                            }
                            colorToImagesMap.get(color).push(imageUrl);
                        }
                    }
                    
                    // Build variant object
                    variants.push({
                        id: variant.id,
                        color: color,
                        size: size,
                        price: parseFloat(variant.price?.amount || variant.price || 0),
                        comparePrice: variant.compareAtPrice ?
                            parseFloat(variant.compareAtPrice.amount || variant.compareAtPrice) : null,
                        availableForSale: variant.availableForSale !== false,
                        image: variant.image ?
                            (variant.image.url || variant.image.src || variant.image) : (images[0] || '')
                    });
                });
            } else {
                console.warn('No variants found for product, creating default variant');
                variants.push({
                    id: product.id || 'default',
                    color: '',
                    size: '',
                    price: parseFloat(product.price || 0),
                    comparePrice: null,
                    availableForSale: true,
                    image: images[0] || ''
                });
            }
            
            // Get price from various possible locations
            let price = 0;
            if (product.priceRange?.minVariantPrice?.amount) {
                price = parseFloat(product.priceRange.minVariantPrice.amount);
            } else if (product.price) {
                price = parseFloat(typeof product.price === 'object' ? product.price.amount : product.price);
            } else if (variants.length > 0) {
                price = variants[0].price;
            }
            
            // Get compare price
            let comparePrice = null;
            if (product.compareAtPriceRange?.maxVariantPrice?.amount) {
                comparePrice = parseFloat(product.compareAtPriceRange.maxVariantPrice.amount);
            } else if (product.compareAtPrice) {
                comparePrice = parseFloat(typeof product.compareAtPrice === 'object' ?
                    product.compareAtPrice.amount : product.compareAtPrice);
            }
            
            // Prepare and return final converted product
            const handle = product.handle ||
                (typeof product.id === 'string' ? product.id.split('/').pop() : 'unknown-product');
            
            // Convert colors from strings to objects with name and code properties
            // This ensures compatibility with quick-view.js which expects this format
            let colorObjects = [];
            
            // If no colors were detected from variants, try to extract them from tags
            if (colors.size === 0 && product.tags && Array.isArray(product.tags)) {
                // Look for color tags (common format is "color:Black" or just color names)
                product.tags.forEach(tag => {
                    if (tag.toLowerCase().startsWith('color:')) {
                        // Extract color name from tag
                        const colorName = tag.substring(6).trim();
                        colors.add(colorName);
                    } else if (this.isCommonColor(tag)) {
                        // If tag itself is a color name
                        colors.add(tag);
                    }
                });
            }
            
            // If still no colors, add a default one based on the product title
            if (colors.size === 0 && product.title) {
                // Extract color from title if present
                const colorWords = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'purple',
                                   'orange', 'pink', 'gray', 'grey', 'navy', 'maroon', 'brown'];
                
                const title = product.title.toLowerCase();
                for (const color of colorWords) {
                    if (title.includes(color)) {
                        colors.add(color.charAt(0).toUpperCase() + color.slice(1));
                        break;
                    }
                }
                
                // If no color found in title, add a default
                if (colors.size === 0) {
                    colors.add('Default');
                }
            }
            
            // Map colors to objects with name and code properties
            colorObjects = Array.from(colors).map(colorName => {
                return {
                    name: colorName,
                    code: this.getColorCode(colorName)
                };
            });
            
            // Create colorImages object from Map
            const colorImagesObj = {};
            colorToImagesMap.forEach((images, color) => {
                colorImagesObj[color] = images;
            });
            
            return {
                id: handle,
                shopifyId: product.id,
                title: product.title || 'Unknown Product',
                description: product.description || '',
                price: price,
                comparePrice: comparePrice,
                images: images,
                mainImage: images[0] || '/assets/product-placeholder.png',
                variants: variants,
                colors: colorObjects, // Array of {name, code} objects instead of just strings
                sizes: Array.from(sizes),
                colorImages: colorImagesObj,
                inventory: {} // Add inventory object for stock tracking
            };
        } catch (error) {
            console.error('Error converting Shopify product:', error);
            console.error('Problem occurred with product:', product?.title || 'unknown');
            return null;
        }
    }
    
    async loadProduct() {
        try {
            // Hide main content, show loading screen
            const mainContent = document.getElementById('main-content');
            const loadingScreen = document.getElementById('loading-screen');
            
            if (mainContent && loadingScreen) {
                mainContent.style.display = 'none';
                loadingScreen.style.display = 'flex';
            }
            
            // Parse URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');
            
            // Get color safely from URL - just use the raw value, any validation happens later
            const selectedColor = urlParams.get('color');
            
            console.log(`Loading product with ID: ${productId}, selected color: ${selectedColor || 'none'}`);
            
            if (!productId) {
                console.error('No product ID found in URL');
                this.completeLoadingSequence();
                this.showProductNotFound("No product ID specified");
                return;
            }
            
            try {
                // Update loading message
                const loadingMessage = document.getElementById('loading-message');
                if (loadingMessage) {
                    loadingMessage.textContent = 'LOADING PRODUCT';
                }
                
                // Simulate loading progress
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += 5;
                    if (progress > 90) {
                        clearInterval(progressInterval);
                    }
                    this.updateLoadingPercentage(progress);
                }, 200);
                
                // Load product data from Shopify API with timeout to prevent hanging
                const productPromise = this.fetchProductData(productId);
                
                // Create a timeout promise that rejects after 15 seconds (increased from 10)
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Product fetch timed out')), 15000);
                });
                
                // Race the product fetch against the timeout
                this.currentProduct = await Promise.race([productPromise, timeoutPromise]);
                
                // Clear interval and set to 100%
                clearInterval(progressInterval);
                this.updateLoadingPercentage(100);
                
            } catch (fetchError) {
                console.error('Error fetching product:', fetchError);
                this.completeLoadingSequence();
                this.showProductNotFound(fetchError.message);
                return; // Exit early
            }
            
            // If we got here, we have a product
            if (this.currentProduct) {
                console.log(`Successfully loaded product: ${this.currentProduct.title}`);
                
                // Update page title
                document.title = `${this.currentProduct.title} - Bobby Streetwear`;
                
                // Update loading message
                const loadingMessage = document.getElementById('loading-message');
                if (loadingMessage) {
                    loadingMessage.textContent = `RENDERING PRODUCT: ${this.currentProduct.title}`;
                }
                
                // Update breadcrumb
                const breadcrumbCurrent = document.getElementById('breadcrumb-current');
                if (breadcrumbCurrent) {
                    breadcrumbCurrent.textContent = this.currentProduct.title;
                }
                
                // Render the product to the DOM
                await this.renderProduct();
                
                // Always select the first color by default
                if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
                    const firstColor = this.currentProduct.colors[0];
                    const defaultColorName = typeof firstColor === 'object' ? firstColor.name : firstColor;
                    
                    // Try to use the selected color from URL if it exists in product colors
                    if (selectedColor) {
                        let foundMatchingColor = false;
                        
                        // Simple loop to find matching color (more robust than some())
                        for (const color of this.currentProduct.colors) {
                            const colorName = typeof color === 'object' ? color.name : color;
                            
                            // Case insensitive comparison
                            if (colorName.toLowerCase() === selectedColor.toLowerCase()) {
                                console.log(`Setting selected color from URL: ${colorName}`);
                                this.selectColor(colorName);
                                foundMatchingColor = true;
                                break;
                            }
                        }
                        
                        // If no match found, use the default first color
                        if (!foundMatchingColor) {
                            console.log(`Color from URL not found, defaulting to: ${defaultColorName}`);
                            this.selectColor(defaultColorName);
                        }
                    } else {
                        // No color in URL, use first color
                        console.log(`No color selected, defaulting to: ${defaultColorName}`);
                        this.selectColor(defaultColorName);
                    }
                }
                
                this.addToRecentlyViewed(this.currentProduct);
                this.loadRelatedProducts();
                
                // Show main content, hide loading screen
                if (mainContent && loadingScreen) {
                    mainContent.style.display = 'block';
                    loadingScreen.style.display = 'none';
                }
            } else {
                console.error('No product data available to render');
                this.showProductNotFound("Product data couldn't be loaded");
            }
            
            // Always complete the loading sequence
            this.completeLoadingSequence();
        } catch (error) {
            console.error('Critical error in loadProduct:', error);
            this.completeLoadingSequence();
            this.showProductNotFound(error.message);
        }
    }

    async fetchProductData(productId) {
        try {
            if (!productId) {
                throw new Error('Invalid product ID');
            }
            
            // Try to load from Shopify API
            let shopifyProduct = null;
            
            try {
                shopifyProduct = await this.loadShopifyProduct(productId);
            } catch (shopifyError) {
                console.error(`Error loading from Shopify API:`, shopifyError.message);
            }
            
            if (shopifyProduct) {
                return shopifyProduct;
            }
            
            // If we get here, Shopify API failed, try alternate IDs
            // Try some common ID variations
            const alternateIds = [
                productId.replace(/-/g, '_'),                     // Replace hyphens with underscores
                productId.replace(/_/g, '-'),                     // Replace underscores with hyphens
                `bungi-${productId}`,                             // Try with bungi- prefix
                `bobby-${productId}`,                             // Try with bobby- prefix
                productId.toLowerCase(),                          // All lowercase
                productId.toLowerCase().replace(/\s+/g, '-')      // Lowercase with spaces to hyphens
            ];
            
            for (const altId of alternateIds) {
                if (altId === productId) continue; // Skip if same as original
                
                try {
                    const altProduct = await this.loadShopifyProduct(altId);
                    
                    if (altProduct) {
                        return altProduct;
                    }
                } catch (altError) {
                    // Continue to next ID
                }
            }
            
            throw new Error(`Product not found: ${productId}`);
        } catch (error) {
            console.error(`Error fetching product data for ${productId}:`, error.message);
            // Complete loading and don't hang
            this.completeLoadingSequence();
            throw error; // Re-throw to be handled by loadProduct
        }
    }

    renderProduct() {
        if (!this.currentProduct) {
            console.error('No product data available to render');
            this.showProductNotFound();
            return;
        }
        
        try {
            console.log('Rendering product:', this.currentProduct.title);
            
            // Get the product detail grid from the DOM
            const productDetailGrid = document.getElementById('product-detail-grid');
            if (!productDetailGrid) {
                console.error('Product detail grid not found in DOM');
                return;
            }
            
            // Clear existing content
            productDetailGrid.innerHTML = '';
            
            // Create main product container with proper grid layout
            const productHTML = `
                <div class="product-image-section">
                    <div id="main-product-image" class="main-image">
                        <img src="${this.currentProduct.mainImage || '/assets/product-placeholder.png'}"
                             alt="${this.currentProduct.title}">
                    </div>
                    <div id="product-gallery" class="gallery">
                        ${this.currentProduct.images?.map((img, idx) => `
                            <div class="gallery-item ${idx === 0 ? 'active' : ''}"
                                 data-index="${idx}">
                                <img src="${img}" alt="${this.currentProduct.title} ${idx + 1}">
                            </div>
                        `).join('') || ''}
                    </div>
                </div>
                
                <div class="product-info-section">
                    <div class="category-tag">WINDBREAKERS</div>
                    <h1 id="product-title">${this.currentProduct.title}</h1>
                    
                    <div class="ratings-container">
                        <div class="stars">★★★★☆</div>
                        <span class="rating-count">4.6 (180 reviews)</span>
                    </div>
                    
                    <div class="price-container">
                        <span id="product-price" class="price-current">$${this.currentProduct.price.toFixed(2)}</span>
                        ${this.currentProduct.comparePrice && this.currentProduct.comparePrice > this.currentProduct.price ? 
                            `<span id="product-compare-price" class="price-original">$${this.currentProduct.comparePrice.toFixed(2)}</span>
                             <span id="product-discount" class="price-discount">-${Math.round(((this.currentProduct.comparePrice - this.currentProduct.price) / this.currentProduct.comparePrice) * 100)}%</span>` : 
                            ''}
                    </div>
                    
                    <div id="product-description" class="product-description">
                        ${this.currentProduct.description || ''}
                    </div>
                    
                    ${this.currentProduct.colors && this.currentProduct.colors.length > 0 ? `
                        <h3>Colors:</h3>
                        <div id="color-options" class="options-container">
                            ${this.currentProduct.colors.map(color => {
                                // Handle both formats: string or {name, code} object
                                const colorName = typeof color === 'object' ? color.name : color;
                                const colorCode = typeof color === 'object' ? color.code : this.getColorCode(color);
                                
                                return `
                                    <div class="color-option" data-color="${colorName}"
                                        style="color: ${colorCode}"
                                        title="${colorName}">
                                        <span class="color-name">${colorName}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                    
                    ${this.currentProduct.sizes && this.currentProduct.sizes.length > 0 ? `
                        <div class="sizes-header">
                            <h3>Sizes:</h3>
                            <button class="size-guide-toggle">Size Guide</button>
                        </div>
                        <div id="size-options" class="options-container">
                            ${this.currentProduct.sizes.map(size => `
                                <div class="size-option" data-size="${size}">${size}</div>
                            `).join('')}
                        </div>
                    ` : '<div id="size-options"></div>'}
                    
                    <div class="quantity-controls" style="display:flex; align-items:center; margin-top:20px; margin-bottom:20px;">
                        <span style="margin-right:10px;">Quantity: </span>
                        <button id="decrement" class="quantity-btn" style="padding:5px 10px;">-</button>
                        <input type="number" id="quantity" min="1" max="10" value="1" style="width:50px; text-align:center; margin:0 5px;">
                        <button id="increment" class="quantity-btn" style="padding:5px 10px;">+</button>
                    </div>
                    
                    <button id="add-to-cart" class="add-to-cart-btn" style="padding:10px 20px; background-color:#4CAF50; color:white; border:none; cursor:pointer; border-radius:4px; font-size:16px;">
                        Add to Cart
                    </button>
                </div>
            `;
            
            // Add the product HTML to the grid
            productDetailGrid.innerHTML = productHTML;
            
            // Set up event listeners for the newly created elements
            this.setupEventListeners();
            
            // Make sure main content is visible
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
            }
            
            console.log('Product rendered successfully');
            
        } catch (error) {
            console.error('Error rendering product:', error);
            // Don't redirect to not-found in case of render errors, as the product data might be valid
            // Instead, show an error message if possible
            const productDetailGrid = document.getElementById('product-detail-grid');
            if (productDetailGrid) {
                productDetailGrid.innerHTML = `
                    <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 30px; background: rgba(255,0,0,0.1); border-radius: 8px;">
                        <h3>Error Displaying Product</h3>
                        <p>We encountered an error while displaying this product. Please try refreshing the page.</p>
                        <p><small>Error details: ${error.message}</small></p>
                    </div>
                `;
            } else {
                const errorContainer = document.createElement('div');
                errorContainer.className = 'error-message';
                errorContainer.textContent = 'Error displaying product. Please try refreshing the page.';
                document.body.appendChild(errorContainer);
            }
        }
    }
    
    selectColor(color) {
        try {
            if (!color) {
                console.warn('No color provided to selectColor');
                return;
            }
            
            // Store the color name in selectedVariant
            this.selectedVariant.color = color;
            
            // Find matching color-option element and update active class
            let found = false;
            document.querySelectorAll('.color-option').forEach(option => {
                if (option.dataset.color &&
                    option.dataset.color.toLowerCase() === color.toLowerCase()) {
                    option.classList.add('active');
                    found = true;
                } else {
                    option.classList.remove('active');
                }
            });
            
            if (!found) {
                console.log(`No matching color option found in DOM for: ${color}`);
            }
            
            // Try to find color images
            let colorImagesFound = false;
            
            // First check direct match
            if (this.currentProduct.colorImages && this.currentProduct.colorImages[color]) {
                this.filteredImages = this.currentProduct.colorImages[color];
                this.currentImageIndex = 0;
                this.updateMainImage();
                colorImagesFound = true;
            }
            // Then try case-insensitive match
            else if (this.currentProduct.colorImages) {
                // Look for case-insensitive match
                for (const [key, images] of Object.entries(this.currentProduct.colorImages)) {
                    if (key.toLowerCase() === color.toLowerCase()) {
                        this.filteredImages = images;
                        this.currentImageIndex = 0;
                        this.updateMainImage();
                        colorImagesFound = true;
                        break;
                    }
                }
            }
            
            // If no color-specific images found, use all images
            if (!colorImagesFound && this.currentProduct.images && this.currentProduct.images.length > 0) {
                console.log('No color-specific images found, using all images');
                this.filteredImages = this.currentProduct.images;
                this.currentImageIndex = 0;
                this.updateMainImage();
            }
        } catch (error) {
            console.error('Error in selectColor:', error);
            // Fallback to using all images
            if (this.currentProduct && this.currentProduct.images) {
                this.filteredImages = this.currentProduct.images;
                this.currentImageIndex = 0;
                this.updateMainImage();
            }
        }
    }
    
    selectSize(size) {
        this.selectedVariant.size = size;
        
        // Update active class
        document.querySelectorAll('.size-option').forEach(option => {
            if (option.dataset.size === size) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    navigateImages(direction) {
        if (!this.filteredImages || this.filteredImages.length === 0) {
            this.filteredImages = this.currentProduct.images;
            if (!this.filteredImages || this.filteredImages.length === 0) {
                console.warn('No images available for navigation');
                return;
            }
        }
        
        const imageCount = this.filteredImages.length;
        if (imageCount <= 1) {
            return;
        }
        
        // Calculate new index with boundary checking
        const newIndex = (this.currentImageIndex + direction + imageCount) % imageCount;
        this.currentImageIndex = newIndex;
        
        // Update main image
        this.updateMainImage();
        
        // Update active class in gallery
        document.querySelectorAll('.gallery-item').forEach((item, index) => {
            if (index === this.currentImageIndex) {
                item.classList.add('active');
                item.style.border = '2px solid #4CAF50';
            } else {
                item.classList.remove('active');
                item.style.border = '2px solid transparent';
            }
        });
    }
    
    updateMainImage() {
        const mainImageContainer = document.getElementById('main-product-image');
        if (!mainImageContainer) {
            console.error('Main image container not found');
            return;
        }
        
        if (!this.filteredImages || this.filteredImages.length === 0) {
            this.filteredImages = this.currentProduct.images;
            if (!this.filteredImages || this.filteredImages.length === 0) {
                console.warn('No images available');
                return;
            }
        }
        
        // Ensure index is valid
        if (this.currentImageIndex < 0 || this.currentImageIndex >= this.filteredImages.length) {
            console.warn(`Invalid image index: ${this.currentImageIndex}, resetting to 0`);
            this.currentImageIndex = 0;
        }
        
        const image = this.filteredImages[this.currentImageIndex];
        if (!image) {
            console.error('Image not found at index:', this.currentImageIndex);
            return;
        }
        
        mainImageContainer.innerHTML = `<img src="${image}" alt="${this.currentProduct?.title || 'Product'}" style="width:100%; max-height:500px; object-fit:contain;">`;
    }
    
    addToCart() {
        try {
            if (!this.currentProduct) {
                console.error('Cannot add to cart: Product not available');
                this.showNotification('Product not available', 'error');
                return;
            }
            
            if (!this.selectedVariant.size) {
                console.warn('Cannot add to cart: Size not selected');
                this.showNotification('Please select a size', 'error');
                return;
            }
            
            if (!this.selectedVariant.color) {
                console.warn('Cannot add to cart: Color not selected');
                this.showNotification('Please select a color', 'error');
                return;
            }
            
            const cartProduct = {
                ...this.currentProduct,
                selectedColor: this.selectedVariant.color,
                selectedSize: this.selectedVariant.size,
                quantity: this.selectedVariant.quantity || 1
            };
            
            // Try to use any available cart system
            let cartAdded = false;
            
            // Try BobbyCart (consolidated cart)
            if (window.BobbyCart) {
                try {
                    window.BobbyCart.addToCart(cartProduct);
                    cartAdded = true;
                    
                    // Force cart to open
                    setTimeout(() => {
                        window.BobbyCart.openCart();
                    }, 300);
                } catch (error) {
                    console.error('Error adding to BobbyCart:', error);
                }
            }
            // Try other cart systems if needed
            else if (window.cartManager) {
                try {
                    window.cartManager.addItem(cartProduct);
                    cartAdded = true;
                    
                    // Force cart to open
                    setTimeout(() => {
                        window.cartManager.openCart();
                    }, 300);
                } catch (error) {
                    console.error('Error adding to cartManager:', error);
                }
            }
            
            if (cartAdded) {
                this.showNotification('Product added to cart!', 'success');
                
                // Trigger add to cart animation
                this.playAddToCartAnimation();
            } else {
                console.error('No cart system available');
                this.showNotification('Cart system not available', 'error');
            }
        } catch (error) {
            console.error('Critical error in addToCart:', error);
            this.showNotification('Error adding product to cart', 'error');
        }
    }
    
    playAddToCartAnimation() {
        const button = document.getElementById('add-to-cart');
        if (!button) return;
        
        button.classList.add('added');
        setTimeout(() => {
            button.classList.remove('added');
        }, 1500);
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
    
    showProductNotFound(errorDetails = '') {
        try {
            console.error(`Product not found - Error details: ${errorDetails}`);
            
            // Check if we're running locally
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            // Store error details in sessionStorage for debugging
            if (errorDetails) {
                try {
                    console.error('Product loading error details:', errorDetails);
                    sessionStorage.setItem('productLoadError', errorDetails);
                } catch (e) {
                    console.error('Could not store error details:', e);
                }
            }
            
            // Get the product ID from URL for logging purposes
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id') || 'unknown';
            console.error(`Product not found: ${productId}`);
            
            // Create product not found content directly in the page instead of redirecting
            const productDetailGrid = document.getElementById('product-detail-grid');
            if (productDetailGrid) {
                // Show not found message directly in the product detail area
                productDetailGrid.innerHTML = `
                    <div class="product-not-found">
                        <h2>Product Not Found</h2>
                        <p>We couldn't find the product you're looking for.</p>
                        <p>Product ID: ${productId}</p>
                        ${errorDetails ? `<p class="error-details">Error: ${errorDetails}</p>` : ''}
                        <a href="products.html" class="back-to-products">Browse All Products</a>
                    </div>
                `;
                
                // Add some styling for the not found message
                const styleEl = document.createElement('style');
                styleEl.textContent = `
                    .product-not-found {
                        text-align: center;
                        padding: 40px;
                        background: rgba(0,0,0,0.05);
                        border-radius: 8px;
                        margin: 20px auto;
                        max-width: 600px;
                        grid-column: 1 / -1;
                    }
                    .product-not-found h2 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        color: #a855f7;
                    }
                    .back-to-products {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: linear-gradient(45deg, #a855f7, #6366f1);
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: bold;
                        transition: all 0.3s ease;
                    }
                    .back-to-products:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
                    }
                    .error-details {
                        font-family: monospace;
                        background: rgba(0,0,0,0.1);
                        padding: 10px;
                        border-radius: 4px;
                        margin: 10px 0;
                        font-size: 14px;
                        color: #d32f2f;
                        text-align: left;
                        max-width: 100%;
                        overflow-x: auto;
                    }
                `;
                document.head.appendChild(styleEl);
                
                // Update breadcrumb
                const breadcrumbCurrent = document.getElementById('breadcrumb-current');
                if (breadcrumbCurrent) {
                    breadcrumbCurrent.textContent = 'Product Not Found';
                }
                
                // Update page title
                document.title = 'Product Not Found - Bobby Streetwear';
                
                // Complete loading sequence
                this.completeLoadingSequence();
                return;
            }
            
            // Fall back to redirect if we can't show in-page message
            let redirectUrl = 'product-not-found.html';
            const params = new URLSearchParams();
            
            // If running locally, add deployment reason
            if (isLocal) {
                console.log('Running locally - redirecting with deployment reason');
                params.append('reason', 'deployment');
            }
            
            // Add error info if available
            if (errorDetails) {
                params.append('error', 'api');
                params.append('product', productId);
            }
            
            // Add the parameters to the URL if any exist
            if (params.toString()) {
                redirectUrl += '?' + params.toString();
            }
            
            console.log(`Redirecting to product not found page: ${redirectUrl}`);
            window.location.href = redirectUrl;
        } catch (error) {
            console.error('Error in showProductNotFound:', error);
        }
    }
    
    getColorCode(colorInput) {
        // Handle both string and object formats
        const colorName = typeof colorInput === 'object' ? colorInput.name : colorInput;
        
        // If input is already a color code (starts with #), return it
        if (typeof colorName === 'string' && colorName.startsWith('#')) {
            return colorName;
        }
        
        // Enhanced color mapping that fits Bobby Streetwear theme
        const colorMap = {
            // Core colors with theme-matching hues
            'black': '#000000',
            'white': '#FFFFFF',
            'red': '#EF4444',  // Tailwind red-500
            'green': '#10B981', // Tailwind emerald-500
            'blue': '#3B82F6',  // Tailwind blue-500
            'yellow': '#F59E0B', // Tailwind amber-500
            'purple': '#A855F7', // Site's main accent color
            'orange': '#F97316', // Tailwind orange-500
            'pink': '#EC4899',   // Tailwind pink-500
            
            // Grays and neutrals
            'gray': '#6B7280',   // Tailwind gray-500
            'grey': '#6B7280',   // Tailwind gray-500
            'slate': '#64748B',  // Tailwind slate-500
            
            // Dark colors
            'navy': '#1E3A8A',   // Tailwind blue-900
            'maroon': '#9F1239', // Tailwind rose-900
            'brown': '#92400E',  // Tailwind amber-900
            'charcoal': '#1F2937', // Tailwind gray-800
            
            // Fashion colors
            'lavender': '#C084FC', // Tailwind purple-400
            'mint': '#34D399',    // Tailwind emerald-400
            'coral': '#F87171',   // Tailwind red-400
            'olive': '#84CC16',   // Tailwind lime-500
            'wine': '#BE185D',    // Tailwind pink-800
            'indigo': '#6366F1',  // Site's secondary accent color
            'forest': '#166534',  // Tailwind green-800
            'cream': '#FEFCE8',   // Tailwind yellow-50
            'beige': '#FFFBEB',   // Tailwind amber-50
            
            // Default
            'default': '#A855F7'  // Use the site's main accent color as default
        };
        
        if (typeof colorName === 'string') {
            const lowerColor = colorName.toLowerCase();
            return colorMap[lowerColor] || '#333333'; // Default gray if not found
        }
        
        return '#333333'; // Default fallback
    }
    
    // Helper method to check if a string is a common color name
    isCommonColor(str) {
        if (!str || typeof str !== 'string') return false;
        
        const commonColors = [
            'black', 'white', 'red', 'green', 'blue', 'yellow', 'purple',
            'orange', 'pink', 'gray', 'grey', 'brown', 'navy', 'maroon',
            'charcoal', 'beige', 'olive', 'tan', 'silver', 'gold'
        ];
        
        return commonColors.includes(str.toLowerCase());
    }
    
    // Add updateThumbnailGrid method for compatibility with quick-view.js
    updateThumbnailGrid() {
        // This is a compatibility method to match quick-view.js functionality
        try {
            // Find the thumbnail container
            const galleryContainer = document.getElementById('product-gallery');
            if (!galleryContainer) return;
            
            // Update thumbnails based on filtered images
            if (this.filteredImages && this.filteredImages.length > 0) {
                galleryContainer.innerHTML = this.filteredImages.map((img, idx) => `
                    <div class="gallery-item ${idx === 0 ? 'active' : ''}"
                         style="cursor:pointer; border:2px solid ${idx === 0 ? '#4CAF50' : 'transparent'}; transition:all 0.2s ease;">
                        <img src="${img}" alt="${this.currentProduct.title} ${idx + 1}"
                             style="width:60px; height:60px; object-fit:cover;">
                    </div>
                `).join('');
                
                // Update main image to the first filtered image
                this.currentImageIndex = 0;
                this.updateMainImage();
                
                // Add click event listeners to the new thumbnails
                document.querySelectorAll('.gallery-item').forEach((item, index) => {
                    item.addEventListener('click', () => {
                        this.currentImageIndex = index;
                        this.updateMainImage();
                        
                        // Update active state of thumbnails
                        document.querySelectorAll('.gallery-item').forEach((i, idx) => {
                            if (idx === index) {
                                i.classList.add('active');
                                i.style.border = '2px solid #4CAF50';
                            } else {
                                i.classList.remove('active');
                                i.style.border = '2px solid transparent';
                            }
                        });
                    });
                });
            }
        } catch (error) {
            console.error('Error in updateThumbnailGrid:', error);
        }
    }
}

// Initialize product detail manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();
});