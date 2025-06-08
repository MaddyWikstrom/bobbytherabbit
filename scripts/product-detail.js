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

        updateThumbnailGrid() {
            const thumbnailGrid = document.querySelector('.thumbnail-grid');
            if (!thumbnailGrid) {
                console.error('❌ thumbnail-grid not found in DOM');
                return;
            }

            if (!Array.isArray(this.filteredImages)) {
                console.error('❌ filteredImages is not an array:', this.filteredImages);
                return;
            }

            thumbnailGrid.innerHTML = '';

            this.filteredImages.forEach((image, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
                thumbnail.setAttribute('onclick', `productDetailManager.changeImage(${index})`);

                const imgElement = document.createElement('img');
                imgElement.src = image;
                imgElement.alt = this.currentProduct?.title || 'Product Image';

                thumbnail.appendChild(imgElement);
                thumbnailGrid.appendChild(thumbnail);
            });

            // Safely update main image
            const mainImage = document.getElementById('main-image');
            if (mainImage && this.filteredImages.length > 0) {
                mainImage.src = this.filteredImages[0];
            }

            console.log(`✅ Updated thumbnail grid with ${this.filteredImages.length} images`);
        }

        // Other methods...
    }

    // Initialize product detail manager when document is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.productDetailManager = new ProductDetailManager();
    });