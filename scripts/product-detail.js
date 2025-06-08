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

        // Other methods...

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

        // Other methods...
    }

    // Initialize product detail manager when document is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.productDetailManager = new ProductDetailManager();
    });