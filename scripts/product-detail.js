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
        this.setupEventListeners();
        this.loadRecentlyViewed();
        // Load animation styles
        this.loadAnimationStyles();
        // Start loading immediately without password protection
        this.startLoadingSequence();
    }
    
    // Load animation styles
    loadAnimationStyles() {
        // Check if animation styles are already loaded
        if (!document.querySelector('link[href*="add-to-cart-animations.css"]')) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = '/styles/add-to-cart-animations.css';
            document.head.appendChild(styleLink);
            console.log('Cart animation styles loaded');
        }
    }

    setupPasswordProtection() {
        const passwordScreen = document.getElementById('password-screen');
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit');
        const passwordError = document.getElementById('password-error');

        const checkPassword = () => {
            const password = passwordInput.value.trim();
            if (password === 'bajablastrabbit47') {
                passwordScreen.style.display = 'none';
                this.startLoadingSequence();
            } else {
                passwordError.style.display = 'block';
                passwordInput.value = '';
                passwordInput.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    passwordInput.style.animation = '';
                    passwordError.style.display = 'none';
                }, 2000);
            }
        };

        passwordSubmit.addEventListener('click', checkPassword);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }

    async startLoadingSequence() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainContent = document.getElementById('main-content');
        const loadingProgress = document.getElementById('loading-progress');
        const loadingPercentage = document.getElementById('loading-percentage');
        const loadingMessage = document.getElementById('loading-message');

        loadingScreen.style.display = 'flex';

        const messages = [
            'LOADING PRODUCT DETAILS',
            'FETCHING INVENTORY DATA',
            'PREPARING IMAGES',
            'LOADING REVIEWS',
            'FINALIZING DISPLAY'
        ];

        let progress = 0;
        let messageIndex = 0;
        let productLoaded = false;

        // Start loading the product data
        this.loadProduct().then(() => {
            productLoaded = true;
        }).catch(error => {
            console.error('Error loading product:', error);
            productLoaded = true; // Continue even if there's an error
        });

        const updateProgress = () => {
            // Slow down progress if product isn't loaded yet
            const progressIncrement = productLoaded ? Math.random() * 20 + 10 : Math.random() * 5 + 2;
            progress += progressIncrement;
            if (progress > 100) progress = 100;

            loadingProgress.style.width = `${progress}%`;
            loadingPercentage.textContent = `${Math.floor(progress)}%`;

            if (messageIndex < messages.length - 1 && progress > (messageIndex + 1) * 20) {
                messageIndex++;
                loadingMessage.textContent = messages[messageIndex];
            }

            if (progress >= 100 && productLoaded) {
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    mainContent.style.display = 'block';
                    document.body.classList.add('loaded');
                }, 500);
            } else {
                setTimeout(updateProgress, Math.random() * 200 + 100);
            }
        };

        updateProgress();
    }

    async loadProduct() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id') || 'bungi-hoodie-black'; // Default product if no ID
        const selectedColor = urlParams.get('color'); // Get color from URL if available

        // Load product data (this would typically come from an API)
        this.currentProduct = await this.fetchProductData(productId);
        
        // No fallback to sample data - if product not found, it stays null
        // and will be handled by renderProduct()

        this.renderProduct();
        
        // Set the selected color if it was passed in the URL
        if (selectedColor && this.currentProduct &&
            this.currentProduct.colors.some(c => c.name === selectedColor)) {
            this.selectColor(selectedColor);
        }
        
        this.addToRecentlyViewed(this.currentProduct);
        this.loadRelatedProducts();
    }

    async fetchProductData(productId) {
        console.log('Loading product data for:', productId);
        
        try {
            // Only load from Shopify API - no fallbacks to sample data
            console.log('🛍️ Loading product from Shopify API...');
            const shopifyProduct = await this.loadShopifyProduct(productId);
            
            if (shopifyProduct) {
                console.log('✅ Successfully loaded product from Shopify!');
                return shopifyProduct;
            }
            
            console.error('❌ Product not found in Shopify');
            // Show error page instead of sample data
            this.showProductNotFound();
            return null;
            
        } catch (error) {
            console.error('❌ Error loading product:', error);
            this.showProductNotFound();
            // Add clear message about deployment requirement
            console.error('❌ Product loading failed. This site requires deployment to Netlify to function correctly.');
            return null;
        }
    }

    async loadShopifyProduct(productId) {
        try {
            // Use Netlify function to avoid CORS issues
            console.log('🛍️ Loading product via Netlify function...');
            const response = await fetch('/.netlify/functions/get-products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                console.error('❌ Netlify function error:', data.error);
                return null;
            }

            // Find the specific product by handle/id or Shopify ID
            // Check if data has a products array (new API format) or is an array directly (old format)
            let products = [];
            if (data.products && Array.isArray(data.products)) {
                console.log('Processing product data from new API format');
                products = data.products;
            } else if (Array.isArray(data)) {
                console.log('Processing product data from legacy API format');
                products = data;
            } else {
                console.error('Unexpected data format from API:', data);
                return null;
            }
            
            const product = products.find(p => {
                const node = p.node || p;
                const shopifyId = node.id?.replace('gid://shopify/Product/', '');
                return node.handle === productId ||
                       shopifyId === productId ||
                       node.id === productId;
            });
            
            if (!product) {
                console.log('❌ Product not found in Shopify data');
                return null;
            }

            const productNode = product.node || product;
            console.log(`🛍️ Found product via Netlify function: ${productNode.title}`);
            return this.convertShopifyProductForDetail(productNode);
            
        } catch (error) {
            console.error('❌ Error loading product via Netlify function:', error);
            console.error('❌ Product loading failed. This site requires deployment to Netlify to function correctly.');
            return null;
        }
    }

    convertShopifyProductForDetail(shopifyProduct) {
        console.log("RAW SHOPIFY PRODUCT DATA:", JSON.stringify(shopifyProduct, null, 2));
        
        // Extract images from Shopify
        const shopifyImages = shopifyProduct.images.edges.map(imgEdge => imgEdge.node.url);
        
        // Only use Shopify images - no fallbacks
        let images = [];
        
        // Use Shopify images
        if (shopifyImages && shopifyImages.length > 0) {
            images = [...shopifyImages];
            console.log(`Using ${images.length} Shopify API images for product`);
        }
        else {
            images = [];
            console.log('No Shopify images found. Site requires deployment to Netlify to load images correctly.');
        }
        
        // Extract variants and organize by color/size
        const variants = [];
        const colorMap = {};
        const sizes = new Set();
        const inventory = {};
        const colorToImagesMap = new Map(); // Create map for color-specific images
        
        // DIRECT DEBUG: Log all variant data to see what's available
        console.log("AVAILABLE VARIANTS:", shopifyProduct.variants.edges.length);
        shopifyProduct.variants.edges.forEach((variantEdge, index) => {
            console.log(`VARIANT ${index+1}:`, JSON.stringify(variantEdge.node, null, 2));
        });
        
        shopifyProduct.variants.edges.forEach(variantEdge => {
            const variant = variantEdge.node;
            
            let color = '';
            let size = '';
            
            // Debug output to help diagnose issues
            console.log(`Product-detail: Processing variant: ${variant.title}`, JSON.stringify(variant.selectedOptions));
            
            // First pass: Look for exact "Size" option
            let foundSize = false;
            variant.selectedOptions.forEach(option => {
                if (option.name.toLowerCase() === 'color') {
                    color = option.value;
                    if (!colorMap[color]) {
                        colorMap[color] = {
                            name: color,
                            code: this.getColorCode(color)
                        };
                    }
                } else if (option.name.toLowerCase() === 'size') {
                    size = option.value;
                    sizes.add(size);
                    foundSize = true;
                    console.log(`Product-detail: Found direct size option: ${size}`);
                }
            });
            
            // If no options found but we have a title, use it directly as a fallback
            if (!foundSize && variant.title && variant.title !== 'Default Title') {
                // Just use the variant title directly as a size option
                size = variant.title;
                console.log(`Product-detail: Using variant title directly as size: ${size}`);
                sizes.add(size);
                foundSize = true;
            }
            
            // Second pass: Look for size-like values in any option (if size not found)
            if (!foundSize) {
                variant.selectedOptions.forEach(option => {
                    // Skip options we already processed as color
                    if (option.name.toLowerCase() === 'color') return;
                    
                    // Check if this might be a size value
                    const upperValue = option.value.toUpperCase().trim();
                    if (['S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'].includes(upperValue) ||
                        upperValue.includes('SMALL') ||
                        upperValue.includes('MEDIUM') ||
                        upperValue.includes('LARGE') ||
                        /^\d+$/.test(upperValue) || // Numeric sizes
                        /^[0-9]+\.[0-9]+$/.test(upperValue)) { // Decimal sizes
                        
                        console.log(`Product-detail: Detected size "${option.value}" from option "${option.name}"`);
                        size = option.value;
                        sizes.add(size);
                        foundSize = true;
                    }
                });
            }
            
            // Extract size from variant title if still not found
            if (!foundSize && variant.title && variant.title !== 'Default Title') {
                // Check for slash format (Color / Size)
                if (variant.title.includes('/')) {
                    const parts = variant.title.split('/').map(p => p.trim());
                    // Usually size is the second part (after color)
                    if (parts.length > 1) {
                        size = parts[1];
                        console.log(`Product-detail: Extracted size "${size}" from title with slash: ${variant.title}`);
                        sizes.add(size);
                        foundSize = true;
                    }
                }
                // Check for "One Size" variant
                else if (variant.title.toLowerCase().includes('one size')) {
                    size = 'One Size';
                    console.log(`Product-detail: Found "One Size" variant`);
                    sizes.add(size);
                    foundSize = true;
                }
                // Check for size-only variants
                else {
                    const upperTitle = variant.title.toUpperCase();
                    // Check if the entire title is a common size
                    if (['S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'].includes(upperTitle) ||
                        upperTitle.includes('SMALL') ||
                        upperTitle.includes('MEDIUM') ||
                        upperTitle.includes('LARGE') ||
                        /^\d+$/.test(upperTitle) || // Numeric sizes
                        upperTitle) { // Just use the title as is if nothing else works
                        
                        size = variant.title;
                        console.log(`Product-detail: Using variant title "${size}" as size`);
                        sizes.add(size);
                        foundSize = true;
                    }
                }
            }
            
            // Add to inventory tracking
            if (color && size) {
                inventory[`${color}-${size}`] = variant.quantityAvailable || 10; // Default to 10 if not available
            }
            
            // If variant has an image, associate it with the color
            if (variant.image && variant.image.url && color) {
                if (!colorToImagesMap.has(color)) {
                    colorToImagesMap.set(color, []);
                }
                
                // Only add if not already in the array
                if (!colorToImagesMap.get(color).includes(variant.image.url)) {
                    colorToImagesMap.get(color).push(variant.image.url);
                }
            }
            
            variants.push({
                id: variant.id,
                color: color,
                size: size,
                price: parseFloat(variant.price.amount),
                comparePrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                availableForSale: variant.availableForSale,
                quantityAvailable: variant.quantityAvailable || 10
            });
        });
        
        // If we have color-specific images but not for all colors,
        // assign general images to colors without specific images
        if (colorToImagesMap.size > 0 && colorToImagesMap.size < Object.keys(colorMap).length) {
            Object.keys(colorMap).forEach(color => {
                if (!colorToImagesMap.has(color)) {
                    colorToImagesMap.set(color, [...images]);
                }
            });
        }
        // If we don't have any color-specific images but do have colors
        else if (colorToImagesMap.size === 0 && Object.keys(colorMap).length > 0) {
            // Just assign all images to all colors
            Object.keys(colorMap).forEach(color => {
                colorToImagesMap.set(color, [...images]);
            });
        }
        
        // DIRECTLY EXTRACT ALL VARIANTS WITH THEIR ORIGINAL OPTIONS
        // This will preserve exactly what Shopify returns without trying to interpret it
        const directVariantOptions = new Map();
        
        shopifyProduct.variants.edges.forEach(variantEdge => {
            const variant = variantEdge.node;
            
            // Log each variant's options
            console.log(`Variant ${variant.title} options:`, JSON.stringify(variant.selectedOptions));
            
            // Group by size-like options or position in options
            let sizeOption = variant.selectedOptions.find(opt =>
                opt.name.toLowerCase() === 'size' ||
                ['s', 'm', 'l', 'xl', 'xxl', '2xl', '3xl', 'xxxl', 'small', 'medium', 'large', 'one size']
                    .includes(opt.value.toLowerCase())
            );
            
            // If no size option found, use the second option (often size) or the title
            let sizeValue;
            if (sizeOption) {
                sizeValue = sizeOption.value;
            } else if (variant.selectedOptions.length > 1) {
                sizeValue = variant.selectedOptions[1].value;
            } else if (variant.title && variant.title !== 'Default Title') {
                // Extract from title format "Color / Size"
                const parts = variant.title.split('/');
                sizeValue = parts.length > 1 ? parts[1].trim() : variant.title;
            } else {
                sizeValue = 'One Size';
            }
            
            // Add to sizes set
            sizes.add(sizeValue);
            console.log(`Added size option: ${sizeValue}`);
            
            // Also track the original variant ID for this size
            directVariantOptions.set(sizeValue, variant.id);
        });
        
        // Log all found sizes
        console.log("ALL DETECTED SIZES:", Array.from(sizes));
        
        // Add variant titles as sizes if no sizes were found at all
        if (sizes.size === 0) {
            console.log('No sizes found for product, adding variant titles as sizes');
            
            // Try to extract sizes from variants
            const variantTitles = new Set();
            
            shopifyProduct.variants.edges.forEach(variantEdge => {
                const variant = variantEdge.node;
                if (variant.title && variant.title !== 'Default Title') {
                    console.log(`Product-detail: Adding variant title as size: "${variant.title}"`);
                    variantTitles.add(variant.title);
                }
            });
            
            if (variantTitles.size > 0) {
                // Use variant titles as sizes
                variantTitles.forEach(title => sizes.add(title));
                console.log(`Product-detail: Added ${variantTitles.size} variant titles as sizes`);
                
                // Add inventory entries for each color with these sizes
                Object.keys(colorMap).forEach(color => {
                    variantTitles.forEach(size => {
                        inventory[`${color}-${size}`] = 10; // Default stock of 10
                        console.log(`Added inventory for ${color}-${size}`);
                    });
                });
            } else {
                // Fallback to "One Size" if no variant titles
                console.log('No variant titles found, adding "One Size" as fallback');
                const oneSize = "One Size";
                sizes.add(oneSize);
                
                // Add inventory entries for each color with this size
                Object.keys(colorMap).forEach(color => {
                    inventory[`${color}-${oneSize}`] = 10; // Default stock of 10
                    console.log(`Added inventory for ${color}-${oneSize}`);
                });
            }
        }
        
        // Calculate pricing
        const minPrice = parseFloat(shopifyProduct.priceRange.minVariantPrice.amount);
        const comparePrice = variants.find(v => v.comparePrice)?.comparePrice || null;
        
        // Extract features from description or use defaults
        const features = this.extractFeatures(shopifyProduct.description);
        
        return {
            id: shopifyProduct.handle,
            shopifyId: shopifyProduct.id,
            title: shopifyProduct.title,
            description: shopifyProduct.description || 'Premium streetwear with unique design.',
            category: this.extractCategory(shopifyProduct.title),
            price: minPrice,
            comparePrice: comparePrice,
            images: images.length > 0 ? images : [],
            variants: variants,
            colors: Object.values(colorMap),
            sizes: Array.from(sizes),
            colorImages: Object.fromEntries(colorToImagesMap), // Add the color to images mapping
            featured: shopifyProduct.tags.includes('featured'),
            new: shopifyProduct.tags.includes('new'),
            sale: comparePrice && comparePrice > minPrice,
            tags: shopifyProduct.tags,
            productType: shopifyProduct.productType,
            inventory: inventory,
            features: features,
            details: 'This product runs small. For the perfect fit, we recommend ordering one size larger than your usual size.',
            care: 'Machine wash cold, tumble dry low, do not bleach, iron on low heat if needed.',
            shipping: 'This product is made especially for you as soon as you place an order, which is why it takes us a bit longer to deliver it to you.',
            rating: 4.8,
            reviewCount: Math.floor(Math.random() * 200) + 50
        };
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
        
        return colorMap[colorName] || '#a855f7'; // Default to purple if color not found
    }

    extractFeatures(description) {
        // Default features for all products
        const defaultFeatures = [
            { icon: '🐰', text: 'Bobby the Tech Animal approved' },
            { icon: '⚡', text: 'Elite GooberMcGeet club exclusive' },
            { icon: '🧵', text: '100% cotton face for ultimate comfort' },
            { icon: '♻️', text: '65% ring-spun cotton, 35% polyester blend' },
            { icon: '👜', text: 'Front pouch pocket' },
            { icon: '🎯', text: 'Self-fabric patch on the back' },
            { icon: '🔥', text: 'Cyberpunk streetwear aesthetic' },
            { icon: '🍪', text: 'Cookie-approved design' }
        ];
        
        // TODO: Parse features from description if they're included
        return defaultFeatures;
    }

    showProductNotFound() {
        // Redirect to the product-not-found.html page instead of rendering inline
        console.log('Product not found, redirecting to product-not-found.html');
        // Add a query parameter to indicate this is a deployment issue
        window.location.href = 'product-not-found.html?reason=deployment';
    }

    extractCategory(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('hoodie')) return 'Hoodies';
        if (titleLower.includes('t-shirt') || titleLower.includes('tee')) return 'T-Shirts';
        if (titleLower.includes('sweatshirt')) return 'Sweatshirts';
        if (titleLower.includes('joggers') || titleLower.includes('pants')) return 'Joggers';
        if (titleLower.includes('windbreaker') || titleLower.includes('jacket')) return 'Windbreakers';
        if (titleLower.includes('beanie') || titleLower.includes('hat')) return 'Beanies';
        return 'Apparel';
    }

    // All images are fetched from Shopify API - no local fallbacks needed

    renderProduct() {
        if (!this.currentProduct) {
            return;
        }
        
        const productGrid = document.getElementById('product-detail-grid');
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        
        // Update breadcrumb
        if (breadcrumbCurrent) {
            breadcrumbCurrent.textContent = this.currentProduct.title;
        }
        
        // Update page title
        document.title = `${this.currentProduct.title} - Bobby Streetwear`;
        
        // Update page title
        this.updatePageTitle();

        // Initialize filteredImages with all product images
        this.filteredImages = [...this.currentProduct.images];

        const discount = this.currentProduct.comparePrice ?
            Math.round(((this.currentProduct.comparePrice - this.currentProduct.price) / this.currentProduct.comparePrice) * 100) : 0;

        productGrid.innerHTML = `
            <!-- Product Images -->
            <div class="product-images">
                <div class="main-image-container">
                    <img src="${this.currentProduct.images[0]}" alt="${this.currentProduct.title}" class="main-image" id="main-image">
                    <button class="image-zoom" onclick="productDetailManager.openImageZoom()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                            <circle cx="11" cy="11" r="3"></circle>
                        </svg>
                    </button>
                    <div class="image-badges">
                        ${this.currentProduct.new ? '<span class="image-badge new">New</span>' : ''}
                        ${this.currentProduct.sale ? `<span class="image-badge sale">-${discount}%</span>` : ''}
                        ${this.currentProduct.featured ? '<span class="image-badge">Featured</span>' : ''}
                    </div>
                </div>
                <div class="thumbnail-grid">
                    ${this.currentProduct.images.map((image, index) => `
                        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="productDetailManager.changeImage(${index})">
                            <img src="${image}" alt="${this.currentProduct.title}">
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Product Info -->
            <div class="product-info">
                <div class="product-category">${this.currentProduct.category}</div>
                <h1 class="product-title">${this.currentProduct.title}</h1>
                
                <div class="product-rating">
                    <div class="stars">
                        ${this.generateStars(this.currentProduct.rating)}
                    </div>
                    <span class="rating-text">${this.currentProduct.rating} (${this.currentProduct.reviewCount} reviews)</span>
                </div>

                <div class="product-price">
                    <span class="price-current">$${this.currentProduct.price.toFixed(2)}</span>
                    ${this.currentProduct.comparePrice ? `<span class="price-original">$${this.currentProduct.comparePrice.toFixed(2)}</span>` : ''}
                    ${this.currentProduct.sale ? `<span class="price-discount">-${discount}%</span>` : ''}
                </div>

                <p class="product-description">${this.currentProduct.description}</p>

                <div class="product-options">
                    ${this.currentProduct.colors.length > 0 ? `
                        <div class="option-group">
                            <label class="option-label">Color</label>
                            <div class="color-options">
                                ${this.currentProduct.colors.map((color, index) => `
                                    <button class="color-option ${index === 0 ? 'active' : ''}" 
                                            style="color: ${color.code}" 
                                            onclick="productDetailManager.selectColor('${color.name}')"
                                            data-color="${color.name}">
                                        <span class="color-name">${color.name}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${this.currentProduct.sizes.length > 0 ? `
                        <div class="option-group">
                            <label class="option-label">
                                Size
                                <a href="#" class="size-guide-link" onclick="productDetailManager.openSizeGuide()">Size Guide</a>
                            </label>
                            <div class="size-options">
                                ${this.currentProduct.sizes.map(size => `
                                    <button class="size-option" 
                                            onclick="productDetailManager.selectSize('${size}')"
                                            data-size="${size}">
                                        ${size}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="quantity-section">
                    <span class="quantity-label">Quantity:</span>
                    <div class="quantity-selector">
                        <button class="quantity-btn" onclick="productDetailManager.updateQuantity(-1)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span class="btn-text">−</span>
                        </button>
                        <span class="quantity-display" id="quantity-display">1</span>
                        <button class="quantity-btn" onclick="productDetailManager.updateQuantity(1)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span class="btn-text">+</span>
                        </button>
                    </div>
                </div>

                <div class="product-actions">
                    <button class="add-to-cart-btn" onclick="productDetailManager.addToCart()">
                        Add to Cart
                    </button>
                    <button class="wishlist-btn" onclick="productDetailManager.toggleWishlist()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>

                <div class="product-features">
                    <div class="features-grid">
                        ${this.currentProduct.features.map(feature => `
                            <div class="feature-item">
                                <div class="feature-icon">${feature.icon}</div>
                                <div class="feature-text">${feature.text}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="product-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" onclick="productDetailManager.switchTab('details')">Details</button>
                        <button class="tab-btn" onclick="productDetailManager.switchTab('care')">Care Instructions</button>
                        <button class="tab-btn" onclick="productDetailManager.switchTab('shipping')">Shipping</button>
                        <button class="tab-btn" onclick="productDetailManager.switchTab('reviews')">Reviews</button>
                    </div>
                    <div class="tab-content active" id="tab-details">
                        <p>${this.currentProduct.details}</p>
                    </div>
                    <div class="tab-content" id="tab-care">
                        <p>${this.currentProduct.care}</p>
                    </div>
                    <div class="tab-content" id="tab-shipping">
                        <p>${this.currentProduct.shipping}</p>
                    </div>
                    <div class="tab-content" id="tab-reviews">
                        <p>Customer reviews will be displayed here. Average rating: ${this.currentProduct.rating}/5 based on ${this.currentProduct.reviewCount} reviews.</p>
                    </div>
                </div>
            </div>
        `;

        // Set initial selections
        if (this.currentProduct.colors.length > 0) {
            this.selectedVariant.color = this.currentProduct.colors[0].name;
            // Filter images based on the initial color selection
            this.filterImagesByColor(this.selectedVariant.color);
        }
        
        this.updateInventoryDisplay();
    }

    updatePageTitle() {
        const collectionTitle = document.querySelector('.collection-title');
        
        if (!this.currentProduct) return;
        
        // Update the simple collection title
        if (collectionTitle) {
            collectionTitle.textContent = this.currentProduct.category.toUpperCase();
        }
    }

    generateProductSubtitle() {
        const subtitles = {
            'hoodie': 'Premium streetwear hoodie for the digital elite',
            'hoodies': 'Premium streetwear hoodie for the digital elite',
            't-shirt': 'Classic tech animal streetwear',
            'tshirt': 'Classic tech animal streetwear',
            'sweater': 'Cozy tech-inspired comfort wear',
            'windbreaker': 'High-tech weather protection',
            'sweatpants': 'Premium comfort for tech animals',
            'joggers': 'Elite streetwear for active tech animals',
            'beanie': 'Tech animal headwear essentials',
            'hat': 'Tech animal headwear essentials'
        };
        
        const category = this.currentProduct.category.toLowerCase();
        return subtitles[category] || 'Premium BUNGI X BOBBY streetwear';
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<span class="star">★</span>';
        }
        
        if (hasHalfStar) {
            starsHTML += '<span class="star">☆</span>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<span class="star empty">☆</span>';
        }
        
        return starsHTML;
    }

    setupEventListeners() {
        // Navigation
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Size guide modal
        const sizeGuideModal = document.getElementById('size-guide-modal');
        const sizeGuideClose = document.getElementById('size-guide-close');
        const sizeGuideOverlay = document.getElementById('size-guide-overlay');

        if (sizeGuideClose) {
            sizeGuideClose.addEventListener('click', () => this.closeSizeGuide());
        }

        if (sizeGuideOverlay) {
            sizeGuideOverlay.addEventListener('click', () => this.closeSizeGuide());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSizeGuide();
                this.closeImageZoom();
            }
        });
    }

    changeImage(index) {
        const mainImage = document.getElementById('main-image');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        if (mainImage && this.filteredImages[index]) {
            mainImage.src = this.filteredImages[index];
            this.currentImageIndex = index;
            
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
        }
    }

    selectColor(colorName) {
        this.selectedVariant.color = colorName;
        
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('active', option.dataset.color === colorName);
        });
        
        // Filter images based on selected color
        this.filterImagesByColor(colorName);
        
        // Update inventory display
        this.updateInventoryDisplay();
    }
    
    filterImagesByColor(colorName) {
        if (!this.currentProduct || !this.currentProduct.images || !colorName) {
            return;
        }
        
        // Check if we have explicit color-specific images from Shopify
        if (this.currentProduct.colorImages && this.currentProduct.colorImages[colorName]) {
            // Use the color-specific images from our mapping
            this.filteredImages = this.currentProduct.colorImages[colorName];
            console.log(`Using ${this.filteredImages.length} color-specific images for color: ${colorName}`);
        } else {
            // Fallback to filename-based filtering if no explicit color mapping
            
            // Convert color name to lowercase for case-insensitive comparison
            const color = colorName.toLowerCase();
            
            // Filter images that match the selected color
            this.filteredImages = this.currentProduct.images.filter(imagePath => {
                // First check if the image path exists (not a reference to a non-existent file)
                if (!imagePath || typeof imagePath !== 'string') {
                    return false;
                }
                
                const imageName = imagePath.toLowerCase();
                // Check if image filename contains the color name
                // Common patterns: color-position (e.g., black-front, white-back)
                return imageName.includes(`-${color}-`) ||
                       imageName.includes(`/${color}-`) ||
                       imageName.includes(`-${color.replace(' ', '-')}-`) ||
                       imageName.includes(`/${color.replace(' ', '-')}-`) ||
                       // Also try matching "color position" without hyphen
                       imageName.includes(`${color} `);
            });
            
            // If no images match the color, use all images as fallback
            if (this.filteredImages.length === 0) {
                console.log(`No specific images found for color: ${colorName}, using all images`);
                this.filteredImages = [...this.currentProduct.images];
            }
        }
        
        // Update the thumbnail grid with filtered images
        this.updateThumbnailGrid();
        
        // Reset current image index and update main image
        this.currentImageIndex = 0;
        const mainImage = document.getElementById('main-image');
        if (mainImage && this.filteredImages.length > 0) {
            mainImage.src = this.filteredImages[0];
        }
    }
    
    updateThumbnailGrid() {
        const thumbnailGrid = document.querySelector('.thumbnail-grid');
        if (!thumbnailGrid) return;
        
        thumbnailGrid.innerHTML = this.filteredImages.map((image, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="productDetailManager.changeImage(${index})">
                <img src="${image}" alt="${this.currentProduct.title}">
            </div>
        `).join('');
    }

    selectSize(size) {
        this.selectedVariant.size = size;
        
        document.querySelectorAll('.size-option').forEach(option => {
            option.classList.toggle('active', option.dataset.size === size);
        });
        
        this.updateInventoryDisplay();
    }

    updateQuantity(change) {
        const newQuantity = this.selectedVariant.quantity + change;
        const maxQuantity = this.getAvailableStock();
        
        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
            this.selectedVariant.quantity = newQuantity;
            document.getElementById('quantity-display').textContent = newQuantity;
        }
        
        // Update quantity buttons
        const decreaseBtn = document.querySelector('.quantity-btn:first-child');
        const increaseBtn = document.querySelector('.quantity-btn:last-child');
        
        if (decreaseBtn) decreaseBtn.disabled = this.selectedVariant.quantity <= 1;
        if (increaseBtn) increaseBtn.disabled = this.selectedVariant.quantity >= maxQuantity;
    }

    getAvailableStock() {
        if (!this.selectedVariant.color || !this.selectedVariant.size) {
            return 0;
        }
        
        const variantKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        return this.currentProduct.inventory[variantKey] || 0;
    }

    updateInventoryDisplay() {
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        const sizeOptions = document.querySelectorAll('.size-option');
        
        if (!this.selectedVariant.color) return;
        
        // Update size availability
        sizeOptions.forEach(option => {
            const size = option.dataset.size;
            const variantKey = `${this.selectedVariant.color}-${size}`;
            const stock = this.currentProduct.inventory[variantKey] || 0;
            
            option.classList.toggle('unavailable', stock === 0);
            option.disabled = stock === 0;
        });
        
        // Update add to cart button
        const stock = this.getAvailableStock();
        if (addToCartBtn) {
            const needsSize = !this.selectedVariant.size;
            const needsColor = !this.selectedVariant.color;
            
            addToCartBtn.disabled = stock === 0 || needsSize || needsColor;
            
            if (stock === 0) {
                addToCartBtn.textContent = 'Out of Stock';
            } else if (needsColor && needsSize) {
                addToCartBtn.textContent = 'Select Options';
            } else if (needsColor) {
                addToCartBtn.textContent = 'Select Color';
            } else if (needsSize) {
                addToCartBtn.textContent = 'Select Size';
            } else {
                addToCartBtn.textContent = 'Add to Cart';
            }
        }
    }

    addToCart() {
        // Validate product selection
        if (!this.validateProductSelection()) {
            return false;
        }
        
        const stock = this.getAvailableStock();
        if (stock < this.selectedVariant.quantity) {
            this.showNotification('Not enough stock available', 'error');
            return false;
        }
        
        // Find the Shopify variant ID for the selected options
        let shopifyVariantId = null;
        let variantImage = null;
        
        if (this.currentProduct.variants) {
            const matchingVariant = this.currentProduct.variants.find(v =>
                v.color === this.selectedVariant.color &&
                v.size === this.selectedVariant.size
            );
            if (matchingVariant) {
                shopifyVariantId = matchingVariant.id;
                variantImage = matchingVariant.image;
            }
        }
        
        // Get color-specific image - important for cart display
        let productImage = null;
        
        // If we have color-specific images for this product, use the first one for this color
        if (this.currentProduct.colorImages &&
            this.currentProduct.colorImages[this.selectedVariant.color] &&
            this.currentProduct.colorImages[this.selectedVariant.color].length > 0) {
            
            productImage = this.currentProduct.colorImages[this.selectedVariant.color][0];
            console.log(`Using color-specific image for cart: ${productImage}`);
        }
        // If we have filtered images (currently showing), use the first one
        else if (this.filteredImages && this.filteredImages.length > 0) {
            productImage = this.filteredImages[0];
            console.log(`Using filtered image for cart: ${productImage}`);
        }
        // If we have a variant image, use that
        else if (variantImage) {
            productImage = variantImage;
            console.log(`Using variant image for cart: ${productImage}`);
        }
        // Last resort - use main product image
        else {
            productImage = this.currentProduct.mainImage || this.currentProduct.images[0];
            console.log(`Using main product image for cart: ${productImage}`);
        }
        
        const cartItem = {
            ...this.currentProduct,
            selectedColor: this.selectedVariant.color,
            selectedSize: this.selectedVariant.size,
            quantity: this.selectedVariant.quantity,
            shopifyVariantId: shopifyVariantId,
            mainImage: productImage, // Use the color-specific image as the main image
            image: productImage     // Also set as image property for compatibility
        };
        
        const variantData = {
            ...this.selectedVariant,
            shopifyVariantId: shopifyVariantId,
            image: productImage
        };
        
        if (window.cartManager) {
            window.cartManager.addItem(cartItem, variantData);
            
            // Try to force cart to open properly
            setTimeout(() => {
                if (window.cartManager && window.cartManager.isOpen === false) {
                    window.cartManager.openCart();
                    console.log('Forcing cart to open after adding item');
                }
            }, 100);
        } else {
            console.error('Cart manager not available, cannot add item to cart');
            this.showNotification('Cart system not available', 'error');
            
            // Try to initialize cart manager if it doesn't exist
            if (typeof CartManager !== 'undefined') {
                window.cartManager = new CartManager();
                // Try again after initialization
                setTimeout(() => {
                    if (window.cartManager) {
                        window.cartManager.addItem(cartItem, variantData);
                        window.cartManager.openCart();
                    }
                }, 100);
            } else {
                return;
            }
        }
        
        // Update inventory
        const variantKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        this.currentProduct.inventory[variantKey] -= this.selectedVariant.quantity;
        this.updateInventoryDisplay();
        
        // Get the current product image for the notification
        const currentImage = document.getElementById('main-image')?.getAttribute('src') ||
                             this.filteredImages[0] ||
                             this.currentProduct.mainImage;
        
        // Show success notification and update the add to cart button
        this.showAddedFeedback();
        
        // Animate the cart icon
        this.animateCartIcon();
        
        return true;
    }

    toggleWishlist() {
        const wishlistBtn = document.querySelector('.wishlist-btn');
        
        if (window.wishlistManager) {
            window.wishlistManager.toggleItem(this.currentProduct.id);
            wishlistBtn.classList.toggle('active');
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[onclick="productDetailManager.switchTab('${tabName}')"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    openSizeGuide() {
        const modal = document.getElementById('size-guide-modal');
        const content = document.getElementById('size-guide-content');
        
        content.innerHTML = `
            <p>Find your perfect fit with our size guide:</p>
            <table class="size-guide-table">
                <thead>
                    <tr>
                        <th>Size</th>
                        <th>Chest (inches)</th>
                        <th>Length (inches)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>S</td><td>20</td><td>27</td></tr>
                    <tr><td>M</td><td>21</td><td>28</td></tr>
                    <tr><td>L</td><td>23</td><td>29</td></tr>
                    <tr><td>XL</td><td>25</td><td>30</td></tr>
                    <tr><td>2XL</td><td>26½</td><td>31</td></tr>
                    <tr><td>3XL</td><td>28</td><td>32</td></tr>
                </tbody>
            </table>
            <p><strong>Note:</strong> This hoodie runs small. We recommend ordering one size larger than your usual size.</p>
        `;
        
        modal.classList.add('active');
    }

    closeSizeGuide() {
        const modal = document.getElementById('size-guide-modal');
        modal.classList.remove('active');
    }

    openImageZoom() {
        const modal = document.createElement('div');
        modal.className = 'image-zoom-modal';
        modal.innerHTML = `
            <img src="${this.filteredImages[this.currentImageIndex]}" alt="${this.currentProduct.title}" class="zoom-image">
            <button class="zoom-close" onclick="productDetailManager.closeImageZoom()">×</button>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeImageZoom();
            }
        });
    }

    closeImageZoom() {
        const modal = document.querySelector('.image-zoom-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    addToRecentlyViewed(product) {
        if (!product) return;
        
        // Create a clean copy of the product with only Shopify API images
        const cleanProduct = {
            id: product.id,
            title: product.title,
            price: product.price,
            comparePrice: product.comparePrice,
            category: product.category,
            featured: product.featured,
            new: product.new,
            sale: product.sale,
            // Only keep Shopify images - no fallbacks
            mainImage: product.mainImage && product.mainImage.startsWith('http') ?
                product.mainImage : null,
            images: product.images ? product.images.filter(img => img.startsWith('http')) : []
        };
        
        // If no valid images, leave as empty array
        if (!cleanProduct.images || cleanProduct.images.length === 0) {
            cleanProduct.images = [];
        }
        
        // If mainImage isn't valid, use first image or leave as null
        if (!cleanProduct.mainImage && cleanProduct.images.length > 0) {
            cleanProduct.mainImage = cleanProduct.images[0];
        }
        
        // Update recently viewed list
        this.recentlyViewed = this.recentlyViewed.filter(p => p.id !== cleanProduct.id);
        this.recentlyViewed.unshift(cleanProduct);
        this.recentlyViewed = this.recentlyViewed.slice(0, 5);
        
        try {
            localStorage.setItem('bobby-streetwear-recently-viewed', JSON.stringify(this.recentlyViewed));
        } catch (error) {
            console.error('Error saving recently viewed:', error);
        }
        
        this.renderRecentlyViewed();
    }

    loadRecentlyViewed() {
        try {
            const saved = localStorage.getItem('bobby-streetwear-recently-viewed');
            if (saved) {
                let savedProducts = JSON.parse(saved);
                
                // Filter out any products with non-Shopify images
                savedProducts = savedProducts.map(product => {
                    // Create a clean version of each product
                    const cleanProduct = {...product};
                    
                    // Filter images to only include Shopify URLs - no fallbacks
                    if (cleanProduct.images && Array.isArray(cleanProduct.images)) {
                        cleanProduct.images = cleanProduct.images.filter(img => img.startsWith('http'));
                    } else {
                        cleanProduct.images = [];
                    }
                    
                    // Fix main image if needed
                    if (!cleanProduct.mainImage || !cleanProduct.mainImage.startsWith('http')) {
                        cleanProduct.mainImage = cleanProduct.images.length > 0 ? cleanProduct.images[0] : null;
                    }
                    
                    return cleanProduct;
                });
                
                this.recentlyViewed = savedProducts;
                this.renderRecentlyViewed();
                
                // Save the cleaned list back to localStorage
                localStorage.setItem('bobby-streetwear-recently-viewed', JSON.stringify(this.recentlyViewed));
            }
        } catch (error) {
            console.error('Error loading recently viewed:', error);
            // Clear potentially corrupted data
            this.recentlyViewed = [];
            localStorage.removeItem('bobby-streetwear-recently-viewed');
        }
    }

    renderRecentlyViewed() {
        const grid = document.getElementById('recently-viewed-grid');
        const section = document.querySelector('.recently-viewed');
        
        // Filter out products with no images
        const productsWithImages = this.recentlyViewed.filter(p => p.mainImage && p.images.length > 0);
        
        if (productsWithImages.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        grid.innerHTML = productsWithImages.map(product => this.createProductCard(product)).join('');
    }

    async loadRelatedProducts() {
        // Load related products based on category
        const relatedProducts = await this.fetchRelatedProducts();
        const grid = document.getElementById('related-products-grid');
        
        grid.innerHTML = relatedProducts.map(product => this.createProductCard(product)).join('');
    }

    async fetchRelatedProducts() {
        try {
            // Load all products from Shopify
            const response = await fetch('/.netlify/functions/get-products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                console.error('Error loading related products:', data.error);
                return [];
            }

            // Filter products by same category, excluding current product
            const currentCategory = this.currentProduct.category.toLowerCase();
            // Check if data has a products array (new API format) or is an array directly (old format)
            let products = [];
            if (data.products && Array.isArray(data.products)) {
                console.log('Processing related products from new API format');
                products = data.products;
            } else if (Array.isArray(data)) {
                console.log('Processing related products from legacy API format');
                products = data;
            } else {
                console.error('Unexpected data format from API:', data);
                return [];
            }
            
            const relatedProducts = products
                .filter(p => {
                    const node = p.node || p;
                    const productCategory = this.extractCategory(node.title).toLowerCase();
                    return productCategory === currentCategory && node.handle !== this.currentProduct.id;
                })
                .slice(0, 4) // Get first 4 related products
                .map(p => {
                    const node = p.node || p;
                    // Only use Shopify API images
                    const shopifyImages = node.images.edges.map(imgEdge => imgEdge.node.url);
                    // Only use Shopify images - no fallbacks
                    const images = shopifyImages.length > 0 ? shopifyImages : [];
                    const minPrice = parseFloat(node.priceRange.minVariantPrice.amount);
                    const firstVariant = node.variants.edges[0]?.node;
                    const comparePrice = firstVariant?.compareAtPrice ? parseFloat(firstVariant.compareAtPrice.amount) : null;
                    
                    return {
                        id: node.handle,
                        title: node.title,
                        price: minPrice,
                        comparePrice: comparePrice,
                        mainImage: images.length > 0 ? images[0] : null,
                        images: images,
                        category: this.extractCategory(node.title).toLowerCase(),
                        featured: node.tags.includes('featured'),
                        new: node.tags.includes('new'),
                        sale: comparePrice && comparePrice > minPrice
                    };
                });
            
            return relatedProducts;
            
        } catch (error) {
            console.error('Error loading related products:', error);
            return [];
        }
    }

    createProductCard(product) {
        // Skip products without images
        if (!product.mainImage) {
            return '';
        }
        
        const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
        
        return `
            <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
                <div class="product-image-container">
                    <img src="${product.mainImage}" alt="${product.title}" class="product-image"
                         onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">
                    <div class="product-badges">
                        ${product.new ? '<span class="product-badge new">New</span>' : ''}
                        ${product.sale ? `<span class="product-badge sale">-${discount}%</span>` : ''}
                        ${product.featured ? '<span class="product-badge">Featured</span>' : ''}
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category.replace('-', ' ')}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                        ${product.comparePrice ? `<span class="price-original">$${product.comparePrice.toFixed(2)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Show added to cart feedback with button animation
    showAddedFeedback() {
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        if (!addToCartBtn) return;
        
        // Remove any existing animation classes
        addToCartBtn.classList.remove('adding', 'success');
        
        // Force browser reflow to restart animation
        void addToCartBtn.offsetWidth;
        
        // Add animation class
        addToCartBtn.classList.add('adding');
        
        // Show the cart notification with product image
        this.showCartAddedNotification();
        
        // Remove animation class after it completes
        setTimeout(() => {
            addToCartBtn.classList.remove('adding');
        }, 1200);
    }
    
    // Show a cart notification with product details
    showCartAddedNotification() {
        if (!this.currentProduct) return;
        
        // Try to use BobbyCarts notification system first
        if (window.BobbyCarts && window.BobbyCarts.showCartNotification) {
            const currentImage = document.getElementById('main-image')?.getAttribute('src') ||
                                 this.filteredImages[0] ||
                                 this.currentProduct.mainImage;
                                 
            window.BobbyCarts.showCartNotification(
                this.currentProduct.title,
                currentImage,
                this.currentProduct.price
            );
            return;
        }
        
        // Fallback to our own notification system
        const productImage = document.getElementById('main-image')?.getAttribute('src') ||
                             this.filteredImages[0] ||
                             this.currentProduct.mainImage;
                             
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <img src="${productImage}" class="cart-notification-image" alt="${this.currentProduct.title}">
            <div class="cart-notification-content">
                <div class="cart-notification-title">${this.currentProduct.title} added to cart</div>
                <div class="cart-notification-info">
                    <span class="cart-notification-variant">${this.selectedVariant.color}, ${this.selectedVariant.size}</span>
                    <span class="cart-notification-price">$${this.currentProduct.price.toFixed(2)}</span>
                </div>
                <div class="cart-notification-buttons">
                    <button class="cart-notification-btn view-cart-btn" onclick="window.cartManager?.openCart()">View Cart</button>
                    <button class="cart-notification-btn checkout-btn" onclick="window.cartManager?.proceedToCheckout()">Checkout</button>
                </div>
            </div>
            <button class="cart-notification-close" onclick="this.parentNode.classList.remove('show')">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto hide after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 400);
        }, 5000);
    }
    
    // Animate the cart icon
    animateCartIcon() {
        // First check if BobbyCarts has its own animation method
        if (window.BobbyCarts && typeof window.BobbyCarts.animateCartIcon === 'function') {
            window.BobbyCarts.animateCartIcon();
            return;
        }
        
        // Fallback to our own animation
        const cartCounts = document.querySelectorAll('.cart-count');
        const cartIcons = document.querySelectorAll('.cart-icon');
        
        // Animate cart count badges
        if (cartCounts.length) {
            cartCounts.forEach(count => {
                // Remove existing animation class if present
                count.classList.remove('updated');
                
                // Trigger reflow to restart animation
                void count.offsetWidth;
                
                // Add animation class
                count.classList.add('updated');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    count.classList.remove('updated');
                }, 600);
            });
        }
        
        // Animate cart icons
        if (cartIcons.length) {
            cartIcons.forEach(icon => {
                // Remove existing animation class if present
                icon.classList.remove('pop');
                
                // Trigger reflow to restart animation
                void icon.offsetWidth;
                
                // Add animation class
                icon.classList.add('pop');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    icon.classList.remove('pop');
                }, 500);
            });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
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
    // Validate product selection
    validateProductSelection() {
        // Check if color is selected
        if (!this.selectedVariant.color) {
            this.showNotification('Please select a color', 'error');
            
            // Highlight color options section
            const colorOptionsGroup = document.querySelector('.option-group:has(.color-options)');
            if (colorOptionsGroup) {
                colorOptionsGroup.classList.remove('highlight-required');
                // Force reflow to restart animation
                void colorOptionsGroup.offsetWidth;
                
                colorOptionsGroup.classList.add('highlight-required');
                setTimeout(() => {
                    colorOptionsGroup.classList.remove('highlight-required');
                }, 2000);
                
                // Scroll to the color options for better visibility
                colorOptionsGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            return false;
        }
        
        // Check if size is selected
        if (!this.selectedVariant.size) {
            this.showNotification('Please select a size', 'error');
            
            // Highlight size options section
            const sizeOptionsGroup = document.querySelector('.option-group:has(.size-options)');
            if (sizeOptionsGroup) {
                sizeOptionsGroup.classList.remove('highlight-required');
                // Force reflow to restart animation
                void sizeOptionsGroup.offsetWidth;
                
                sizeOptionsGroup.classList.add('highlight-required');
                setTimeout(() => {
                    sizeOptionsGroup.classList.remove('highlight-required');
                }, 2000);
                
                // Scroll to the size options for better visibility
                sizeOptionsGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            return false;
        }
        
        return true;
    }
}

// Initialize product detail manager
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();
});