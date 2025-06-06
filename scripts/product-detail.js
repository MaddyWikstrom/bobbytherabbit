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
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadRecentlyViewed();
        // Start loading immediately without password protection
        this.startLoadingSequence();
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

        // Load product data (this would typically come from an API)
        this.currentProduct = await this.fetchProductData(productId);
        
        // No fallback to sample data - if product not found, it stays null
        // and will be handled by renderProduct()

        this.renderProduct();
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
            const product = data.find(p => {
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
            return null;
        }
    }

    convertShopifyProductForDetail(shopifyProduct) {
        // Extract images directly from Shopify
        const images = shopifyProduct.images.edges.map(imgEdge => imgEdge.node.url);
        
        // Extract variants and organize by color/size
        const variants = [];
        const colorMap = {};
        const sizes = new Set();
        const inventory = {};
        
        shopifyProduct.variants.edges.forEach(variantEdge => {
            const variant = variantEdge.node;
            
            let color = '';
            let size = '';
            
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
                }
            });
            
            // Add to inventory tracking
            if (color && size) {
                inventory[`${color}-${size}`] = variant.quantityAvailable || 10; // Default to 10 if not available
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
        const productGrid = document.getElementById('product-detail-grid');
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        
        if (breadcrumbCurrent) {
            breadcrumbCurrent.textContent = 'Product Not Found';
        }
        
        if (productGrid) {
            productGrid.innerHTML = `
                <div class="product-not-found">
                    <h2>Product Not Found</h2>
                    <p>Sorry, we couldn't find the product you're looking for.</p>
                    <a href="products.html" class="back-to-products">Back to Products</a>
                </div>
            `;
        }
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

    // Remove all sample data methods - everything comes from API now

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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <span class="quantity-display" id="quantity-display">1</span>
                        <button class="quantity-btn" onclick="productDetailManager.updateQuantity(1)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
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
        
        if (mainImage && this.currentProduct.images[index]) {
            mainImage.src = this.currentProduct.images[index];
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
        
        this.updateInventoryDisplay();
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
            addToCartBtn.disabled = stock === 0 || !this.selectedVariant.size;
            addToCartBtn.textContent = stock === 0 ? 'Out of Stock' : 
                                      !this.selectedVariant.size ? 'Select Size' : 'Add to Cart';
        }
    }

    addToCart() {
        if (!this.selectedVariant.color || !this.selectedVariant.size) {
            this.showNotification('Please select color and size', 'error');
            return;
        }
        
        const stock = this.getAvailableStock();
        if (stock < this.selectedVariant.quantity) {
            this.showNotification('Not enough stock available', 'error');
            return;
        }
        
        const cartItem = {
            ...this.currentProduct,
            selectedColor: this.selectedVariant.color,
            selectedSize: this.selectedVariant.size,
            quantity: this.selectedVariant.quantity
        };
        
        if (window.cartManager) {
            window.cartManager.addItem(cartItem, this.selectedVariant);
        }
        
        // Update inventory
        const variantKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        this.currentProduct.inventory[variantKey] -= this.selectedVariant.quantity;
        this.updateInventoryDisplay();
        
        this.showNotification('Added to cart!', 'success');
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
            <img src="${this.currentProduct.images[this.currentImageIndex]}" alt="${this.currentProduct.title}" class="zoom-image">
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
        this.recentlyViewed = this.recentlyViewed.filter(p => p.id !== product.id);
        this.recentlyViewed.unshift(product);
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
                this.recentlyViewed = JSON.parse(saved);
                this.renderRecentlyViewed();
            }
        } catch (error) {
            console.error('Error loading recently viewed:', error);
        }
    }

    renderRecentlyViewed() {
        const grid = document.getElementById('recently-viewed-grid');
        const section = document.querySelector('.recently-viewed');
        
        if (this.recentlyViewed.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        grid.innerHTML = this.recentlyViewed.map(product => this.createProductCard(product)).join('');
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
            const relatedProducts = data
                .filter(p => {
                    const node = p.node || p;
                    const productCategory = this.extractCategory(node.title).toLowerCase();
                    return productCategory === currentCategory && node.handle !== this.currentProduct.id;
                })
                .slice(0, 4) // Get first 4 related products
                .map(p => {
                    const node = p.node || p;
                    const images = node.images.edges.map(imgEdge => imgEdge.node.url);
                    const minPrice = parseFloat(node.priceRange.minVariantPrice.amount);
                    const firstVariant = node.variants.edges[0]?.node;
                    const comparePrice = firstVariant?.compareAtPrice ? parseFloat(firstVariant.compareAtPrice.amount) : null;
                    
                    return {
                        id: node.handle,
                        title: node.title,
                        price: minPrice,
                        comparePrice: comparePrice,
                        mainImage: images[0] || '',
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
        const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
        
        return `
            <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
                <div class="product-image-container">
                    <img src="${product.mainImage}" alt="${product.title}" class="product-image">
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

// Initialize product detail manager
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();
});