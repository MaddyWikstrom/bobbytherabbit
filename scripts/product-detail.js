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
            // Product image navigation
            const prevBtn = document.getElementById('prev-image');
            const nextBtn = document.getElementById('next-image');
            if (prevBtn) prevBtn.addEventListener('click', () => this.navigateImages(-1));
            if (nextBtn) nextBtn.addEventListener('click', () => this.navigateImages(1));
            
            // Color selection
            document.querySelectorAll('.color-option').forEach(colorOption => {
                colorOption.addEventListener('click', (e) => {
                    const color = e.target.dataset.color;
                    this.selectColor(color);
                });
            });
            
            // Size selection
            document.querySelectorAll('.size-option').forEach(sizeOption => {
                sizeOption.addEventListener('click', (e) => {
                    const size = e.target.dataset.size;
                    this.selectSize(size);
                });
            });
            
            // Quantity controls
            const quantityInput = document.getElementById('quantity');
            const incrementBtn = document.getElementById('increment');
            const decrementBtn = document.getElementById('decrement');
            
            if (quantityInput && incrementBtn && decrementBtn) {
                incrementBtn.addEventListener('click', () => {
                    quantityInput.value = Math.min(parseInt(quantityInput.value) + 1, 10);
                    this.selectedVariant.quantity = parseInt(quantityInput.value);
                });
                
                decrementBtn.addEventListener('click', () => {
                    quantityInput.value = Math.max(parseInt(quantityInput.value) - 1, 1);
                    this.selectedVariant.quantity = parseInt(quantityInput.value);
                });
                
                quantityInput.addEventListener('change', () => {
                    let value = parseInt(quantityInput.value);
                    if (isNaN(value) || value < 1) value = 1;
                    if (value > 10) value = 10;
                    quantityInput.value = value;
                    this.selectedVariant.quantity = value;
                });
            }
            
            // Add to cart button
            const addToCartBtn = document.getElementById('add-to-cart');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => this.addToCart());
            }
        }
        
        startLoadingSequence() {
            // Show loading animation
            document.querySelector('.product-loading')?.classList.add('active');
            
            // Hide the loading screen after product is loaded
            setTimeout(() => {
                document.querySelector('.product-loading')?.classList.remove('active');
                document.querySelector('.product-container')?.classList.add('loaded');
            }, 800);
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
            const container = document.getElementById('related-products');
            if (!container) return;
            
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
                console.log(`Making API request to Netlify function for product: ${productId}`);
                
                // Check if we're running locally
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                console.log(`Running in ${isLocal ? 'LOCAL' : 'PRODUCTION'} environment`);
                
                // For local development, you might want to consider a fallback approach
                // But for now, we'll attempt to fetch from the Netlify function anyway
                
                // Add a timestamp to prevent caching issues
                const timestamp = new Date().getTime();
                const response = await fetch(`/.netlify/functions/get-product-by-handle?handle=${productId}&_=${timestamp}`);
                
                console.log(`API response status: ${response.status}`);
                
                if (!response.ok) {
                    throw new Error(`API response error: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Log simplified structure for debugging
                console.log('API response keys:', Object.keys(data));
                
                // Check if we have product data in the response
                if (!data) {
                    console.error('No data in API response');
                    return null;
                }
                
                // Check direct data format - some APIs return the product directly
                if (data.product) {
                    console.log('Found product in data.product');
                    return this.convertShopifyProduct(data.product);
                }
                
                // Alternative format - some APIs might return product directly
                if (data.id || data.handle) {
                    console.log('Data appears to be a product object directly');
                    return this.convertShopifyProduct(data);
                }
                
                // Check for array format
                if (Array.isArray(data) && data.length > 0) {
                    console.log('Data is an array, using first item');
                    return this.convertShopifyProduct(data[0]);
                }
                
                console.error('Could not find valid product data in API response');
                console.log('Response structure:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
                return null;
                
            } catch (error) {
                console.error('Error loading product from Shopify:', error);
                console.error('Error details:', error.message);
                
                // This might be a CORS issue or a network issue
                if (error.message.includes('NetworkError') || error.message.includes('CORS')) {
                    console.error('This appears to be a network or CORS issue. The site requires deployment to Netlify to function correctly.');
                }
                
                return null;
            }
        }
        
        convertShopifyProduct(product) {
            if (!product) {
                console.error('Cannot convert null/undefined product');
                return null;
            }
            
            try {
                // Debug the product structure
                console.log('Converting Shopify product with structure:', Object.keys(product));
                
                if (product.title) {
                    console.log('Product title:', product.title);
                } else {
                    console.error('Product missing title property');
                }
                
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
                    console.warn('No images found for product, using fallback');
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
                        console.warn('Unexpected variants format');
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
                    colors: Array.from(colors),
                    sizes: Array.from(sizes),
                    colorImages: Object.fromEntries(colorToImagesMap)
                };
            } catch (error) {
                console.error('Error converting Shopify product:', error);
                console.error('Problem occurred with product:', product?.title || 'unknown');
                return null;
            }
        }
        
        async loadProduct() {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id') || 'bungi-hoodie-black'; // Default product if no ID
            const selectedColor = urlParams.get('color'); // Get color from URL if available

            console.log(`Loading product with ID: ${productId}`);
            
            // Load product data from API
            this.currentProduct = await this.fetchProductData(productId);
            
            // Log product data for debugging
            console.log('Product data loaded:', this.currentProduct ? 'Success' : 'Failed');
            
            if (this.currentProduct) {
                this.renderProduct();
                
                // Set the selected color if it was passed in the URL
                if (selectedColor && this.currentProduct.colors &&
                    this.currentProduct.colors.includes(selectedColor)) {
                    console.log(`Setting selected color to: ${selectedColor}`);
                    this.selectColor(selectedColor);
                }
                
                this.addToRecentlyViewed(this.currentProduct);
                this.loadRelatedProducts();
            } else {
                console.log('No product data available to render');
            }
        }

        async fetchProductData(productId) {
            try {
                console.log(`Fetching product data for: ${productId}`);
                
                // Only load from Shopify API - no fallbacks to sample data
                const shopifyProduct = await this.loadShopifyProduct(productId);
                
                if (shopifyProduct) {
                    console.log('Successfully loaded product from Shopify');
                    return shopifyProduct;
                }
                
                console.log('Product not found in Shopify, showing error page');
                // Show error page instead of sample data
                this.showProductNotFound();
                return null;
                
            } catch (error) {
                console.error('❌ Error fetching product data:', error);
                this.showProductNotFound();
                console.error('❌ Product loading failed. This site requires deployment to Netlify to function correctly.');
                return null;
            }
        }

        renderProduct() {
            if (!this.currentProduct) {
                this.showProductNotFound();
                return;
            }
            
            // Set page title
            document.title = this.currentProduct.title;
            
            // Update product info
            document.getElementById('product-title').textContent = this.currentProduct.title;
            document.getElementById('product-price').textContent = `$${this.currentProduct.price.toFixed(2)}`;
            
            if (this.currentProduct.comparePrice && this.currentProduct.comparePrice > this.currentProduct.price) {
                document.getElementById('product-compare-price').textContent = `$${this.currentProduct.comparePrice.toFixed(2)}`;
                document.getElementById('product-compare-price').style.display = 'inline-block';
                
                // Calculate discount percentage
                const discount = Math.round(((this.currentProduct.comparePrice - this.currentProduct.price) / this.currentProduct.comparePrice) * 100);
                document.getElementById('product-discount').textContent = `-${discount}%`;
                document.getElementById('product-discount').style.display = 'inline-block';
            } else {
                document.getElementById('product-compare-price').style.display = 'none';
                document.getElementById('product-discount').style.display = 'none';
            }
            
            // Set description
            document.getElementById('product-description').innerHTML = this.currentProduct.description;
            
            // Render product images
            this.renderProductImages();
            
            // Render color options
            this.renderColorOptions();
            
            // Render size options
            this.renderSizeOptions();
            
            // Show product container
            document.querySelector('.product-container').style.display = 'block';
        }
        
        renderProductImages() {
            const galleryContainer = document.getElementById('product-gallery');
            const mainImageContainer = document.getElementById('main-product-image');
            
            if (!galleryContainer || !mainImageContainer) return;
            
            // Set main image
            mainImageContainer.innerHTML = `<img src="${this.currentProduct.mainImage}" alt="${this.currentProduct.title}">`;
            
            // Set gallery images
            if (this.currentProduct.images && this.currentProduct.images.length > 0) {
                this.filteredImages = this.currentProduct.images;
                
                galleryContainer.innerHTML = this.filteredImages.map((image, index) => `
                    <div class="gallery-item ${index === 0 ? 'active' : ''}">
                        <img src="${image}" alt="${this.currentProduct.title} ${index + 1}">
                    </div>
                `).join('');
                
                // Add click event listeners to gallery items
                document.querySelectorAll('.gallery-item').forEach((item, index) => {
                    item.addEventListener('click', () => {
                        this.currentImageIndex = index;
                        this.updateMainImage();
                        
                        // Update active class
                        document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('active'));
                        item.classList.add('active');
                    });
                });
            }
        }
        
        renderColorOptions() {
            const colorOptionsContainer = document.getElementById('color-options');
            if (!colorOptionsContainer) return;
            
            if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
                colorOptionsContainer.innerHTML = this.currentProduct.colors.map(color => `
                    <div class="color-option" data-color="${color}" style="background-color: ${this.getColorCode(color)}" title="${color}">
                        <span class="color-name">${color}</span>
                    </div>
                `).join('');
                
                // Select first color by default
                if (this.currentProduct.colors.length > 0 && !this.selectedVariant.color) {
                    this.selectColor(this.currentProduct.colors[0]);
                }
            } else {
                colorOptionsContainer.innerHTML = '<p>No color options available</p>';
            }
        }
        
        renderSizeOptions() {
            const sizeOptionsContainer = document.getElementById('size-options');
            if (!sizeOptionsContainer) return;
            
            if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
                sizeOptionsContainer.innerHTML = this.currentProduct.sizes.map(size => `
                    <div class="size-option" data-size="${size}">${size}</div>
                `).join('');
                
                // Select first size by default
                if (this.currentProduct.sizes.length > 0 && !this.selectedVariant.size) {
                    this.selectSize(this.currentProduct.sizes[0]);
                }
            } else {
                sizeOptionsContainer.innerHTML = '<p>No size options available</p>';
            }
        }
        
        selectColor(color) {
            this.selectedVariant.color = color;
            
            // Update active class
            document.querySelectorAll('.color-option').forEach(option => {
                if (option.dataset.color === color) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
            
            // Filter images for this color if available
            if (this.currentProduct.colorImages && this.currentProduct.colorImages[color]) {
                this.filteredImages = this.currentProduct.colorImages[color];
                this.currentImageIndex = 0;
                this.renderProductImages();
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
            const imageCount = this.filteredImages.length;
            if (imageCount <= 1) return;
            
            this.currentImageIndex = (this.currentImageIndex + direction + imageCount) % imageCount;
            this.updateMainImage();
            
            // Update active class in gallery
            document.querySelectorAll('.gallery-item').forEach((item, index) => {
                item.classList.toggle('active', index === this.currentImageIndex);
            });
        }
        
        updateMainImage() {
            const mainImageContainer = document.getElementById('main-product-image');
            if (!mainImageContainer) return;
            
            const image = this.filteredImages[this.currentImageIndex];
            mainImageContainer.innerHTML = `<img src="${image}" alt="${this.currentProduct.title}">`;
        }
        
        addToCart() {
            if (!this.currentProduct) {
                this.showNotification('Product not available', 'error');
                return;
            }
            
            if (!this.selectedVariant.size) {
                this.showNotification('Please select a size', 'error');
                return;
            }
            
            const cartProduct = {
                ...this.currentProduct,
                selectedColor: this.selectedVariant.color,
                selectedSize: this.selectedVariant.size,
                quantity: this.selectedVariant.quantity
            };
            
            // Try to use any available cart system
            let cartAdded = false;
            
            // Try BobbyCart (consolidated cart)
            if (window.BobbyCart) {
                window.BobbyCart.addToCart(cartProduct);
                cartAdded = true;
                
                // Force cart to open
                setTimeout(() => {
                    window.BobbyCart.openCart();
                }, 300);
            }
            // Try other cart systems if needed
            else if (window.cartManager) {
                window.cartManager.addItem(cartProduct);
                cartAdded = true;
                
                // Force cart to open
                setTimeout(() => {
                    window.cartManager.openCart();
                }, 300);
            }
            
            if (cartAdded) {
                this.showNotification('Product added to cart!', 'success');
                
                // Trigger add to cart animation
                this.playAddToCartAnimation();
            } else {
                this.showNotification('Cart system not available', 'error');
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
        
        showProductNotFound() {
            // Check if we're running locally
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            // If running locally, pass a 'deployment' reason to show the deployment message
            if (isLocal) {
                console.log('Running locally - redirecting to product not found page with deployment reason');
                window.location.href = 'product-not-found.html?reason=deployment';
            } else {
                console.log('Redirecting to product not found page');
                window.location.href = 'product-not-found.html';
            }
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
    }

    // Initialize product detail manager when document is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.productDetailManager = new ProductDetailManager();
    });