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
        // Extract images from Shopify
        const shopifyImages = shopifyProduct.images.edges.map(imgEdge => imgEdge.node.url);
        
        // Get local mockup images (only as fallback)
        const localImages = this.getLocalMockupImages(shopifyProduct.handle, shopifyProduct.title);
        
        // PRIORITIZE SHOPIFY IMAGES: Create image array with Shopify images first, then fallback to local images
        let images = [];
        
        // Use Shopify images if available (preferred source)
        if (shopifyImages && shopifyImages.length > 0) {
            images = [...shopifyImages];
            console.log(`Using ${images.length} Shopify API images for product`);
        }
        // Fallback to local images if no Shopify images
        else if (localImages && localImages.length > 0) {
            images = [...localImages];
            console.log(`Falling back to ${images.length} local mockup images`);
        }
        // Last resort - generic placeholder
        else {
            images = ['assets/placeholder.png'];
            console.log('No product images found, using placeholder');
        }
        
        // Extract variants and organize by color/size
        const variants = [];
        const colorMap = {};
        const sizes = new Set();
        const inventory = {};
        const colorToImagesMap = new Map(); // Create map for color-specific images
        
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

    // Helper to provide cover images for products (separate from regular images)
    getProductCoverImage(productHandle, productTitle) {
        // Map product handles to their specific cover images
        const coverImageMap = {
            'bungi-x-bobby-rabbit-hardware-unisex-hoodie': 'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
            'bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie': 'mockups/unisex-premium-hoodie-white-back-683f8fddcabb2.png',
            'bungi-x-bobby-rabbit-hardware-unisex-organic-oversized-sweatshirt': 'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e116fe10.png'
        };
        
        // First try exact match
        if (coverImageMap[productHandle]) {
            return coverImageMap[productHandle];
        }
        
        // Try to find by title match
        const titleLower = productTitle ? productTitle.toLowerCase() : '';
        for (const [handle, image] of Object.entries(coverImageMap)) {
            if (titleLower.includes(handle.replace(/-/g, ' '))) {
                return image;
            }
        }
        
        // Default cover image if no match
        return 'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png';
    }

    getLocalMockupImages(productHandle, productTitle) {
        // Map product handles to their local mockup images that we've verified exist
        const mockupMappings = {
            'bungi-x-bobby-rabbit-hardware-unisex-hoodie': [
                // Black variants
                'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c7dbc.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c454e.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021d1e6b.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021d10cf.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d2cb7.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d48f6.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d63b0.png',
                'mockups/unisex-premium-hoodie-black-left-front-683f9021d3bb3.png',
                'mockups/unisex-premium-hoodie-black-left-front-683f9021d5672.png',
                'mockups/unisex-premium-hoodie-black-product-details-683f9021d031c.png',
                'mockups/unisex-premium-hoodie-black-right-683f9021d7e69.png',
                'mockups/unisex-premium-hoodie-black-right-683f9021d9a41.png',
                'mockups/unisex-premium-hoodie-black-right-683f9021db0c8.png',
                'mockups/unisex-premium-hoodie-black-right-front-683f9021d8c96.png',
                'mockups/unisex-premium-hoodie-black-right-front-683f9021da77d.png',
                
                // Charcoal Heather variants
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022d94ea.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022dda27.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022e274e.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022ec2ea.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f90230b140.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f902306bbf.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9023029ae.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f902315348.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022af178.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022b4bc6.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022b9614.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022bf4ef.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022c3b59.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022d1c31.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022d56a9.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f90231dc55.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9023221a7.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-683f90232db97.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-683f902335bde.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-683f9023265c1.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-front-683f90232a100.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-front-683f9023315c6.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-product-details-683f90231950e.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-683f90233dd40.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-683f90234d7d9.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-683f9023457b5.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f90234190a.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f902349507.png',
                
                // Maroon variants
                'mockups/unisex-premium-hoodie-maroon-back-683f90225ac87.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90226f069.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90227c5b6.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022632e7.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022698f9.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022757a0.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90223e529.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90224aec2.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902237f8f.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902242d51.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902253f58.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902257a94.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902282a52.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902285fda.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f9022352a8.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902247897.png',
                'mockups/unisex-premium-hoodie-maroon-left-683f90228e99c.png',
                'mockups/unisex-premium-hoodie-maroon-left-683f902288f36.png',
                'mockups/unisex-premium-hoodie-maroon-left-683f902293d87.png',
                'mockups/unisex-premium-hoodie-maroon-left-front-683f90228c159.png',
                'mockups/unisex-premium-hoodie-maroon-left-front-683f9022912dc.png',
                'mockups/unisex-premium-hoodie-maroon-product-details-683f90227f787.png',
                'mockups/unisex-premium-hoodie-maroon-right-683f9022a4ec2.png',
                'mockups/unisex-premium-hoodie-maroon-right-683f90229f0d8.png',
                'mockups/unisex-premium-hoodie-maroon-right-683f9022996fd.png',
                'mockups/unisex-premium-hoodie-maroon-right-front-683f9022a1ecc.png',
                'mockups/unisex-premium-hoodie-maroon-right-front-683f90229c199.png',
                
                // Navy Blazer variants
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f340b.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90220a49d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90220c026.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902202df1.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902207edc.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902211d54.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90220129d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90221017f.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902204828.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021df6e7.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e1a2a.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e4de3.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e67ee.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e3452.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021ecb13.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021eefd9.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9022183ba.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-683f90221aa90.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-683f90221f43e.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-683f902223cf8.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-front-683f90221cad5.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-front-683f902221fe4.png',
                'mockups/unisex-premium-hoodie-navy-blazer-product-details-683f90221408e.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-683f90222d3ed.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-683f902227e4c.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-683f90223094d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-front-683f90222a85d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-front-683f90222eec5.png',
                
                // Vintage Black variants
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023ad2c6.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023b96cd.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023b2911.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023c318e.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f90238c9e9.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f90239dcd9.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f902387cc2.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023918a7.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023cc9cc.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023d2ea2.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90235e599.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90236a5e6.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90236fe1c.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f902364bee.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f902382f2a.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023749ba.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90235506f.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90235970a.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f902379677.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-683f9023d85a1.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-683f9023e21ce.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-683f9023eb72a.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-front-683f9023dd7aa.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-front-683f9023e6e1a.png',
                'mockups/unisex-premium-hoodie-vintage-black-product-details-683f9023c7e67.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-683f90240cd93.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-683f902402ac4.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-683f902418707.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-front-683f902407984.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-front-683f902413558.png'
            ],
            'bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie': [
                // White variants - start with the back image as requested
                'mockups/unisex-premium-hoodie-white-back-683f8fddcabb2.png', // MAIN COVER IMAGE (BACK VIEW)
                'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcc3c5.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddccd72.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcd618.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcdeaf.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddce7bf.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcf92a.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd0bf4.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd70e7.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd0201.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd7977.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd1d6d.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd2d80.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd3e2a.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd5fa6.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd14c9.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd35a9.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd4659.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd5753.png',
                'mockups/unisex-premium-hoodie-white-left-683f8fddd825c.png',
                'mockups/unisex-premium-hoodie-white-left-683f8fddd9327.png',
                'mockups/unisex-premium-hoodie-white-left-683f8fddda3b7.png',
                'mockups/unisex-premium-hoodie-white-left-front-683f8fddd8b54.png',
                'mockups/unisex-premium-hoodie-white-left-front-683f8fddd9b64.png',
                'mockups/unisex-premium-hoodie-white-product-details-683f8fddd68c9.png',
                'mockups/unisex-premium-hoodie-white-right-683f8fdddb49b.png',
                'mockups/unisex-premium-hoodie-white-right-683f8fdddc582.png',
                'mockups/unisex-premium-hoodie-white-right-683f8fdddd5dc.png',
                'mockups/unisex-premium-hoodie-white-right-front-683f8fdddbd08.png',
                'mockups/unisex-premium-hoodie-white-right-front-683f8fdddcda0.png'
            ],
            'bungi-x-bobby-rabbit-hardware-unisex-organic-oversized-sweatshirt': [
                'mockups/unisex-organic-oversized-sweatshirt-heather-grey-front-683f8e116cda5.png',
                'mockups/unisex-organic-oversized-sweatshirt-heather-grey-front-683f8e116edb0.png',
                'mockups/unisex-organic-oversized-sweatshirt-heather-grey-left-683f8e116551c.png',
                'mockups/unisex-organic-oversized-sweatshirt-heather-grey-product-details-683f8e116d5a3.png',
                'mockups/unisex-organic-oversized-sweatshirt-heather-grey-right-683f8e116596f.png',
                'mockups/unisex-organic-oversized-sweatshirt-heather-grey-right-front-683f8e116dda7.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-back-683f8e117a3f2.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-back-683f8e117cbcf.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-back-683f8e117e98c.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-back-683f8e1181944.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e116fe10.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e117c1dc.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e117d4df.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e117e077.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e117f532.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e1172a12.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e1173a53.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e1174154.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-front-683f8e1178348.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-left-683f8e1179abe.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-product-details-683f8e1176080.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-right-683f8e117b663.png',
                'mockups/unisex-organic-oversized-sweatshirt-white-right-front-683f8e1180ccc.png'
            ]
        };

        // Check if we have mockups for this product
        if (mockupMappings[productHandle]) {
            return mockupMappings[productHandle];
        }

        // Try to find mockups based on product title keywords
        const titleLower = productTitle ? productTitle.toLowerCase() : '';
        for (const [handle, images] of Object.entries(mockupMappings)) {
            if (titleLower.includes(handle.replace(/-/g, ' '))) {
                return images;
            }
        }

        // Return a sensible default set of images if nothing matches
        // We're using the white hoodie since that's a common product
        if (mockupMappings['bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie']) {
            return mockupMappings['bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie'];
        }
        
        return [];
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
        
        // Find the Shopify variant ID for the selected options
        let shopifyVariantId = null;
        if (this.currentProduct.variants) {
            const matchingVariant = this.currentProduct.variants.find(v =>
                v.color === this.selectedVariant.color &&
                v.size === this.selectedVariant.size
            );
            if (matchingVariant) {
                shopifyVariantId = matchingVariant.id;
            }
        }
        
        const cartItem = {
            ...this.currentProduct,
            selectedColor: this.selectedVariant.color,
            selectedSize: this.selectedVariant.size,
            quantity: this.selectedVariant.quantity,
            shopifyVariantId: shopifyVariantId
        };
        
        const variantData = {
            ...this.selectedVariant,
            shopifyVariantId: shopifyVariantId
        };
        
        if (window.cartManager) {
            window.cartManager.addItem(cartItem, variantData);
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
                    const shopifyImages = node.images.edges.map(imgEdge => imgEdge.node.url);
                    const localImages = this.getLocalMockupImages(node.handle, node.title);
                    const allImages = [...localImages, ...shopifyImages];
                    const minPrice = parseFloat(node.priceRange.minVariantPrice.amount);
                    const firstVariant = node.variants.edges[0]?.node;
                    const comparePrice = firstVariant?.compareAtPrice ? parseFloat(firstVariant.compareAtPrice.amount) : null;
                    
                    return {
                        id: node.handle,
                        title: node.title,
                        price: minPrice,
                        comparePrice: comparePrice,
                        mainImage: allImages[0] || '',
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