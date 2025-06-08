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
                    console.log('Setting up event listeners');
                    
                    // Create navigation controls if needed
                    this.setupNavigationControls();
                    
                    // Create quantity controls if needed
                    this.setupQuantityControls();
                    
                    // Create add to cart button if needed
                    this.setupAddToCartButton();
                    
                    // Product image navigation
                    const prevBtn = document.getElementById('prev-image');
                    const nextBtn = document.getElementById('next-image');
                    
                    if (prevBtn) {
                        prevBtn.addEventListener('click', () => this.navigateImages(-1));
                        console.log('Previous image button event listener added');
                    } else {
                        console.warn('Previous image button not found');
                    }
                    
                    if (nextBtn) {
                        nextBtn.addEventListener('click', () => this.navigateImages(1));
                        console.log('Next image button event listener added');
                    } else {
                        console.warn('Next image button not found');
                    }
                    
                    // Color selection
                    document.querySelectorAll('.color-option').forEach(colorOption => {
                        colorOption.addEventListener('click', (e) => {
                            const color = e.currentTarget.dataset.color;
                            console.log(`Color selected: ${color}`);
                            this.selectColor(color);
                        });
                    });
                    
                    // Size selection
                    document.querySelectorAll('.size-option').forEach(sizeOption => {
                        sizeOption.addEventListener('click', (e) => {
                            const size = e.currentTarget.dataset.size;
                            console.log(`Size selected: ${size}`);
                            this.selectSize(size);
                        });
                    });
                    
                    // Quantity controls
                    const quantityInput = document.getElementById('quantity');
                    const incrementBtn = document.getElementById('increment');
                    const decrementBtn = document.getElementById('decrement');
                    
                    if (quantityInput && incrementBtn && decrementBtn) {
                        incrementBtn.addEventListener('click', () => {
                            const newValue = Math.min(parseInt(quantityInput.value) + 1, 10);
                            quantityInput.value = newValue;
                            this.selectedVariant.quantity = newValue;
                            console.log(`Quantity increased to: ${newValue}`);
                        });
                        
                        decrementBtn.addEventListener('click', () => {
                            const newValue = Math.max(parseInt(quantityInput.value) - 1, 1);
                            quantityInput.value = newValue;
                            this.selectedVariant.quantity = newValue;
                            console.log(`Quantity decreased to: ${newValue}`);
                        });
                        
                        quantityInput.addEventListener('change', () => {
                            let value = parseInt(quantityInput.value);
                            if (isNaN(value) || value < 1) value = 1;
                            if (value > 10) value = 10;
                            quantityInput.value = value;
                            this.selectedVariant.quantity = value;
                            console.log(`Quantity set to: ${value}`);
                        });
                    } else {
                        console.warn('Quantity controls not found in DOM');
                    }
                    
                    // Add to cart button
                    const addToCartBtn = document.getElementById('add-to-cart');
                    if (addToCartBtn) {
                        addToCartBtn.addEventListener('click', () => {
                            console.log('Add to cart button clicked');
                            this.addToCart();
                        });
                    } else {
                        console.warn('Add to cart button not found in DOM');
                    }
                    
                    console.log('Event listeners setup completed');
                }
                
                setupNavigationControls() {
                    // Check if navigation controls exist
                    let navContainer = document.querySelector('.image-navigation');
                    
                    if (!navContainer) {
                        console.log('Creating image navigation controls');
                        
                        // Get or create the image section
                        let imageSection = document.querySelector('.product-image-section');
                        if (!imageSection) {
                            imageSection = document.createElement('div');
                            imageSection.className = 'product-image-section';
                            
                            const productContainer = document.querySelector('.product-container');
                            if (productContainer) {
                                const productInfoSection = document.querySelector('.product-info-section');
                                if (productInfoSection) {
                                    productContainer.insertBefore(imageSection, productInfoSection);
                                } else {
                                    productContainer.appendChild(imageSection);
                                }
                            } else {
                                document.body.appendChild(imageSection);
                            }
                        }
                        
                        // Create navigation container
                        navContainer = document.createElement('div');
                        navContainer.className = 'image-navigation';
                        navContainer.style.display = 'flex';
                        navContainer.style.justifyContent = 'space-between';
                        navContainer.style.marginTop = '10px';
                        
                        // Create prev button
                        const prevBtn = document.createElement('button');
                        prevBtn.id = 'prev-image';
                        prevBtn.textContent = 'Previous';
                        prevBtn.className = 'nav-button';
                        
                        // Create next button
                        const nextBtn = document.createElement('button');
                        nextBtn.id = 'next-image';
                        nextBtn.textContent = 'Next';
                        nextBtn.className = 'nav-button';
                        
                        // Add buttons to container
                        navContainer.appendChild(prevBtn);
                        navContainer.appendChild(nextBtn);
                        
                        // Add container to image section
                        imageSection.appendChild(navContainer);
                        
                        console.log('Navigation controls created successfully');
                    }
                }
                
                setupQuantityControls() {
                    // Check if quantity controls exist
                    let quantityContainer = document.querySelector('.quantity-controls');
                    let quantityInput = document.getElementById('quantity');
                    
                    if (!quantityContainer || !quantityInput) {
                        console.log('Creating quantity controls');
                        
                        // Get or create the product info section
                        let productInfoSection = document.querySelector('.product-info-section');
                        if (!productInfoSection) {
                            productInfoSection = document.createElement('div');
                            productInfoSection.className = 'product-info-section';
                            
                            const productContainer = document.querySelector('.product-container');
                            if (productContainer) {
                                productContainer.appendChild(productInfoSection);
                            } else {
                                document.body.appendChild(productInfoSection);
                            }
                        }
                        
                        // Create quantity container
                        quantityContainer = document.createElement('div');
                        quantityContainer.className = 'quantity-controls';
                        quantityContainer.style.display = 'flex';
                        quantityContainer.style.alignItems = 'center';
                        quantityContainer.style.marginTop = '20px';
                        quantityContainer.style.marginBottom = '20px';
                        
                        // Create quantity label
                        const quantityLabel = document.createElement('span');
                        quantityLabel.textContent = 'Quantity: ';
                        quantityLabel.style.marginRight = '10px';
                        
                        // Create decrement button
                        const decrementBtn = document.createElement('button');
                        decrementBtn.id = 'decrement';
                        decrementBtn.textContent = '-';
                        decrementBtn.className = 'quantity-btn';
                        decrementBtn.style.padding = '5px 10px';
                        
                        // Create quantity input
                        quantityInput = document.createElement('input');
                        quantityInput.type = 'number';
                        quantityInput.id = 'quantity';
                        quantityInput.min = '1';
                        quantityInput.max = '10';
                        quantityInput.value = '1';
                        quantityInput.style.width = '50px';
                        quantityInput.style.textAlign = 'center';
                        quantityInput.style.margin = '0 5px';
                        
                        // Create increment button
                        const incrementBtn = document.createElement('button');
                        incrementBtn.id = 'increment';
                        incrementBtn.textContent = '+';
                        incrementBtn.className = 'quantity-btn';
                        incrementBtn.style.padding = '5px 10px';
                        
                        // Add elements to container
                        quantityContainer.appendChild(quantityLabel);
                        quantityContainer.appendChild(decrementBtn);
                        quantityContainer.appendChild(quantityInput);
                        quantityContainer.appendChild(incrementBtn);
                        
                        // Add container to product info section
                        productInfoSection.appendChild(quantityContainer);
                        
                        console.log('Quantity controls created successfully');
                    }
                }
                
                setupAddToCartButton() {
                    // Check if add to cart button exists
                    let addToCartBtn = document.getElementById('add-to-cart');
                    
                    if (!addToCartBtn) {
                        console.log('Creating add to cart button');
                        
                        // Get or create the product info section
                        let productInfoSection = document.querySelector('.product-info-section');
                        if (!productInfoSection) {
                            productInfoSection = document.createElement('div');
                            productInfoSection.className = 'product-info-section';
                            
                            const productContainer = document.querySelector('.product-container');
                            if (productContainer) {
                                productContainer.appendChild(productInfoSection);
                            } else {
                                document.body.appendChild(productInfoSection);
                            }
                        }
                        
                        // Create add to cart button
                        addToCartBtn = document.createElement('button');
                        addToCartBtn.id = 'add-to-cart';
                        addToCartBtn.textContent = 'Add to Cart';
                        addToCartBtn.className = 'add-to-cart-btn';
                        addToCartBtn.style.padding = '10px 20px';
                        addToCartBtn.style.backgroundColor = '#4CAF50';
                        addToCartBtn.style.color = 'white';
                        addToCartBtn.style.border = 'none';
                        addToCartBtn.style.cursor = 'pointer';
                        addToCartBtn.style.borderRadius = '4px';
                        addToCartBtn.style.fontSize = '16px';
                        
                        // Add button to product info section
                        productInfoSection.appendChild(addToCartBtn);
                        
                        console.log('Add to cart button created successfully');
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
                        if (!productId) {
                            throw new Error('Product ID is required');
                        }
                        
                        console.log(`Making API request to Netlify function for product: ${productId}`);
                        
                        // Check if we're running locally
                        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                        console.log(`Running in ${isLocal ? 'LOCAL' : 'PRODUCTION'} environment`);
                        
                        // Add a timestamp to prevent caching issues
                        const timestamp = new Date().getTime();
                        const url = `/.netlify/functions/get-product-by-handle?handle=${encodeURIComponent(productId)}&_=${timestamp}`;
                        console.log(`API URL: ${url}`);
                        
                        const response = await fetch(url);
                        console.log(`API response status: ${response.status}`);
                        
                        if (!response.ok) {
                            throw new Error(`API response error: ${response.status} ${response.statusText}`);
                        }
                        
                        const data = await response.json();
                        
                        // Log simplified structure for debugging
                        console.log('API response keys:', Object.keys(data));
                        
                        // Check if we have product data in the response
                        if (!data) {
                            console.error('No data in API response');
                            return null;
                        }
                        
                        let productData = null;
                        
                        // Check direct data format - some APIs return the product directly
                        if (data.product) {
                            console.log('Found product in data.product');
                            productData = data.product;
                        } else if (data.id || data.handle) {
                            // Alternative format - some APIs might return product directly
                            console.log('Data appears to be a product object directly');
                            productData = data;
                        } else if (Array.isArray(data) && data.length > 0) {
                            // Check for array format
                            console.log('Data is an array, using first item');
                            productData = data[0];
                        }
                        
                        if (!productData) {
                            console.error('Could not find valid product data in API response');
                            console.log('Response structure:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
                            return null;
                        }
                        
                        const convertedProduct = this.convertShopifyProduct(productData);
                        
                        if (!convertedProduct) {
                            throw new Error('Failed to convert product data');
                        }
                        
                        return convertedProduct;
                        
                    } catch (error) {
                        console.error('Error loading product from Shopify:', error);
                        console.error('Error details:', error.message);
                        console.error('Stack trace:', error.stack);
                        
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
                
                // Convert colors from strings to objects with name and code properties
                // This ensures compatibility with quick-view.js which expects this format
                const colorObjects = Array.from(colors).map(colorName => {
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
                        console.log('Starting product load process');
                        const urlParams = new URLSearchParams(window.location.search);
                        const productId = urlParams.get('id') || 'bungi-hoodie-black'; // Default product if no ID
                        const selectedColor = urlParams.get('color'); // Get color from URL if available
        
                        console.log(`Loading product with ID: ${productId}`);
                        
                        // Load product data from Shopify API - no fallbacks
                        this.currentProduct = await this.fetchProductData(productId);
                        
                        // Detailed logging for debugging
                        if (this.currentProduct) {
                            console.log('Product data loaded successfully:', {
                                id: this.currentProduct.id,
                                title: this.currentProduct.title,
                                colors: this.currentProduct.colors?.length || 0,
                                sizes: this.currentProduct.sizes?.length || 0,
                                images: this.currentProduct.images?.length || 0
                            });
                        } else {
                            console.error('Failed to load product data');
                        }
                        
                        if (this.currentProduct) {
                            // Render the product to the DOM
                            await this.renderProduct();
                            
                            // Set the selected color if it was passed in the URL
                            if (selectedColor && this.currentProduct.colors &&
                                this.currentProduct.colors.includes(selectedColor)) {
                                console.log(`Setting selected color to: ${selectedColor}`);
                                this.selectColor(selectedColor);
                            }
                            
                            this.addToRecentlyViewed(this.currentProduct);
                            this.loadRelatedProducts();
                            
                            console.log('Product loading process completed successfully');
                        } else {
                            console.error('No product data available to render');
                            this.showProductNotFound();
                        }
                    } catch (error) {
                        console.error('Critical error in loadProduct:', error);
                        this.showProductNotFound();
                    }
                }

        async fetchProductData(productId) {
                    try {
                        console.log(`Fetching product data for: ${productId}`);
                        
                        if (!productId) {
                            throw new Error('Invalid product ID');
                        }
                        
                        // Only load from Shopify API - no fallbacks to sample data
                        const shopifyProduct = await this.loadShopifyProduct(productId);
                        
                        if (shopifyProduct) {
                            console.log(`Successfully loaded product from Shopify: ${shopifyProduct.title}`);
                            return shopifyProduct;
                        } else {
                            console.error('Failed to load product from Shopify API');
                            throw new Error('Product not found in Shopify API');
                        }
                    } catch (error) {
                        console.error(`❌ Error fetching product data for ${productId}:`, error);
                        console.error(`Error details: ${error.message}`);
                        console.error('❌ Product loading failed. This site requires deployment to Netlify to function correctly.');
                        return null;
                    }
                }

        renderProduct() {
                    if (!this.currentProduct) {
                        console.error('No product data available to render');
                        this.showProductNotFound();
                        return;
                    }
                    
                    console.log('Rendering product:', this.currentProduct.title);
                    
                    try {
                        // Set page title
                        document.title = this.currentProduct.title || 'Product Details';
                        
                        // Ensure main product container exists
                        let productContainer = document.querySelector('.product-container');
                        if (!productContainer) {
                            console.log('Creating main product container');
                            productContainer = document.createElement('div');
                            productContainer.className = 'product-container';
                            document.body.appendChild(productContainer);
                        }
                        
                        // Ensure product info section exists
                        let productInfoSection = document.querySelector('.product-info-section');
                        if (!productInfoSection) {
                            console.log('Creating product info section');
                            productInfoSection = document.createElement('div');
                            productInfoSection.className = 'product-info-section';
                            productContainer.appendChild(productInfoSection);
                        }
                        
                        // Create or update product title
                        let titleElement = document.getElementById('product-title');
                        if (!titleElement) {
                            console.log('Creating product title element');
                            titleElement = document.createElement('h1');
                            titleElement.id = 'product-title';
                            productInfoSection.appendChild(titleElement);
                        }
                        titleElement.textContent = this.currentProduct.title;
                        
                        // Create price container if needed
                        let priceContainer = document.querySelector('.price-container');
                        if (!priceContainer) {
                            console.log('Creating price container');
                            priceContainer = document.createElement('div');
                            priceContainer.className = 'price-container';
                            productInfoSection.appendChild(priceContainer);
                        }
                        
                        // Create or update product price
                        let priceElement = document.getElementById('product-price');
                        if (!priceElement) {
                            console.log('Creating product price element');
                            priceElement = document.createElement('span');
                            priceElement.id = 'product-price';
                            priceContainer.appendChild(priceElement);
                        }
                        priceElement.textContent = `$${this.currentProduct.price.toFixed(2)}`;
                        
                        // Create or update compare price and discount elements
                        let comparePriceElement = document.getElementById('product-compare-price');
                        if (!comparePriceElement) {
                            console.log('Creating compare price element');
                            comparePriceElement = document.createElement('span');
                            comparePriceElement.id = 'product-compare-price';
                            priceContainer.appendChild(comparePriceElement);
                        }
                        
                        let discountElement = document.getElementById('product-discount');
                        if (!discountElement) {
                            console.log('Creating discount element');
                            discountElement = document.createElement('span');
                            discountElement.id = 'product-discount';
                            priceContainer.appendChild(discountElement);
                        }
                        
                        // Set compare price and discount if applicable
                        if (this.currentProduct.comparePrice && this.currentProduct.comparePrice > this.currentProduct.price) {
                            comparePriceElement.textContent = `$${this.currentProduct.comparePrice.toFixed(2)}`;
                            comparePriceElement.style.display = 'inline-block';
                            
                            // Calculate discount percentage
                            const discount = Math.round(((this.currentProduct.comparePrice - this.currentProduct.price) / this.currentProduct.comparePrice) * 100);
                            discountElement.textContent = `-${discount}%`;
                            discountElement.style.display = 'inline-block';
                        } else {
                            comparePriceElement.style.display = 'none';
                            discountElement.style.display = 'none';
                        }
                        
                        // Create or update product description
                        let descriptionElement = document.getElementById('product-description');
                        if (!descriptionElement) {
                            console.log('Creating product description element');
                            descriptionElement = document.createElement('div');
                            descriptionElement.id = 'product-description';
                            productInfoSection.appendChild(descriptionElement);
                        }
                        descriptionElement.innerHTML = this.currentProduct.description || '';
                        
                        // Ensure image section exists
                        let imageSection = document.querySelector('.product-image-section');
                        if (!imageSection) {
                            console.log('Creating product image section');
                            imageSection = document.createElement('div');
                            imageSection.className = 'product-image-section';
                            productContainer.insertBefore(imageSection, productInfoSection);
                        }
                        
                        // Display the product container
                        productContainer.style.display = 'block';
                        
                        // Render product images
                        this.renderProductImages();
                        
                        // Render color options
                        this.renderColorOptions();
                        
                        // Render size options
                        this.renderSizeOptions();
                        
                        console.log('Product rendered successfully');
            } catch (error) {
                console.error('Error rendering product:', error);
                // Don't redirect to not-found in case of render errors, as the product data might be valid
                // Instead, show an error message if possible
                const errorContainer = document.createElement('div');
                errorContainer.className = 'error-message';
                errorContainer.textContent = 'Error displaying product. Please try refreshing the page.';
                document.body.appendChild(errorContainer);
            }
        }
        
        renderProductImages() {
                    console.log('Rendering product images');
                    
                    // First, ensure image section exists
                    let imageSection = document.querySelector('.product-image-section');
                    if (!imageSection) {
                        console.log('Creating product image section');
                        imageSection = document.createElement('div');
                        imageSection.className = 'product-image-section';
                        
                        const productContainer = document.querySelector('.product-container');
                        if (productContainer) {
                            const productInfoSection = document.querySelector('.product-info-section');
                            if (productInfoSection) {
                                productContainer.insertBefore(imageSection, productInfoSection);
                            } else {
                                productContainer.appendChild(imageSection);
                            }
                        } else {
                            document.body.appendChild(imageSection);
                            console.warn('Product container not found, appending image section to body');
                        }
                    }
                    
                    // Create main image container if it doesn't exist
                    let mainImageContainer = document.getElementById('main-product-image');
                    if (!mainImageContainer) {
                        console.log('Creating main image container');
                        mainImageContainer = document.createElement('div');
                        mainImageContainer.id = 'main-product-image';
                        mainImageContainer.className = 'main-image';
                        mainImageContainer.style.marginBottom = '15px';
                        imageSection.prepend(mainImageContainer);
                    }
                    
                    // Create gallery container if it doesn't exist
                    let galleryContainer = document.getElementById('product-gallery');
                    if (!galleryContainer) {
                        console.log('Creating gallery container');
                        galleryContainer = document.createElement('div');
                        galleryContainer.id = 'product-gallery';
                        galleryContainer.className = 'gallery';
                        galleryContainer.style.display = 'flex';
                        galleryContainer.style.gap = '10px';
                        galleryContainer.style.flexWrap = 'wrap';
                        imageSection.appendChild(galleryContainer);
                    }
            
            // Set main image with a large size display
            if (this.currentProduct.mainImage) {
                mainImageContainer.innerHTML = `
                    <img src="${this.currentProduct.mainImage}"
                         alt="${this.currentProduct.title}"
                         style="width:100%; max-height:500px; object-fit:contain;">`;
            }
            
            // Set gallery images
            if (this.currentProduct.images && this.currentProduct.images.length > 0) {
                // Use filtered images if available, otherwise use all images
                this.filteredImages = this.filteredImages?.length > 0
                    ? this.filteredImages
                    : this.currentProduct.images;
                
                galleryContainer.innerHTML = this.filteredImages.map((image, index) => `
                    <div class="gallery-item ${index === 0 ? 'active' : ''}" style="cursor:pointer; border:2px solid ${index === 0 ? '#4CAF50' : 'transparent'}; transition:all 0.2s ease;">
                        <img src="${image}"
                             alt="${this.currentProduct.title} ${index + 1}"
                             style="width:60px; height:60px; object-fit:cover;">
                    </div>
                `).join('');
                
                // Add click event listeners to gallery items
                document.querySelectorAll('.gallery-item').forEach((item, index) => {
                    item.addEventListener('click', () => {
                        this.currentImageIndex = index;
                        this.updateMainImage();
                        
                        // Update active class
                        document.querySelectorAll('.gallery-item').forEach(i => {
                            i.classList.remove('active');
                            i.style.border = '2px solid transparent';
                        });
                        item.classList.add('active');
                        item.style.border = '2px solid #4CAF50';
                    });
                });
            }
            
            console.log(`Rendered ${this.filteredImages?.length || 0} product images`);
        }
        
        // Add the missing updateThumbnailGrid method referenced in quick-view.js
                updateThumbnailGrid() {
                    console.log('Updating thumbnail grid with filtered images');
                    
                    try {
                        // Verify we have product data and filtered images
                        if (!this.currentProduct) {
                            console.error('Cannot update thumbnail grid: No product data available');
                            return;
                        }
                        
                        // Make sure filteredImages exists - default to all product images if not defined
                        if (!this.filteredImages || this.filteredImages.length === 0) {
                            console.log('No filtered images available, using all product images');
                            
                            if (this.currentProduct.images && this.currentProduct.images.length > 0) {
                                this.filteredImages = [...this.currentProduct.images];
                            } else {
                                console.warn('No images available to display');
                                return;
                            }
                        }
                        
                        // First, ensure image section exists
                        let imageSection = document.querySelector('.product-image-section');
                        if (!imageSection) {
                            console.log('Creating product image section for thumbnail grid');
                            imageSection = document.createElement('div');
                            imageSection.className = 'product-image-section';
                            
                            const productContainer = document.querySelector('.product-container');
                            if (productContainer) {
                                const productInfoSection = document.querySelector('.product-info-section');
                                if (productInfoSection) {
                                    productContainer.insertBefore(imageSection, productInfoSection);
                                } else {
                                    productContainer.appendChild(imageSection);
                                }
                            } else {
                                document.body.appendChild(imageSection);
                                console.warn('Product container not found, appending image section to body');
                            }
                        }
                        
                        // Create gallery container if it doesn't exist
                        let galleryContainer = document.getElementById('product-gallery');
                        if (!galleryContainer) {
                            console.log('Creating gallery container for thumbnail grid');
                            galleryContainer = document.createElement('div');
                            galleryContainer.id = 'product-gallery';
                            galleryContainer.className = 'gallery';
                            galleryContainer.style.display = 'flex';
                            galleryContainer.style.gap = '10px';
                            galleryContainer.style.flexWrap = 'wrap';
                            imageSection.appendChild(galleryContainer);
                        }
                        
                        // Get the selected color for data attributes (handle both string and object formats)
                        let selectedColor = '';
                        if (this.selectedVariant && this.selectedVariant.color) {
                            selectedColor = this.selectedVariant.color;
                        } else if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
                            // Get first color (handle both formats)
                            const firstColor = this.currentProduct.colors[0];
                            selectedColor = typeof firstColor === 'object' ? firstColor.name : firstColor;
                        }
                        
                        console.log(`Updating thumbnail grid with ${this.filteredImages.length} images for color: ${selectedColor}`);
                
                        // Generate HTML for filtered images with improved styling
                        galleryContainer.innerHTML = this.filteredImages.map((image, index) => `
                            <div class="gallery-item ${index === 0 ? 'active' : ''}"
                                 style="cursor:pointer; border:2px solid ${index === 0 ? '#4CAF50' : 'transparent'}; transition:all 0.2s ease;">
                                <img src="${image}"
                                     alt="${this.currentProduct?.title || 'Product'} ${index + 1}"
                                     data-color="${selectedColor}"
                                     style="width:60px; height:60px; object-fit:cover;">
                            </div>
                        `).join('');
                        
                        // Update main image to the first filtered image
                        if (this.filteredImages.length > 0) {
                            let mainImageContainer = document.getElementById('main-product-image');
                            
                            // Create main image container if it doesn't exist
                            if (!mainImageContainer) {
                                console.log('Main image container not found, creating it');
                                const imageSection = document.querySelector('.product-image-section');
                                
                                if (imageSection) {
                                    const newMainContainer = document.createElement('div');
                                    newMainContainer.id = 'main-product-image';
                                    newMainContainer.className = 'main-image';
                                    newMainContainer.style.marginBottom = '15px';
                                    imageSection.prepend(newMainContainer);
                                    mainImageContainer = newMainContainer;
                                }
                            }
                            
                            if (mainImageContainer) {
                                mainImageContainer.innerHTML = `
                                    <img src="${this.filteredImages[0]}"
                                         alt="${this.currentProduct?.title || 'Product'}"
                                         data-color="${selectedColor}"
                                         style="width:100%; max-height:500px; object-fit:contain;">`;
                                this.currentImageIndex = 0;
                            }
                        }
                        
                        // Add click event listeners to gallery items
                        document.querySelectorAll('.gallery-item').forEach((item, index) => {
                            item.addEventListener('click', () => {
                                this.currentImageIndex = index;
                                this.updateMainImage();
                                
                                // Update active class with visual feedback
                                document.querySelectorAll('.gallery-item').forEach(i => {
                                    i.classList.remove('active');
                                    i.style.border = '2px solid transparent';
                                });
                                item.classList.add('active');
                                item.style.border = '2px solid #4CAF50';
                            });
                        });
                        
                        console.log(`Thumbnail grid updated with ${this.filteredImages.length} images`);
                    } catch (error) {
                        console.error('Error updating thumbnail grid:', error);
                        console.error('Stack trace:', error.stack);
                    }
                }
        
        renderColorOptions() {
                    console.log('Rendering color options');
                    
                    // First, ensure product info section exists
                    let productInfoSection = document.querySelector('.product-info-section');
                    if (!productInfoSection) {
                        console.log('Creating product info section for color options');
                        productInfoSection = document.createElement('div');
                        productInfoSection.className = 'product-info-section';
                        
                        const productContainer = document.querySelector('.product-container');
                        if (productContainer) {
                            productContainer.appendChild(productInfoSection);
                        } else {
                            document.body.appendChild(productInfoSection);
                            console.warn('Product container not found, appending info section to body');
                        }
                    }
                    
                    // Create color options container if it doesn't exist
                    let colorOptionsContainer = document.getElementById('color-options');
                    if (!colorOptionsContainer) {
                        console.log('Creating color options container');
                        colorOptionsContainer = document.createElement('div');
                        colorOptionsContainer.id = 'color-options';
                        colorOptionsContainer.className = 'options-container';
                        
                        // Create a label for the color options
                        const colorLabel = document.createElement('h3');
                        colorLabel.textContent = 'Colors:';
                        productInfoSection.appendChild(colorLabel);
                        productInfoSection.appendChild(colorOptionsContainer);
                    }
                    
                    if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
                        console.log(`Rendering ${this.currentProduct.colors.length} color options with format:`,
                            typeof this.currentProduct.colors[0] === 'object' ? 'color objects' : 'color strings');
                        
                        colorOptionsContainer.innerHTML = this.currentProduct.colors.map(color => {
                            // Handle both formats: string or {name, code} object
                            const colorName = typeof color === 'object' ? color.name : color;
                            const colorCode = typeof color === 'object' ? color.code : this.getColorCode(color);
                            
                            return `
                                <div class="color-option" data-color="${colorName}"
                                     style="background-color: ${colorCode}"
                                     title="${colorName}">
                                    <span class="color-name">${colorName}</span>
                                </div>
                            `;
                        }).join('');
                        
                        // Add event listeners to color options
                        document.querySelectorAll('.color-option').forEach(colorOption => {
                            colorOption.addEventListener('click', (e) => {
                                const color = e.currentTarget.dataset.color;
                                this.selectColor(color);
                            });
                        });
                        
                        // Select first color by default
                        if (this.currentProduct.colors.length > 0 && !this.selectedVariant.color) {
                            // Get the name property if it's an object, otherwise use the color string directly
                            const firstColor = typeof this.currentProduct.colors[0] === 'object'
                                ? this.currentProduct.colors[0].name
                                : this.currentProduct.colors[0];
                                
                            console.log(`Selecting first color by default: ${firstColor}`);
                            this.selectColor(firstColor);
                        }
                    } else {
                        colorOptionsContainer.innerHTML = '<p>No color options available</p>';
                    }
                    
                    console.log(`Rendered ${this.currentProduct.colors?.length || 0} color options`);
                }
        
        renderSizeOptions() {
                    console.log('Rendering size options');
                    
                    // First, ensure product info section exists
                    let productInfoSection = document.querySelector('.product-info-section');
                    if (!productInfoSection) {
                        console.log('Creating product info section for size options');
                        productInfoSection = document.createElement('div');
                        productInfoSection.className = 'product-info-section';
                        
                        const productContainer = document.querySelector('.product-container');
                        if (productContainer) {
                            productContainer.appendChild(productInfoSection);
                        } else {
                            document.body.appendChild(productInfoSection);
                            console.warn('Product container not found, appending info section to body');
                        }
                    }
                    
                    // Create size options container if it doesn't exist
                    let sizeOptionsContainer = document.getElementById('size-options');
                    if (!sizeOptionsContainer) {
                        console.log('Creating size options container');
                        sizeOptionsContainer = document.createElement('div');
                        sizeOptionsContainer.id = 'size-options';
                        sizeOptionsContainer.className = 'options-container';
                        
                        // Create a label for the size options
                        const sizeLabel = document.createElement('h3');
                        sizeLabel.textContent = 'Sizes:';
                        productInfoSection.appendChild(sizeLabel);
                        productInfoSection.appendChild(sizeOptionsContainer);
                    }
                    
                    if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
                        sizeOptionsContainer.innerHTML = this.currentProduct.sizes.map(size => `
                            <div class="size-option" data-size="${size}">${size}</div>
                        `).join('');
                        
                        // Add event listeners to size options
                        document.querySelectorAll('.size-option').forEach(sizeOption => {
                            sizeOption.addEventListener('click', (e) => {
                                const size = e.currentTarget.dataset.size;
                                this.selectSize(size);
                            });
                        });
                        
                        // Select first size by default
                        if (this.currentProduct.sizes.length > 0 && !this.selectedVariant.size) {
                            this.selectSize(this.currentProduct.sizes[0]);
                        }
                    } else {
                        sizeOptionsContainer.innerHTML = '<p>No size options available</p>';
                    }
                    
                    console.log(`Rendered ${this.currentProduct.sizes?.length || 0} size options`);
                }
        
        selectColor(color) {
            console.log(`Selecting color: ${color}`);
            
            // Store the color name in selectedVariant
            this.selectedVariant.color = color;
            
            // Update active class
            document.querySelectorAll('.color-option').forEach(option => {
                if (option.dataset.color === color) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
            
            // Find the color object in our colors array for debugging
            let colorObject = null;
            if (this.currentProduct && this.currentProduct.colors) {
                colorObject = this.currentProduct.colors.find(c =>
                    typeof c === 'object' ? c.name === color : c === color
                );
                
                if (colorObject) {
                    console.log(`Found color object: ${JSON.stringify(colorObject)}`);
                } else {
                    console.log(`No color object found for: ${color}`);
                }
            }
            
            // Filter images for this color if available
            if (this.currentProduct.colorImages && this.currentProduct.colorImages[color]) {
                console.log(`Found ${this.currentProduct.colorImages[color].length} images for color: ${color}`);
                this.filteredImages = this.currentProduct.colorImages[color];
                this.currentImageIndex = 0;
                this.renderProductImages();
            } else {
                console.log(`No specific images found for color: ${color}, using all images`);
                
                // If no color-specific images, use all images but filter in the DOM
                if (this.currentProduct.images && this.currentProduct.images.length > 0) {
                    this.filteredImages = this.currentProduct.images;
                    this.currentImageIndex = 0;
                    this.renderProductImages();
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
                    console.log(`Navigating images in direction: ${direction}`);
                    
                    if (!this.filteredImages || this.filteredImages.length === 0) {
                        console.warn('No filtered images available for navigation');
                        return;
                    }
                    
                    const imageCount = this.filteredImages.length;
                    if (imageCount <= 1) {
                        console.log('Only one image available, navigation disabled');
                        return;
                    }
                    
                    // Calculate new index with boundary checking
                    const newIndex = (this.currentImageIndex + direction + imageCount) % imageCount;
                    console.log(`Navigating from image ${this.currentImageIndex} to ${newIndex}`);
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
                    
                    console.log('Image navigation completed successfully');
                }
        
        updateMainImage() {
                    console.log('Updating main product image');
                    
                    const mainImageContainer = document.getElementById('main-product-image');
                    if (!mainImageContainer) {
                        console.error('Main image container not found');
                        
                        // Try to create the main image container
                        const imageSection = document.querySelector('.product-image-section');
                        if (imageSection) {
                            const newMainContainer = document.createElement('div');
                            newMainContainer.id = 'main-product-image';
                            newMainContainer.className = 'main-image';
                            newMainContainer.style.marginBottom = '15px';
                            imageSection.prepend(newMainContainer);
                            console.log('Created missing main image container');
                        } else {
                            console.error('Image section not found, cannot create main image container');
                            return;
                        }
                    }
                    
                    if (!this.filteredImages || this.filteredImages.length === 0) {
                        console.warn('No filtered images available');
                        return;
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
                    console.log('Main image updated successfully');
                }
        
        addToCart() {
                    console.log('Adding product to cart');
                    
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
                        
                        console.log('Prepared cart product:', {
                            id: cartProduct.id,
                            title: cartProduct.title,
                            color: cartProduct.selectedColor,
                            size: cartProduct.selectedSize,
                            quantity: cartProduct.quantity
                        });
                        
                        // Try to use any available cart system
                        let cartAdded = false;
                        
                        // Try BobbyCart (consolidated cart)
                        if (window.BobbyCart) {
                            console.log('Using BobbyCart system');
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
                            console.log('Using cartManager system');
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
                            console.log('Product successfully added to cart');
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
        
        getColorCode(colorInput) {
            // Handle both string and object formats
            const colorName = typeof colorInput === 'object' ? colorInput.name : colorInput;
            
            // If input is already a color code (starts with #), return it
            if (typeof colorName === 'string' && colorName.startsWith('#')) {
                return colorName;
            }
            
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
                'Forest Green': '#228B22',
                'Red': '#FF0000',
                'Blue': '#0000FF',
                'Green': '#00FF00',
                'Yellow': '#FFFF00',
                'Purple': '#800080',
                'Pink': '#FFC0CB',
                'Orange': '#FFA500',
                'Brown': '#A52A2A',
                'Gray': '#808080',
                'Grey': '#808080'
            };
            
            // Case-insensitive lookup
            if (typeof colorName === 'string') {
                const normalizedName = colorName.trim();
                
                // Check exact match first
                if (colorMap[normalizedName]) {
                    return colorMap[normalizedName];
                }
                
                // Check case-insensitive match
                const lowerName = normalizedName.toLowerCase();
                for (const [key, value] of Object.entries(colorMap)) {
                    if (key.toLowerCase() === lowerName) {
                        return value;
                    }
                }
            }
            
            // Default purple color if no match found
            return '#a855f7';
        }
    }

    // Initialize product detail manager when document is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.productDetailManager = new ProductDetailManager();
    });