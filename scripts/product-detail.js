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

        // Start loading the product data with better error handling
        this.loadProduct().then(() => {
            productLoaded = true;
        }).catch(error => {
            productLoaded = true; // Continue even if there's an error
            
            // Show a non-blocking error message
            setTimeout(() => {
                this.showNotification('Product data may be incomplete. Some features might not work correctly.', 'warning');
            }, 3000);
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
        
        try {
            // Only load from Shopify API - no fallbacks to sample data
            const shopifyProduct = await this.loadShopifyProduct(productId);
            
            if (shopifyProduct) {
                return shopifyProduct;
            }
            
            // Show error page instead of sample data
            this.showProductNotFound();
            return null;
            
        } catch (error) {
            this.showProductNotFound();
            // Add clear message about deployment requirement
            console.error('❌ Product loading failed. This site requires deployment to Netlify to function correctly.');
            return null;
        }
    }

    async loadShopifyProduct(productId) {
        try {
            // Use Netlify function to avoid CORS issues
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
                products = data.products;
            } else if (Array.isArray(data)) {
                products = data;
            } else {
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
        
        // Extract images from Shopify
        const shopifyImages = shopifyProduct.images.edges.map(imgEdge => imgEdge.node.url);
        
        // Only use Shopify images - no fallbacks
        let images = [];
        
        // Use Shopify images
        if (shopifyImages && shopifyImages.length > 0) {
            images = [...shopifyImages];
        }
        else {
            images = [];
        }
        
        // Extract variants and organize by color/size
        const variants = [];
        const colorMap = {};
        const sizes = new Set();
        const inventory = {};
        const colorToImagesMap = new Map(); // Create map for color-specific images
        
        // DIRECT DEBUG: Log all variant data to see what's available
        shopifyProduct.variants.edges.forEach((variantEdge, index) => {
        });
        
        shopifyProduct.variants.edges.forEach(variantEdge => {
            const variant = variantEdge.node;
            
            let color = '';
            let size = '';
            
            // Debug output to help diagnose issues
            
            // CRITICAL DEBUG: Log the entire variant data to see everything from the API
            
            // IMPORTANT: Always add the variant title as a size option first - no filtering
            if (variant.title && variant.title !== 'Default Title') {
                size = variant.title;
                sizes.add(size);
            }
            
            // Look for color and size options in the variant options
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
                }
                
                // IMPORTANT: Add ALL option values as potential sizes
                if (option.value && option.value !== 'Default Title') {
                    sizes.add(option.value);
                }
            });
            
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
                        sizes.add(size);
                        foundSize = true;
                    }
                }
                // Check for "One Size" variant
                else if (variant.title.toLowerCase().includes('one size')) {
                    size = 'One Size';
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
                        sizes.add(size);
                        foundSize = true;
                    }
                }
            }
            
            // Add to inventory tracking
            if (color && size) {
                inventory[`${color}-${size}`] = variant.quantityAvailable || 10; // Default to 10 if not available
            }
            
            // Since the API response doesn't include variant images, we'll use smarter matching
            if (color) {
                if (!colorToImagesMap.has(color)) {
                    colorToImagesMap.set(color, []);
                }
                
                // For each image, check if it might belong to this color
                shopifyImages.forEach(imageUrl => {
                    if (!imageUrl || typeof imageUrl !== 'string') return;
                    
                    const lowerImageUrl = imageUrl.toLowerCase();
                    const lowerColor = color.toLowerCase();
                    
                    // Check if the image URL contains the color name
                    if (lowerImageUrl.includes(lowerColor) ||
                        lowerImageUrl.includes(lowerColor.replace(' ', '-')) ||
                        lowerImageUrl.includes(lowerColor.replace(' ', '_'))) {
                        
                        // Only add if not already in the array
                        if (!colorToImagesMap.get(color).includes(imageUrl)) {
                            colorToImagesMap.get(color).push(imageUrl);
                            console.log(`Associated image with color ${color}: ${imageUrl}`);
                        }
                    }
                });
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
        
        // Log all sizes discovered before processing
        console.log(`Product-detail: All discovered sizes (${sizes.size}): ${Array.from(sizes).join(', ')}`);
        
        // If still no sizes found, aggressive extraction of any data that could be a size
        if (sizes.size === 0) {
            console.log('EMERGENCY: No sizes found after normal processing, attempting emergency extraction');
            
            // Extract ANY variant titles available
            shopifyProduct.variants.edges.forEach(variantEdge => {
                const variant = variantEdge.node;
                
                // Add raw variant title without any filtering
                if (variant.title) {
                    sizes.add(variant.title);
                    console.log(`Product-detail: Emergency - Added raw variant title: "${variant.title}"`);
                }
                
                // Add ALL raw option values from all options without filtering
                if (variant.selectedOptions && variant.selectedOptions.length > 0) {
                    variant.selectedOptions.forEach(opt => {
                        if (opt.value) {
                            sizes.add(opt.value);
                            console.log(`Product-detail: Emergency - Added raw option value: "${opt.value}"`);
                        }
                    });
                }
            });
            
            // If STILL no sizes, add intelligent defaults based on product type
            if (sizes.size === 0) {
                console.log('CRITICAL: No size data found, using product type defaults');
                
                // Check product type/title to provide appropriate defaults
                const titleLower = shopifyProduct.title.toLowerCase();
                
                if (titleLower.includes('t-shirt') || titleLower.includes('tee')) {
                    // T-shirts typically have standard sizes
                    console.log('Product is a T-shirt, adding standard T-shirt sizes');
                    ['S', 'M', 'L', 'XL', '2XL'].forEach(size => sizes.add(size));
                } else if (titleLower.includes('hoodie') || titleLower.includes('sweatshirt')) {
                    // Hoodies typically have standard sizes
                    console.log('Product is a hoodie/sweatshirt, adding standard sizes');
                    ['S', 'M', 'L', 'XL', '2XL'].forEach(size => sizes.add(size));
                } else {
                    // For other products, add "One Size" only as a last resort
                    console.log('Unknown product type, using "One Size" as last resort');
                    sizes.add("One Size");
                }
            }
        }
        
        console.log(`Product-detail: Final sizes list (${sizes.size}): ${Array.from(sizes).join(', ')}`);
        
        // Add inventory entries for all sizes with all colors
        if (Object.keys(colorMap).length > 0) {
            Object.keys(colorMap).forEach(color => {
                sizes.forEach(size => {
                    const inventoryKey = `${color}-${size}`;
                    inventory[inventoryKey] = 10; // Default stock of 10
                });
            });
        } else {
            // If no colors, add inventory for sizes without color
            sizes.forEach(size => {
                const inventoryKey = `-${size}`;
                inventory[inventoryKey] = 10;
                console.log(`Added inventory for ${inventoryKey} (no color)`);
            });
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
        
        // Initialize with default color if available and update size options
        if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
            // Set the initial color
            this.selectedVariant.color = this.currentProduct.colors[0].name;
            console.log(`Setting initial color to ${this.selectedVariant.color}`);
            
            // Make sure to update size options based on this color after a small delay
            // to ensure the DOM is fully rendered
            setTimeout(() => {
                this.updateSizeOptionsForColor(this.selectedVariant.color);
            }, 100);
        }

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
                                ${this.getAvailableSizesForColor(this.selectedVariant.color).map(size => `
                                    <button class="size-option"
                                            onclick="productDetailManager.selectSize('${size}')"
                                            data-size="${size}"
                                            data-original-size="${size}">
                                        ${this.simplifySize(size)}
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
            // Update size options based on this color
            this.updateSizeOptionsForColor(this.selectedVariant.color);
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
        
        // Update size options based on this color
        this.updateSizeOptionsForColor(colorName);
        
        // Update inventory display
        this.updateInventoryDisplay();
    }
    
    // Update size options when color changes
    updateSizeOptionsForColor(colorName) {
        const sizeOptionsContainer = document.querySelector('.size-options');
        if (!sizeOptionsContainer) return;
        
        // Get sizes available for this color
        const availableSizes = this.getAvailableSizesForColor(colorName);
        console.log(`Updating size options for ${colorName}, found ${availableSizes.length} sizes`);
        
        // Clear the container first
        sizeOptionsContainer.innerHTML = '';
        
        // Only generate buttons if we have sizes for this color
        if (availableSizes.length > 0) {
            // Regenerate the size buttons with simplified display
            sizeOptionsContainer.innerHTML = availableSizes.map(size => `
                <button class="size-option"
                        onclick="productDetailManager.selectSize('${size}')"
                        data-size="${size}"
                        data-original-size="${size}">
                    ${this.simplifySize(size)}
                </button>
            `).join('');
        } else {
            // Show a message if no sizes are available for this color
            sizeOptionsContainer.innerHTML = '<div class="no-sizes-message">No sizes available for this color</div>';
        }
        
        // Reset selected size if it's no longer available
        if (this.selectedVariant.size && !availableSizes.includes(this.selectedVariant.size)) {
            this.selectedVariant.size = null;
            
            // Also update the add to cart button state
            this.updateInventoryDisplay();
        }
        
        console.log(`Updated size options for ${colorName}: ${availableSizes.join(', ')}`);
    }
    
    // Get available sizes for a specific color
    getAvailableSizesForColor(colorName) {
        if (!this.currentProduct || !this.currentProduct.sizes) {
            return [];
        }
        
        // If no color is selected yet, return no sizes
        if (!colorName) {
            return [];
        }
        
        console.log(`Finding sizes for color: ${colorName}`);
        
        // Get all variants with exact color match
        const colorVariants = this.currentProduct.variants.filter(v => 
            v.color === colorName
        );
        
        console.log(`Found ${colorVariants.length} exact color match variants`);
        
        // Extract sizes from these color-specific variants
        const colorSizes = new Set();
        
        // First pass: Get sizes directly from variants
        colorVariants.forEach(variant => {
            if (variant.size) {
                // Use simplified size for consistent matching
                const simplifiedSize = this.simplifySize(variant.size);
                colorSizes.add(simplifiedSize);
            }
        });
        
        // If we didn't find any sizes from variants, try extracting from inventory
        if (colorSizes.size === 0) {
            // Look through inventory to find sizes for this color
            Object.keys(this.currentProduct.inventory).forEach(key => {
                if (key.startsWith(`${colorName}-`) && this.currentProduct.inventory[key] > 0) {
                    const size = key.substring(colorName.length + 1); // +1 for the dash
                    if (size) {
                        const simplifiedSize = this.simplifySize(size);
                        colorSizes.add(simplifiedSize);
                    }
                }
            });
        }
        
        // Convert to array and sort by size order
        const sizeOrder = { 'XS': 0, 'S': 1, 'M': 2, 'L': 3, 'XL': 4, '2XL': 5, 'XXL': 5, '3XL': 6, 'OS': 7 };
        const sortedSizes = Array.from(colorSizes).sort((a, b) => {
            // For numeric sizes, sort numerically
            if (!isNaN(a) && !isNaN(b)) {
                return parseInt(a) - parseInt(b);
            }
            // For letter sizes, use our predefined order
            return (sizeOrder[a] || 999) - (sizeOrder[b] || 999);
        });
        
        return sortedSizes;
    }
    
    // Helper method to simplify size strings - ONLY returns S, M, L, etc.
    // This implementation will be enhanced by quick-view.js at runtime
    simplifySize(sizeString) {
        if (!sizeString) return '';
        
        // Basic implementation that will be overridden by quick-view.js
        // Extract size from "Color / Size" format
        if (sizeString.includes('/')) {
            const parts = sizeString.split('/').map(p => p.trim());
            sizeString = parts[parts.length - 1]; // Use the last part (size)
        }
        
        // Convert common size names to abbreviations
        const upperSize = sizeString.toUpperCase().trim();
        
        // Simple size mappings (more comprehensive version in quick-view.js)
        const sizeMap = {
            'SMALL': 'S',
            'MEDIUM': 'M',
            'LARGE': 'L',
            'EXTRA LARGE': 'XL',
            'EXTRA SMALL': 'XS',
            'ONE SIZE': 'OS'
        };
        
        // Return mapped size or original if no mapping exists
        return sizeMap[upperSize] ||
               ['S', 'M', 'L', 'XL', 'XXL', 'XS', 'OS'].includes(upperSize) ? upperSize :
               sizeString;
    }

    filterImagesByColor(colorName) {
        console.log(`Filtering images for color: ${colorName}`);
        
        // Basic implementation that will be enhanced by quick-view.js
        if (!this.currentProduct || !this.currentProduct.images) {
            console.error('No product data or images available for filtering');
            this.filteredImages = [];
            return;
        }

        if (!colorName) {
            // If no color is selected, show all images
            this.filteredImages = [...this.currentProduct.images];
            this.updateThumbnailGrid();
            return;
        }
        
        // First priority: Use explicit color-specific images if available
        if (this.currentProduct.colorImages && this.currentProduct.colorImages[colorName]) {
            this.filteredImages = this.currentProduct.colorImages[colorName];
            console.log(`Using ${this.filteredImages.length} color-specific images from mapping for ${colorName}`);
            this.updateThumbnailGrid();
            return;
        }
        
        // Second priority: Look for color name in image filenames
        const selectedColor = colorName.toLowerCase();
        let colorImages = this.currentProduct.images.filter(imagePath => {
            if (!imagePath || typeof imagePath !== 'string') return false;
            const filename = imagePath.toLowerCase();
            return filename.includes(selectedColor);
        });
        
        if (colorImages.length > 0) {
            this.filteredImages = colorImages;
            console.log(`Found ${colorImages.length} images containing ${selectedColor}`);
        } else {
            // Fallback: use all images
            console.log('No color-specific images found, using all images');
            this.filteredImages = [...this.currentProduct.images];
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
        
        // Clear the grid first
        thumbnailGrid.innerHTML = '';
        
        // Only add the filtered images to the grid - don't even create the other thumbnails
        // This ensures they can't be seen at all
        this.filteredImages.forEach((image, index) => {
            const thumbnailElement = document.createElement('div');
            thumbnailElement.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnailElement.setAttribute('onclick', `productDetailManager.changeImage(${index})`);
            thumbnailElement.innerHTML = `<img src="${image}" alt="${this.currentProduct.title}">`;
            thumbnailGrid.appendChild(thumbnailElement);
        });
        
        
        // If there's at least one image, make sure it's shown in the main display
        if (this.filteredImages.length > 0) {
            const mainImage = document.getElementById('main-image');
            if (mainImage) {
                mainImage.src = this.filteredImages[0];
                this.currentImageIndex = 0;
            }
        }
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

    validateProductSelection() {
        // Check if color and size are selected
        if (!this.selectedVariant.color) {
            this.showNotification('Please select a color', 'error');
            return false;
        }
        
        if (!this.selectedVariant.size) {
            this.showNotification('Please select a size', 'error');
            return false;
        }
        
        return true;
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
        let foundExactMatch = false;
        
        if (this.currentProduct.variants) {
            // First, try to find an exact match by color and size
            const matchingVariant = this.currentProduct.variants.find(v =>
                v.color === this.selectedVariant.color &&
                v.size === this.selectedVariant.size
            );
            
            if (matchingVariant) {
                shopifyVariantId = matchingVariant.id;
                variantImage = matchingVariant.image;
                foundExactMatch = true;
            }
            // If no exact match, try to find a match by size only (if color is less important)
            else if (this.selectedVariant.size) {
                const sizeMatchVariant = this.currentProduct.variants.find(v =>
                    v.size === this.selectedVariant.size
                );
                
                if (sizeMatchVariant) {
                    shopifyVariantId = sizeMatchVariant.id;
                    variantImage = sizeMatchVariant.image;
                }
            }
            // If still no match, use the first variant as a fallback
            if (!shopifyVariantId && this.currentProduct.variants.length > 0) {
                shopifyVariantId = this.currentProduct.variants[0].id;
                variantImage = this.currentProduct.variants[0].image;
            }
        }
        
        
        // Get color-specific image - important for cart display
        let productImage = null;
        
        // Use the currently displayed main image as the first priority
        const currentMainImage = document.getElementById('main-image');
        if (currentMainImage && currentMainImage.src) {
            productImage = currentMainImage.src;
        }
        // If we have color-specific images for this product, use the first one for this color
        else if (this.currentProduct.colorImages &&
            this.currentProduct.colorImages[this.selectedVariant.color] &&
            this.currentProduct.colorImages[this.selectedVariant.color].length > 0) {
            
            productImage = this.currentProduct.colorImages[this.selectedVariant.color][0];
        }
        // If we have filtered images (currently showing), use the first one
        else if (this.filteredImages && this.filteredImages.length > 0) {
            productImage = this.filteredImages[0];
        }
        // If we have a variant image, use that
        else if (variantImage) {
            productImage = variantImage;
        }
        // Last resort - use main product image
        else {
            productImage = this.currentProduct.mainImage || this.currentProduct.images[0];
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
                }
            }, 100);
        } else {
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
                    <tr><td>S</td><td>20</td><td>28</td></tr>
                    <tr><td>M</td><td>22</td><td>29</td></tr>
                    <tr><td>L</td><td>24</td><td>30</td></tr>
                    <tr><td>XL</td><td>26</td><td>31</td></tr>
                    <tr><td>2XL</td><td>28</td><td>32</td></tr>
                </tbody>
            </table>
        `;
        
        modal.classList.add('active');
    }

    closeSizeGuide() {
        const modal = document.getElementById('size-guide-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    openImageZoom() {
        const modal = document.getElementById('image-zoom-modal');
        const content = document.getElementById('image-zoom-content');
        const mainImage = document.getElementById('main-image');
        
        if (modal && content && mainImage) {
            content.innerHTML = `<img src="${mainImage.src}" alt="${this.currentProduct.title}">`;
            modal.classList.add('active');
        }
    }

    closeImageZoom() {
        const modal = document.getElementById('image-zoom-modal');
        if (modal) {
            modal.classList.remove('active');
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
        
        try {
            // Remove existing entry with same ID if present
            this.recentlyViewed = this.recentlyViewed.filter(p => p.id !== product.id);
            
            // Add to beginning of array
            this.recentlyViewed.unshift({
                id: product.id,
                title: product.title,
                image: product.images[0],
                price: product.price,
                category: product.category
            });
            
            // Limit to 8 items
            if (this.recentlyViewed.length > 8) {
                this.recentlyViewed = this.recentlyViewed.slice(0, 8);
            }
            
            // Save to localStorage
            localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
        } catch (error) {
            console.error('Error adding to recently viewed:', error);
        }
    }

    loadRelatedProducts() {
        // This would typically fetch related products from the API
        console.log('Loading related products...');
    }

    showNotification(message, type = 'success') {
        // Create or get notification container
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('active');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('active');
            setTimeout(() => {
                notificationContainer.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showAddedFeedback() {
        const addButton = document.querySelector('.add-to-cart-btn');
        if (addButton) {
            addButton.classList.add('added');
            addButton.textContent = 'Added to Cart';
            
            setTimeout(() => {
                addButton.classList.remove('added');
                addButton.textContent = 'Add to Cart';
            }, 2000);
        }
        
        this.showNotification('Added to cart successfully!');
    }

    animateCartIcon() {
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.classList.add('bounce');
            setTimeout(() => {
                cartIcon.classList.remove('bounce');
            }, 1000);
        }
    }
}

// Initialize product detail manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();
});