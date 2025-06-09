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
        
        // Check for color in URL parameters before loading product
        const urlParams = new URLSearchParams(window.location.search);
        const colorFromUrl = urlParams.get('color');
        if (colorFromUrl) {
            console.log(`Found color parameter in URL: ${colorFromUrl}`);
        }
        
        // Load product data
        await this.loadProduct();
        
        // Setup event listeners last, after all data is loaded
        this.setupEventListeners();
        
        // Dispatch an event that product detail page is fully initialized
        document.dispatchEvent(new CustomEvent('productDetailInitialized', {
            detail: {
                productId: urlParams.get('id'),
                color: colorFromUrl
            }
        }));
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
                // Remove any existing event listeners by cloning and replacing the element
                const newIncrementBtn = incrementBtn.cloneNode(true);
                incrementBtn.parentNode.replaceChild(newIncrementBtn, incrementBtn);
                incrementBtn = newIncrementBtn;

                incrementBtn.addEventListener('click', (e) => {
                    // Use current value to avoid accumulation issues
                    const currentVal = parseInt(quantityInput.value) || 1;
                    const newValue = Math.min(currentVal + 1, 10);
                    console.log(`Incrementing quantity from ${currentVal} to ${newValue}`);
                    quantityInput.value = newValue;
                    this.selectedVariant.quantity = newValue;
                });
                
                // Remove any existing event listeners by cloning and replacing the element
                const newDecrementBtn = decrementBtn.cloneNode(true);
                decrementBtn.parentNode.replaceChild(newDecrementBtn, decrementBtn);
                decrementBtn = newDecrementBtn;

                decrementBtn.addEventListener('click', (e) => {
                    // Use current value to avoid accumulation issues
                    const currentVal = parseInt(quantityInput.value) || 1;
                    const newValue = Math.max(currentVal - 1, 1);
                    console.log(`Decrementing quantity from ${currentVal} to ${newValue}`);
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
                
                // Cleanup and validate the data from localStorage
                this.recentlyViewed = this.recentlyViewed
                    .filter(product => {
                        // Filter out invalid products
                        return product && product.id && product.title;
                    })
                    .map(product => {
                        // Fix any image URLs that might be missing protocols or are relative
                        // or might have the product URL instead of image URL
                        if (product.image && product.image.includes('product.html')) {
                            console.warn(`Found invalid image URL: ${product.image}`);
                            product.image = '/assets/product-placeholder.png';
                        } else if (product.image) {
                            product.image = this.ensureAbsoluteUrl(product.image);
                        } else {
                            product.image = '/assets/product-placeholder.png';
                        }
                        
                        // Make sure price is a number
                        if (typeof product.price !== 'number') {
                            product.price = parseFloat(product.price) || 0;
                        }
                        
                        return product;
                    });
                
                // Clean the data without excessive logging
            }
        } catch (error) {
            console.error('Error loading recently viewed products:', error);
            // Reset to empty array on error
            this.recentlyViewed = [];
        }
    }
    
    addToRecentlyViewed(product) {
        if (!product) return;
        
        // Remove if already exists
        this.recentlyViewed = this.recentlyViewed.filter(p => p.id !== product.id);
        
        // Add to front of array
        // Make sure we store absolute URLs for images - use mainImage or first image from images array
        let imageUrl = '';
        if (product.mainImage) {
            imageUrl = this.ensureAbsoluteUrl(product.mainImage);
        } else if (product.images && product.images.length > 0) {
            imageUrl = this.ensureAbsoluteUrl(product.images[0]);
        } else {
            imageUrl = '/assets/product-placeholder.png';
        }
        
        // Add product to recently viewed
        
        const productToAdd = {
            id: product.id,
            title: product.title,
            image: imageUrl,
            price: product.price
        };
        
        this.recentlyViewed.unshift(productToAdd);
        
        // Limit to 4 items
        this.recentlyViewed = this.recentlyViewed.slice(0, 4);
        
        // Save to localStorage
        try {
            localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
            // Successfully saved to localStorage
        } catch (error) {
            console.error('Error saving recently viewed products:', error);
        }
    }
    
    loadRelatedProducts() {
        // Add a style element to ensure product cards are properly styled with enhanced design
        const styleEl = document.createElement('style');
        styleEl.id = 'product-cards-styles';
        styleEl.textContent = `
            /* Reset any potential conflicting styles */
            .related-products, .recently-viewed {
                position: relative !important;
                overflow: hidden !important;
                z-index: 1 !important;
            }
            /* SVG for the wave pattern background */
            .wave-pattern-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0.07;
                z-index: 0;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3Cpath id='wave' fill='none' stroke='%23FFFFFF' stroke-width='1.5' d='M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 C1150,200 1350,0 1500,100 C1650,200 1850,0 2000,100 L2000,0 L0,0 Z' /%3E%3C/defs%3E%3Cg%3E%3Cuse href='%23wave' y='15' /%3E%3Cuse href='%23wave' y='45' /%3E%3Cuse href='%23wave' y='75' /%3E%3Cuse href='%23wave' y='105' /%3E%3Cuse href='%23wave' y='135' /%3E%3Cuse href='%23wave' y='165' /%3E%3Cuse href='%23wave' y='195' /%3E%3Cuse href='%23wave' y='225' /%3E%3Cuse href='%23wave' y='255' /%3E%3Cuse href='%23wave' y='285' /%3E%3Cuse href='%23wave' y='315' /%3E%3Cuse href='%23wave' y='345' /%3E%3Cuse href='%23wave' y='375' /%3E%3Cuse href='%23wave' y='405' /%3E%3Cuse href='%23wave' y='435' /%3E%3Cuse href='%23wave' y='465' /%3E%3Cuse href='%23wave' y='495' /%3E%3Cuse href='%23wave' y='525' /%3E%3Cuse href='%23wave' y='555' /%3E%3Cuse href='%23wave' y='585' /%3E%3Cuse href='%23wave' y='615' /%3E%3Cuse href='%23wave' y='645' /%3E%3Cuse href='%23wave' y='675' /%3E%3Cuse href='%23wave' y='705' /%3E%3C/g%3E%3C/svg%3E");
                animation: waveDrift 60s linear infinite;
            }

            @keyframes waveDrift {
                0% { background-position: 0% 0%; }
                100% { background-position: 100% 0%; }
            }

            /* Common styling for product cards in both related and recently viewed sections */
            .related-products-grid, .recently-viewed-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
                gap: 30px !important;
                margin: 20px auto !important;
                padding: 0 20px !important;
                justify-content: center !important;
                align-items: center !important;
                max-width: 1200px !important;
                position: relative !important;
                z-index: 2 !important;
                width: 100% !important;
                justify-items: center !important;
                place-content: center !important;
            }
            
            /* Ensure all section containers are properly sized and positioned */
            .related-products .container, .recently-viewed .container {
                width: 100% !important;
                max-width: 1200px !important;
                margin: 0 auto !important;
                position: relative !important;
                z-index: 2 !important;
            }
            
            /* Animation for the breathing warped pattern - optimized for responsive layout */
            @keyframes breathePattern {
                0% {
                    background-size: 100% 100%;
                    transform: scale(1);
                    filter: hue-rotate(0deg);
                    opacity: 0.06;
                }
                50% {
                    background-size: 105% 105%;
                    transform: scale(1.02);
                    filter: hue-rotate(10deg);
                    opacity: 0.08;
                }
                100% {
                    background-size: 100% 100%;
                    transform: scale(1);
                    filter: hue-rotate(0deg);
                    opacity: 0.06;
                }
            }
            
            /* Ensure the pattern fills the container on any screen size */
            @media screen and (max-width: 768px) {
                .wave-pattern-bg {
                    background-size: cover !important;
                    transform-origin: center center !important;
                }
                
                @keyframes breathePattern {
                    0% {
                        background-position: center center;
                        transform: scale(1);
                        filter: hue-rotate(0deg);
                        opacity: 0.06;
                    }
                    50% {
                        background-position: center center;
                        transform: scale(1.03);
                        filter: hue-rotate(10deg);
                        opacity: 0.08;
                    }
                    100% {
                        background-position: center center;
                        transform: scale(1);
                        filter: hue-rotate(0deg);
                        opacity: 0.06;
                    }
                }
            }
            
            /* Warped breathing pattern styling */
            .wave-pattern-bg {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                opacity: 0.08 !important;
                z-index: 1 !important;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' preserveAspectRatio='none' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3Cfilter id='distortion' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01 0.02' numOctaves='2' result='noise' seed='5'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='noise' scale='30' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Cmask id='contourMask'%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Cg filter='url(%23distortion)'%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,400 C100,250 300,550 500,400 C700,250 900,550 1100,400 C1300,250 1500,550 1700,400' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,350 C100,200 300,500 500,350 C700,200 900,500 1100,350 C1300,200 1500,500 1700,350' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,300 C100,150 300,450 500,300 C700,150 900,450 1100,300 C1300,150 1500,450 1700,300' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,250 C100,100 300,400 500,250 C700,100 900,400 1100,250 C1300,100 1500,400 1700,250' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,200 C100,50 300,350 500,200 C700,50 900,350 1100,200 C1300,50 1500,350 1700,200' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,150 C100,0 300,300 500,150 C700,0 900,300 1100,150 C1300,0 1500,300 1700,150' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,100 C100,-50 300,250 500,100 C700,-50 900,250 1100,100 C1300,-50 1500,250 1700,100' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,50 C100,-100 300,200 500,50 C700,-100 900,200 1100,50 C1300,-100 1500,200 1700,50' /%3E%3C/g%3E%3C/mask%3E%3ClinearGradient id='grayGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23aaaaaa' /%3E%3Cstop offset='50%25' stop-color='%23888888' /%3E%3Cstop offset='100%25' stop-color='%23555555' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grayGrad)' mask='url(%23contourMask)' /%3E%3C/svg%3E") !important;
                background-size: cover !important;
                background-position: center center !important;
                background-repeat: no-repeat !important;
                animation: breathePattern 15s ease-in-out infinite alternate !important;
            }
            
            .related-product {
                border: 1px solid rgba(168, 85, 247, 0.2) !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                transition: transform 0.3s ease, box-shadow 0.3s ease !important;
                cursor: pointer !important;
                background-color: #181830 !important;
                display: flex !important;
                flex-direction: column !important;
                height: 100% !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
                position: relative !important;
                z-index: 1 !important;
                width: 100% !important;
                max-width: 220px !important;
                margin: 0 auto !important;
            }
            
            .related-product:hover {
                transform: translateY(-5px) !important;
                box-shadow: 0 10px 15px rgba(168, 85, 247, 0.2) !important;
                border-color: rgba(168, 85, 247, 0.4) !important;
            }
            
            .related-product img {
                width: 100% !important;
                aspect-ratio: 1 !important;
                object-fit: cover !important;
                display: block !important;
                min-height: 180px !important;
                background-color: #ffffff !important; /* WHITE background for images as requested */
            }
            
            .related-product-info {
                padding: 12px !important;
                flex-grow: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                background-color: #181830 !important;
                text-align: center !important;
            }
            
            .related-product-info h4 {
                font-size: 16px !important;
                margin-top: 0 !important;
                margin-bottom: 8px !important;
                font-weight: 500 !important;
                color: #ffffff !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
            }
            
            .related-product-info span {
                font-weight: 600 !important;
                color: rgba(255, 255, 255, 0.8) !important;
            }
            
            /* Ensure images have appropriate fallback colors */
            .related-product img[src=""],
            .related-product img:not([src]) {
                background-color: #ffffff !important;
                min-height: 180px !important;
            }
            
            /* Enhanced section styling with warped pattern */
            .related-products, .recently-viewed {
                background-color: #13132b !important;
                background-image: linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05)) !important;
                padding: 3rem 0 !important;
                margin-top: 2rem !important;
                position: relative !important;
                overflow: hidden !important;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05) !important;
                border-top: 1px solid rgba(168, 85, 247, 0.2) !important;
                border-bottom: 1px solid rgba(168, 85, 247, 0.2) !important;
                transition: all 0.5s ease !important;
                width: 100% !important;
                box-sizing: border-box !important;
                text-align: center !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
            }
            
            .related-products:hover, .recently-viewed:hover {
                box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.07) !important;
                transform: translateY(-2px) !important;
            }
            
            .section-title {
                color: #ffffff !important;
                margin-bottom: 2rem !important;
                text-align: center !important;
                font-size: 2rem !important;
                position: relative !important;
                z-index: 3 !important;
                font-weight: 700 !important;
                letter-spacing: 2px !important;
                text-transform: uppercase !important;
                display: flex !important;
                width: 100% !important;
                padding: 15px 0 !important;
                justify-content: center !important;
            }
            
            /* Using the same glitch effect as the main page */
            .glitch-text {
                position: relative !important;
                display: inline-block !important;
                color: #ffffff !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                letter-spacing: 2px !important;
            }
            
            .glitch-text::before,
            .glitch-text::after {
                content: attr(data-text) !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
            
            .glitch-text::before {
                animation: glitch-1 0.5s infinite !important;
                color: #a855f7 !important; /* Purple color */
                z-index: -1 !important;
            }
            
            .glitch-text::after {
                animation: glitch-2 0.5s infinite !important;
                color: #6366f1 !important; /* Indigo color */
                z-index: -2 !important;
            }
            
            /* Main page glitch animations */
            @keyframes glitch-1 {
                0%, 14%, 15%, 49%, 50%, 99%, 100% {
                    transform: translate(0) !important;
                }
                15%, 49% {
                    transform: translate(-2px, -1px) !important;
                }
            }
            
            @keyframes glitch-2 {
                0%, 20%, 21%, 62%, 63%, 99%, 100% {
                    transform: translate(0) !important;
                }
                21%, 62% {
                    transform: translate(2px, 1px) !important;
                }
            }
            
            /* Fix for main product image */
            .main-image img {
                background-color: #ffffff !important;
            }
            
            /* Container for better centering */
            .related-products .container, .recently-viewed .container {
                position: relative !important;
                z-index: 2 !important;
                max-width: 1200px !important;
                margin: 0 auto !important;
                padding: 0 20px !important;
                width: 100% !important;
            }
            
            /* No products message styling */
            .no-products {
                color: #ffffff !important;
                text-align: center !important;
                padding: 30px !important;
                font-size: 18px !important;
                background-color: rgba(24, 24, 48, 0.5) !important;
                border-radius: 8px !important;
                margin: 20px auto !important;
                max-width: 600px !important;
            }
        `;
        document.head.appendChild(styleEl);
        
        // Add responsive warped breathing pattern backgrounds to the sections
        const relatedSection = document.querySelector('.related-products');
        const recentlyViewedSection = document.querySelector('.recently-viewed');
        
        // Function to add a full-width wave pattern background
        const addResponsivePattern = (section, animationDelay = '0s') => {
            if (!section) return;
            
            // Remove any existing pattern first
            const existingPattern = section.querySelector('.wave-pattern-bg');
            if (existingPattern) {
                existingPattern.remove();
            }
            
            // Ensure section has proper positioning
            section.style.position = 'relative';
            section.style.overflow = 'hidden';
            section.style.width = '100%';
            
            // Create and add pattern background
            const patternElement = document.createElement('div');
            patternElement.className = 'wave-pattern-bg';
            
            // Apply styles for full-width coverage
            patternElement.style.position = 'absolute';
            patternElement.style.top = '0';
            patternElement.style.left = '0';
            patternElement.style.width = '100%';
            patternElement.style.height = '100%';
            patternElement.style.backgroundSize = 'cover';
            patternElement.style.backgroundPosition = 'center center';
            patternElement.style.backgroundRepeat = 'no-repeat';
            patternElement.style.animationDelay = animationDelay;
            patternElement.style.zIndex = '1';
            
            // Add pattern element as first child
            section.prepend(patternElement);
            
            // Ensure all direct children except the pattern have higher z-index
            Array.from(section.children).forEach(child => {
                if (child !== patternElement) {
                    child.style.position = 'relative';
                    child.style.zIndex = '2';
                }
            });
        };
        
        // Add patterns to both sections
        addResponsivePattern(relatedSection);
        addResponsivePattern(recentlyViewedSection, '-5s'); // Different animation delay for variety
        
        this.renderProductCards();
    }
    
    renderProductCards() {
        // Render product cards
        
        // First render the "You Might Also Like" section with recommended products
        const relatedContainer = document.getElementById('related-products-grid');
        if (relatedContainer) {
            this.renderRecommendedProducts(relatedContainer);
        } else {
            console.warn('Related products container not found');
        }
        
        // Then render the "Recently Viewed" section
        const recentlyViewedContainer = document.getElementById('recently-viewed-grid');
        if (recentlyViewedContainer) {
            this.renderProductsToContainer(recentlyViewedContainer);
        } else {
            console.warn('Recently viewed container not found');
        }
        
        // Update section titles to use the glitch-text structure
        const sectionTitles = document.querySelectorAll('.section-title');
        sectionTitles.forEach(title => {
            // Get the current title text
            const titleText = title.textContent.trim();
            
            // Create the new structure with glitch effect
            title.innerHTML = `<span class="glitch-text" data-text="${titleText}">${titleText}</span>`;
        });
    }
    
    // Simple function to show random product recommendations
    renderRecommendedProducts(container) {
        try {
            // Just use the product list from homepage as the source of recommendations
            this.loadRandomProducts().then(randomProducts => {
                // Clear the container
                container.innerHTML = '';
                
                // Apply grid styling
                container.style.display = 'grid';
                container.style.justifyItems = 'center';
                container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
                container.style.gap = '30px';
                container.style.margin = '0 auto';
                container.style.position = 'relative';
                container.style.zIndex = '2';
                container.style.placeContent = 'center';
                container.style.justifyContent = 'center';
                container.style.alignItems = 'start';
                container.style.maxWidth = '1200px';
                container.style.padding = '0 20px';
                
                // If we got random products, display them
                if (randomProducts && randomProducts.length > 0) {
                    randomProducts.forEach(product => {
                        try {
                            // Create product container
                            const productDiv = document.createElement('div');
                            productDiv.className = 'related-product';
                            productDiv.dataset.productId = product.id;
                            
                            // Prepare image URL
                            let imageUrl = product.mainImage || product.image || '/assets/product-placeholder.png';
                            imageUrl = this.ensureAbsoluteUrl(imageUrl);
                            
                            // Create and append image
                            const img = document.createElement('img');
                            img.alt = product.title;
                            img.style.backgroundColor = '#ffffff';
                            img.style.minHeight = '180px';
                            img.style.objectFit = 'contain';
                            img.style.padding = '5px';
                            
                            // Error handling
                            img.onerror = function() {
                                this.src = '/assets/product-placeholder.png';
                                this.style.backgroundColor = '#ffffff';
                            };
                            
                            img.src = imageUrl;
                            
                            // Create product info container
                            const infoDiv = document.createElement('div');
                            infoDiv.className = 'related-product-info';
                            
                            // Add title
                            const titleEl = document.createElement('h4');
                            titleEl.textContent = product.title;
                            
                            // Add price
                            const priceEl = document.createElement('span');
                            priceEl.textContent = `$${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}`;
                            
                            // Assemble the elements
                            infoDiv.appendChild(titleEl);
                            infoDiv.appendChild(priceEl);
                            
                            productDiv.appendChild(img);
                            productDiv.appendChild(infoDiv);
                            
                            // Add event listener
                            productDiv.addEventListener('click', () => {
                                window.location.href = `product.html?id=${product.id}`;
                            });
                            
                            // Append to container
                            container.appendChild(productDiv);
                            
                            // Add border and box shadow
                            productDiv.style.border = '1px solid rgba(168, 85, 247, 0.2)';
                            productDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                            
                        } catch (error) {
                            console.error(`Error creating related product element:`, error);
                        }
                    });
                } else {
                    // Just in case we still couldn't get products, create some fake ones
                    this.createFallbackProducts(container);
                }
            });
        } catch (error) {
            console.error('Error rendering recommended products:', error);
            // If anything fails, create fallback products
            this.createFallbackProducts(container);
        }
    }
    
    // Create fallback product recommendations if everything else fails
    createFallbackProducts(container) {
        // Hardcoded fallback products - generic streetwear items
        const fallbacks = [
            { id: 'hoodie-black', title: 'Black Hoodie', price: 59.99, image: '/assets/hoodie-black.png' },
            { id: 'hoodie-white', title: 'White Hoodie', price: 59.99, image: '/assets/hoodie-white.png' },
            { id: 'hoodie-navy', title: 'Navy Hoodie', price: 59.99, image: '/assets/hoodie-navy.png' },
            { id: 'hoodie-maroon', title: 'Maroon Hoodie', price: 59.99, image: '/assets/hoodie-maroon.png' }
        ];
        
        // Display the fallback products
        fallbacks.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'related-product';
            productDiv.dataset.productId = product.id;
            
            const img = document.createElement('img');
            img.src = product.image;
            img.alt = product.title;
            img.style.backgroundColor = '#ffffff';
            img.style.minHeight = '180px';
            img.style.objectFit = 'contain';
            img.style.padding = '5px';
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'related-product-info';
            
            const titleEl = document.createElement('h4');
            titleEl.textContent = product.title;
            
            const priceEl = document.createElement('span');
            priceEl.textContent = `$${product.price.toFixed(2)}`;
            
            infoDiv.appendChild(titleEl);
            infoDiv.appendChild(priceEl);
            
            productDiv.appendChild(img);
            productDiv.appendChild(infoDiv);
            
            productDiv.style.border = '1px solid rgba(168, 85, 247, 0.2)';
            productDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            
            container.appendChild(productDiv);
        });
    }
    
    // Simple function to load random products
    async loadRandomProducts() {
        try {
            // Try to fetch products from the Shopify API first
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            
            const data = await response.json();
            let products = [];
            
            // Parse products from the response
            if (data.products && Array.isArray(data.products)) {
                products = data.products.map(p => this.convertShopifyProduct(p.node || p));
            } else if (Array.isArray(data)) {
                // Use the method that exists in this class
                products = data.map(p => {
                    const productNode = p.node || p;
                    return {
                        id: productNode.handle || productNode.id,
                        title: productNode.title || 'Unknown Product',
                        price: parseFloat(productNode.priceRange?.minVariantPrice?.amount || productNode.price || 0),
                        image: productNode.images?.edges?.[0]?.node?.url || productNode.image || '/assets/product-placeholder.png',
                        mainImage: productNode.images?.edges?.[0]?.node?.url || productNode.image || '/assets/product-placeholder.png'
                    };
                });
            }
            
            // No products found
            if (!products || products.length === 0) {
                throw new Error('No products found');
            }
            
            // Filter out the current product and recently viewed products
            const currentProductId = this.currentProduct?.id;
            const recentlyViewedIds = this.recentlyViewed.map(p => p.id);
            
            let filteredProducts = products.filter(p =>
                p.id !== currentProductId && !recentlyViewedIds.includes(p.id)
            );
            
            // If we don't have enough filtered products, just use all products except current
            if (filteredProducts.length < 4) {
                filteredProducts = products.filter(p => p.id !== currentProductId);
            }
            
            // If we still don't have enough, use all products including current
            if (filteredProducts.length < 4) {
                filteredProducts = products;
            }
            
            // Shuffle the products to get random ones
            return this.shuffleArray(filteredProducts).slice(0, 4);
            
        } catch (error) {
            console.error('Error loading random products:', error);
            return [];
        }
    }
    
    // Utility function to shuffle an array (Fisher-Yates algorithm)
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    renderProductsToContainer(container) {
        if (this.recentlyViewed.length > 0) {
            // Clear the container
            container.innerHTML = '';
            
            // No need to check for existing patterns at container level since we're applying at section level
            
            // Apply grid styling directly with improved centering
            container.style.display = 'grid';
            container.style.justifyItems = 'center';
            container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
            container.style.gap = '30px';
            container.style.margin = '0 auto';
            container.style.position = 'relative';
            container.style.zIndex = '2';
            container.style.placeContent = 'center';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'start';
            container.style.maxWidth = '1200px';
            container.style.padding = '0 20px';
            
            // Loop through each product and create elements manually instead of using innerHTML
            this.recentlyViewed.forEach(product => {
                try {
                    // Create product container
                    const productDiv = document.createElement('div');
                    productDiv.className = 'related-product';
                    productDiv.dataset.productId = product.id;
                    
                    // Prepare image URL
                    let imageUrl = '/assets/product-placeholder.png'; // Default fallback image
                    
                    if (product.image) {
                        imageUrl = this.ensureAbsoluteUrl(product.image);
                    } else {
                        // Silently fall back to placeholder instead of logging
                        imageUrl = '/assets/product-placeholder.png';
                    }
                    
                    // Create and append image
                    const img = document.createElement('img');
                    img.alt = product.title;
                    img.style.backgroundColor = '#ffffff'; // WHITE background for all product images
                    img.style.minHeight = '180px';
                    img.style.objectFit = 'contain';
                    img.style.padding = '5px'; // Add slight padding for better presentation
                    
                    // Improved error handling
                    img.onerror = function() {
                        this.src = '/assets/product-placeholder.png';
                        this.style.backgroundColor = '#ffffff';
                    };
                    
                    // Set src after defining onerror to ensure handler catches loading issues
                    img.src = imageUrl;
                    
                    // Create product info container
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'related-product-info';
                    
                    // Add title
                    const titleEl = document.createElement('h4');
                    titleEl.textContent = product.title;
                    
                    // Add price
                    const priceEl = document.createElement('span');
                    priceEl.textContent = `$${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}`;
                    
                    // Assemble the elements
                    infoDiv.appendChild(titleEl);
                    infoDiv.appendChild(priceEl);
                    
                    productDiv.appendChild(img);
                    productDiv.appendChild(infoDiv);
                    
                    // Add event listener
                    productDiv.addEventListener('click', () => {
                        window.location.href = `product.html?id=${product.id}`;
                    });
                    
                    // Append to container
                    container.appendChild(productDiv);
                    
                    // Add border and box shadow to make images pop more on dark background
                    productDiv.style.border = '1px solid rgba(168, 85, 247, 0.2)';
                    productDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                    
                    // Force browser to acknowledge the image
                    window.setTimeout(() => {
                        img.style.display = 'none';
                        img.offsetHeight; // Force reflow
                        img.style.display = 'block';
                        
                        // Additional check to ensure image is loaded
                        if (!img.complete || img.naturalWidth === 0) {
                            console.warn(`Image not loaded yet for ${product.title}, retrying...`);
                            img.src = imageUrl + '?t=' + new Date().getTime(); // Add cache buster
                        }
                    }, 10);
                    
                } catch (error) {
                    console.error(`Error creating related product element for ${product.title}:`, error);
                }
            });
            
        } else {
            // Add a styled "No products found" message with better visibility
            container.innerHTML = `
                <div class="no-products" style="color: white; text-align: center; padding: 30px;
                     background-color: rgba(24, 24, 48, 0.5); border-radius: 8px;
                     margin: 20px auto; max-width: 600px; grid-column: 1 / -1;
                     position: relative; z-index: 2; border: 1px solid rgba(168, 85, 247, 0.2);">
                    <p>No products viewed yet. Start browsing our collection!</p>
                    <a href="products.html" style="display: inline-block; margin-top: 15px; padding: 8px 16px;
                       background: linear-gradient(45deg, #a855f7, #6366f1); color: white; text-decoration: none;
                       border-radius: 4px; font-weight: bold; transition: all 0.3s ease;">
                       Browse Products
                    </a>
                </div>`;
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
            
            // Handle missing images and ensure absolute URLs
            let images = [];
            if (product.images) {
                if (product.images.edges) {
                    // GraphQL API format
                    images = product.images.edges.map(imgEdge => this.ensureAbsoluteUrl(imgEdge.node.url));
                } else if (Array.isArray(product.images)) {
                    // REST API format
                    images = product.images.map(img => this.ensureAbsoluteUrl(img.src || img.url || img));
                } else if (typeof product.images === 'string') {
                    // Simple string format
                    images = [this.ensureAbsoluteUrl(product.images)];
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
                        const imageUrl = this.ensureAbsoluteUrl(variant.image.url || variant.image.src || variant.image);
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
                            this.ensureAbsoluteUrl(variant.image.url || variant.image.src || variant.image) : (images[0] || '')
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
            
            // Enhanced image processing: associate images with colors
            // Go through all images and try to determine which color they belong to
            for (const imgUrl of images) {
                const imgUrlLower = imgUrl.toLowerCase();
                
                // Try to match images to colors using URL patterns
                for (const color of colors) {
                    const colorLower = color.toLowerCase();
                    
                    // Check for color in URL patterns
                    if (imgUrlLower.includes(`/${colorLower}`) ||
                        imgUrlLower.includes(`_${colorLower}`) ||
                        imgUrlLower.includes(`-${colorLower}`) ||
                        imgUrlLower.includes(`${colorLower}_`) ||
                        imgUrlLower.includes(`${colorLower}-`) ||
                        imgUrlLower.includes(`color=${colorLower}`) ||
                        imgUrlLower.includes(`variant=${colorLower}`) ||
                        imgUrlLower.includes(colorLower)) {
                        
                        if (!colorToImagesMap.has(color)) {
                            colorToImagesMap.set(color, []);
                        }
                        
                        // Only add image if it's not already in the array
                        if (!colorToImagesMap.get(color).includes(imgUrl)) {
                            colorToImagesMap.get(color).push(imgUrl);
                        }
                    }
                }
            }
            
            // Special handling for multi-word colors (e.g., "forest green", "heather gray")
            if (colors.size > 0) {
                // Create normalized versions of multi-word colors for better matching
                const multiWordColors = Array.from(colors).filter(c => c.includes(' '));
                
                for (const multiWordColor of multiWordColors) {
                    const colorParts = multiWordColor.toLowerCase().split(/\s+/);
                    const colorWithHyphen = colorParts.join('-');
                    const colorWithUnderscore = colorParts.join('_');
                    const colorNoSpace = colorParts.join('');
                    
                    // For each image, check if it might belong to this multi-word color
                    for (const imgUrl of images) {
                        const imgUrlLower = imgUrl.toLowerCase();
                        
                        // Check for variations of the multi-word color in the URL
                        if (imgUrlLower.includes(colorWithHyphen) ||
                            imgUrlLower.includes(colorWithUnderscore) ||
                            imgUrlLower.includes(colorNoSpace)) {
                            
                            if (!colorToImagesMap.has(multiWordColor)) {
                                colorToImagesMap.set(multiWordColor, []);
                            }
                            
                            if (!colorToImagesMap.get(multiWordColor).includes(imgUrl)) {
                                colorToImagesMap.get(multiWordColor).push(imgUrl);
                                console.log(`Added image to multi-word color "${multiWordColor}" using format match: ${imgUrl}`);
                            }
                        }
                        // Check if all color parts are present in the URL
                        else if (colorParts.every(part => imgUrlLower.includes(part) && part.length > 2)) {
                            if (!colorToImagesMap.has(multiWordColor)) {
                                colorToImagesMap.set(multiWordColor, []);
                            }
                            
                            if (!colorToImagesMap.get(multiWordColor).includes(imgUrl)) {
                                colorToImagesMap.get(multiWordColor).push(imgUrl);
                                console.log(`Added image to multi-word color "${multiWordColor}" using part match: ${imgUrl}`);
                            }
                        }
                    }
                }
            }
            
            // If a color has no images yet, try to find a matching variant image
            for (const color of colors) {
                if (!colorToImagesMap.has(color) || colorToImagesMap.get(color).length === 0) {
                    // Find variants with this color
                    const matchingVariants = variants.filter(v => v.color === color);
                    
                    if (matchingVariants.length > 0) {
                        colorToImagesMap.set(color, []);
                        
                        // Add images from matching variants
                        for (const variant of matchingVariants) {
                            if (variant.image && !colorToImagesMap.get(color).includes(variant.image)) {
                                colorToImagesMap.get(color).push(variant.image);
                            }
                        }
                    }
                }
            }
            
            // If after all this, a color still has no images, add all product images as fallback
            for (const color of colors) {
                if (!colorToImagesMap.has(color) || colorToImagesMap.get(color).length === 0) {
                    colorToImagesMap.set(color, [...images]);
                }
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
            
            // Process images for product conversion
            
            // Create the converted product
            const convertedProduct = {
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
            
            return convertedProduct;
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
                
                // For testing purposes only - comment out in production
                // console.log('Clearing recently viewed for testing');
                // localStorage.removeItem('recentlyViewed');
                
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
                
                // Set default size for products without size options
                if (!this.currentProduct.sizes || this.currentProduct.sizes.length === 0) {
                    console.log('Product has no size options, automatically selecting "One Size"');
                    this.selectedVariant.size = "One Size";
                }
                
                // Always select the first color by default
                if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
                    const firstColor = this.currentProduct.colors[0];
                    const defaultColorName = typeof firstColor === 'object' ? firstColor.name : firstColor;
                    
                    // Try to use the selected color from URL if it exists in product colors
                    if (selectedColor) {
                        // Ensure the selectedColor is properly decoded from the URL
                        let decodedColor = decodeURIComponent(selectedColor);
                        let foundMatchingColor = false;
                        
                        console.log(`Attempting to match URL color parameter: ${decodedColor}`);
                        
                        // Create a color-to-image map for quick lookup
                        const availableColors = new Map();
                        this.currentProduct.colors.forEach(color => {
                            const colorName = typeof color === 'object' ? color.name : color;
                            availableColors.set(colorName.toLowerCase(), colorName);
                        });
                        
                        // Try direct case-insensitive lookup in our map
                        const exactMatch = availableColors.get(decodedColor.toLowerCase());
                        if (exactMatch) {
                            console.log(`Found exact match for color: ${exactMatch}`);
                            this.selectColor(exactMatch);
                            foundMatchingColor = true;
                        }
                        
                        // If no exact match, try a more lenient matching approach with partial matching
                        if (!foundMatchingColor) {
                            console.log(`No exact match found for ${decodedColor}, trying partial matches`);
                            
                            // Try partial matching (useful for multi-word colors or alternate formats)
                            const decodedColorLower = decodedColor.toLowerCase();
                            
                            // Look through all available colors
                            for (const [availableColorLower, originalColorName] of availableColors) {
                                // Check if selected color is a substring of a color or vice versa
                                if (availableColorLower.includes(decodedColorLower) ||
                                    decodedColorLower.includes(availableColorLower)) {
                                    console.log(`Found partial match: ${originalColorName} for requested ${decodedColor}`);
                                    this.selectColor(originalColorName);
                                    foundMatchingColor = true;
                                    break;
                                }
                            }
                        }
                        
                        // Try a more advanced matching approach if still no match
                        if (!foundMatchingColor) {
                            console.log(`No partial match found for ${decodedColor}, trying normalized matching`);
                            
                            // Normalize the selected color (remove spaces, make lowercase)
                            const normalizedSelectedColor = decodedColor.toLowerCase()
                                .replace(/[\s-_]/g, '')                  // Remove spaces, dashes, underscores
                                .replace(/\(.*?\)/g, '')                // Remove anything in parentheses
                                .replace(/v\d+$/, '')                   // Remove version numbers like "v1", "v2"
                                .replace(/variant\d*$/, '');            // Remove "variant" or "variant1", etc.
                            
                            // Create normalized versions of all available colors for matching
                            const normalizedColorMap = new Map();
                            
                            for (const [availableColorLower, originalColorName] of availableColors) {
                                const normalizedAvailableColor = availableColorLower
                                    .replace(/[\s-_]/g, '')
                                    .replace(/\(.*?\)/g, '')
                                    .replace(/v\d+$/, '')
                                    .replace(/variant\d*$/, '');
                                    
                                normalizedColorMap.set(normalizedAvailableColor, originalColorName);
                            }
                            
                            // Try to find a normalized match
                            const normalizedMatch = normalizedColorMap.get(normalizedSelectedColor);
                            if (normalizedMatch) {
                                console.log(`Found normalized match: ${normalizedMatch} for requested ${decodedColor}`);
                                this.selectColor(normalizedMatch);
                                foundMatchingColor = true;
                            }
                        }
                        
                        // Try even more aggressive matching if still no match - word extraction approach
                        if (!foundMatchingColor) {
                            console.log(`No normalized match found for ${decodedColor}, trying color word extraction`);
                            
                            // Extract primary color words from the selected color
                            const commonColorWords = [
                                'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink',
                                'orange', 'brown', 'gray', 'grey', 'navy', 'teal', 'olive', 'maroon',
                                'indigo', 'violet', 'turquoise', 'cyan', 'magenta', 'lime', 'coral',
                                'gold', 'silver', 'ivory', 'beige', 'tan', 'khaki', 'charcoal', 'blazer'
                            ];
                            
                            // Extract main color words from the selected color
                            const selectedColorWords = decodedColor.toLowerCase().split(/[\s-_]+/)
                                .filter(word => commonColorWords.includes(word));
                            
                            if (selectedColorWords.length > 0) {
                                // Create a scoring system - match colors that have the most words in common
                                let bestMatch = null;
                                let highestScore = 0;
                                
                                for (const [availableColorLower, originalColorName] of availableColors) {
                                    let score = 0;
                                    const availableColorWords = availableColorLower.split(/[\s-_]+/);
                                    
                                    // Calculate a score based on word matches
                                    for (const word of selectedColorWords) {
                                        if (availableColorLower.includes(word)) {
                                            score += 1;
                                        }
                                    }
                                    
                                    // Also count words from available color that appear in selected color
                                    for (const word of availableColorWords) {
                                        if (commonColorWords.includes(word) && decodedColor.toLowerCase().includes(word)) {
                                            score += 0.5; // Lower weight for this direction
                                        }
                                    }
                                    
                                    // Update best match if we found a better score
                                    if (score > highestScore) {
                                        highestScore = score;
                                        bestMatch = originalColorName;
                                    }
                                }
                                
                                if (bestMatch && highestScore > 0) {
                                    console.log(`Found color word match: ${bestMatch} for requested ${decodedColor} (score: ${highestScore})`);
                                    this.selectColor(bestMatch);
                                    foundMatchingColor = true;
                                }
                            }
                        }
                        
                        // If still no match, use the default first color with improved error reporting
                        if (!foundMatchingColor) {
                            console.log(`No match found for color: ${decodedColor} among ${Array.from(availableColors.values()).join(', ')}`);
                            console.log(`Defaulting to: ${defaultColorName}`);
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
                                
                                // This approach provides dual color support:
                                // 1. CSS variables for predefined colors via data-color attribute
                                // 2. Inline background-color for dynamically generated colors
                                return `
                                    <div class="color-option"
                                        data-color="${colorName}"
                                        style="background-color: ${colorCode}"
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
                    ` : `
                        <div class="sizes-header">
                            <h3>Size:</h3>
                        </div>
                        <div id="size-options" class="options-container">
                            <div class="size-option active" data-size="One Size">One Size</div>
                        </div>
                    `}
                    
                    <div class="quantity-controls">
                        <span>Quantity: </span>
                        <div class="quantity-btn-group">
                            <button id="decrement" class="quantity-btn">-</button>
                            <input type="number" id="quantity" min="1" max="10" value="1">
                            <button id="increment" class="quantity-btn">+</button>
                        </div>
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
            
            // Trigger an event to notify that product detail rendering is complete
            document.dispatchEvent(new CustomEvent('productDetailRendered'));
            
            // Initialize size guide if the global function is available
            if (window.SizeGuide && typeof window.SizeGuide.init === 'function') {
                window.SizeGuide.init();
            }
            
            
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
            
            console.log(`Selecting color: ${color}`);
            
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
            
            // Special handling for multi-word colors with spaces like "forest green" or "heather gray"
            const isMultiWordColor = color.includes(' ');
            console.log(`Color "${color}" is multi-word: ${isMultiWordColor}`);
            
            // Prepare alternate color name formats for lookup
            let colorVariations = [color.toLowerCase()];
            
            if (isMultiWordColor) {
                const colorParts = color.toLowerCase().split(/\s+/);
                colorVariations = [
                    ...colorVariations,
                    colorParts.join('-'),    // e.g., "forest-green"
                    colorParts.join('_'),    // e.g., "forest_green"
                    colorParts.join(''),     // e.g., "forestgreen"
                    // Reverse word order variations
                    [...colorParts].reverse().join(' '),  // e.g., "green forest"
                    [...colorParts].reverse().join('-'),  // e.g., "green-forest"
                    [...colorParts].reverse().join('_')   // e.g., "green_forest"
                ];
                console.log(`Generated color variations for "${color}":`, colorVariations);
            }
            
            // Helper function to deduplicate image URLs for the selected color
            const deduplicateImages = (images) => {
                if (!images || images.length === 0) return [];
                
                // Step 1: Create a set of unique image URLs to remove exact duplicates
                const uniqueUrls = new Set(images);
                
                // Step 2: Group similar images based on filename patterns
                const groupedImages = new Map();
                
                // Extract useful parts from URL for image identification
                const getImageIdentifier = (url) => {
                    try {
                        const urlObj = new URL(url, window.location.origin);
                        const path = urlObj.pathname;
                        const filename = path.split('/').pop() || '';
                        
                        // Remove file extension and query parameters
                        let baseName = filename.split('.')[0] || '';
                        
                        // Remove variant markers that might cause incorrect grouping
                        baseName = baseName.replace(/[-_](front|back|side|detail|alt\d*|[0-9]+)$/i, '');
                        
                        return baseName;
                    } catch (e) {
                        // If URL parsing fails, return the original URL
                        return url;
                    }
                };
                
                // Group images by their base identifier
                Array.from(uniqueUrls).forEach(imgUrl => {
                    const identifier = getImageIdentifier(imgUrl);
                    
                    if (!groupedImages.has(identifier)) {
                        groupedImages.set(identifier, []);
                    }
                    
                    groupedImages.get(identifier).push(imgUrl);
                });
                
                // Step 3: Keep only distinct views for each product color to reduce redundancy
                // While preserving important angle variations (front, back, side)
                const dedupedImages = [];
                const maxImagesPerGroup = 4; // Limit to maximum 4 images per color/pattern to avoid overwhelming gallery
                
                groupedImages.forEach((urls, identifier) => {
                    // If there's only one image in the group, keep it
                    if (urls.length === 1) {
                        dedupedImages.push(urls[0]);
                        return;
                    }
                    
                    // For groups with multiple images, try to identify and keep different views
                    const viewPatterns = ['front', 'back', 'side', 'detail', 'angle', 'closeup', 'full'];
                    const foundViews = new Set();
                    const remainingUrls = [...urls];
                    const viewImages = [];
                    
                    // First pass: find images with clearly identified views
                    for (const pattern of viewPatterns) {
                        // Find an image with this view pattern
                        const matchIndex = remainingUrls.findIndex(url =>
                            url.toLowerCase().includes(pattern)
                        );
                        
                        if (matchIndex !== -1) {
                            viewImages.push(remainingUrls[matchIndex]);
                            foundViews.add(pattern);
                            remainingUrls.splice(matchIndex, 1);
                            
                            // Stop if we've reached our limit
                            if (viewImages.length >= maxImagesPerGroup) break;
                        }
                    }
                    
                    // If we found specific views, add them
                    if (viewImages.length > 0) {
                        viewImages.forEach(img => dedupedImages.push(img));
                        
                        // If we still have room and remaining images, add one more for completeness
                        if (viewImages.length < maxImagesPerGroup && remainingUrls.length > 0) {
                            dedupedImages.push(remainingUrls[0]);
                        }
                    } else {
                        // No specific views found, just use a subset of the images
                        // Only take up to maxImagesPerGroup to avoid duplication
                        urls.slice(0, maxImagesPerGroup).forEach(url => dedupedImages.push(url));
                    }
                });
                
                // Only log if we actually deduplicated something
                if (dedupedImages.length < images.length) {
                    console.log(`Deduplicated from ${images.length} to ${dedupedImages.length} images for color: ${color}`);
                }
                
                return dedupedImages;
            };
            
            // Try to find color images
            let colorImagesFound = false;
            let colorImages = [];
            
            // Check if we have a colorImages map in the product data
            if (this.currentProduct.colorImages) {
                // First try direct match
                if (this.currentProduct.colorImages[color]) {
                    colorImages = this.currentProduct.colorImages[color];
                    colorImagesFound = true;
                    console.log(`Found direct match for color "${color}" with ${colorImages.length} images`);
                } else {
                    // Try case-insensitive match and variations for multi-word colors
                    for (const [key, images] of Object.entries(this.currentProduct.colorImages)) {
                        const keyLower = key.toLowerCase();
                        
                        // Try each variation of the color name
                        if (colorVariations.some(variation => keyLower === variation)) {
                            colorImages = images;
                            colorImagesFound = true;
                            console.log(`Found match for color "${color}" using variation in key "${key}" with ${images.length} images`);
                            break;
                        }
                        
                        // For multi-word colors, also try checking if all parts are in the key
                        if (isMultiWordColor) {
                            const colorParts = color.toLowerCase().split(/\s+/);
                            if (colorParts.every(part => keyLower.includes(part) && part.length > 2)) {
                                colorImages = images;
                                colorImagesFound = true;
                                console.log(`Found match for multi-word color "${color}" by checking parts in key "${key}"`);
                                break;
                            }
                        }
                    }
                }
                
                if (colorImagesFound) {
                    console.log(`Found ${colorImages.length} images for color ${color}`);
                    // Deduplicate images
                    this.filteredImages = deduplicateImages(colorImages);
                    this.currentImageIndex = 0;
                    this.updateMainImage();
                    this.updateThumbnailGrid();
                }
            }
            
            // If no color-specific images were found, look for images in variants
            if (!colorImagesFound && this.currentProduct.variants && this.currentProduct.variants.length > 0) {
                const colorVariants = this.currentProduct.variants.filter(v =>
                    v.color && v.color.toLowerCase() === color.toLowerCase()
                );
                
                if (colorVariants.length > 0) {
                    console.log(`Found ${colorVariants.length} variants for color ${color}`);
                    
                    // Collect images from these variants
                    const variantImages = colorVariants
                        .filter(v => v.image)
                        .map(v => v.image);
                    
                    if (variantImages.length > 0) {
                        console.log(`Found ${variantImages.length} variant images for color ${color}`);
                        // Deduplicate images
                        this.filteredImages = deduplicateImages(variantImages);
                        this.currentImageIndex = 0;
                        this.updateMainImage();
                        this.updateThumbnailGrid();
                        colorImagesFound = true;
                    }
                }
            }
            
            // If still no color-specific images found, try URL-based filtering
            if (!colorImagesFound && this.currentProduct.images && this.currentProduct.images.length > 0) {
                console.log(`Using URL filtering for color ${color}`);
                
                // Create a comprehensive filtering function for multi-word colors
                const getMatchingImages = () => {
                    return this.currentProduct.images.filter(imgUrl => {
                        const imgUrlLower = imgUrl.toLowerCase();
                        
                        // Try each variation of the color name
                        for (const colorVariation of colorVariations) {
                            // Standard pattern matching
                            if (imgUrlLower.includes(`/${colorVariation}`) ||
                                imgUrlLower.includes(`_${colorVariation}`) ||
                                imgUrlLower.includes(`-${colorVariation}`) ||
                                imgUrlLower.includes(`${colorVariation}_`) ||
                                imgUrlLower.includes(`${colorVariation}-`) ||
                                imgUrlLower.includes(`color=${colorVariation}`) ||
                                imgUrlLower.includes(`variant=${colorVariation}`) ||
                                imgUrlLower.includes(`option=${colorVariation}`) ||
                                imgUrlLower.includes(colorVariation)) {
                                return true;
                            }
                            
                            // Check for color name at the end of the URL or filename
                            const parts = imgUrlLower.split('/');
                            const filename = parts[parts.length - 1];
                            
                            if (filename.startsWith(colorVariation + '_') ||
                                filename.startsWith(colorVariation + '-') ||
                                filename.endsWith('_' + colorVariation + '.') ||
                                filename.endsWith('-' + colorVariation + '.')) {
                                return true;
                            }
                        }
                        
                        // For multi-word colors, apply additional patterns
                        if (isMultiWordColor) {
                            const colorParts = color.toLowerCase().split(/\s+/);
                            
                            // Check if all parts of the color name appear in the URL
                            const allPartsPresent = colorParts.every(part =>
                                imgUrlLower.includes(part) && part.length > 2  // Only consider parts with 3+ chars
                            );
                            
                            if (allPartsPresent) {
                                return true;
                            }
                            
                            // Check for color initials (e.g., "fg" for "forest green")
                            const colorInitials = colorParts.map(part => part[0]).join('');
                            if (colorInitials.length > 1 &&
                                (imgUrlLower.includes(`_${colorInitials}_`) ||
                                 imgUrlLower.includes(`-${colorInitials}-`) ||
                                 imgUrlLower.includes(`_${colorInitials}.`) ||
                                 imgUrlLower.includes(`-${colorInitials}.`) ||
                                 imgUrlLower.includes(`/${colorInitials}/`) ||
                                 imgUrlLower.includes(`/${colorInitials}_`) ||
                                 imgUrlLower.includes(`/${colorInitials}-`))) {
                                return true;
                            }
                            
                            // More aggressive matching for two-word colors by checking each word independently
                            if (colorParts.length === 2) {
                                // Check each word's presence in the filename
                                const filename = imgUrlLower.split('/').pop() || '';
                                
                                // If both color parts appear in the filename, it's likely a match
                                if (colorParts.every(part => filename.includes(part) && part.length > 2)) {
                                    return true;
                                }
                                
                                // Check for color adjective at the start of filename
                                // (e.g., "forest" in "forest-hoodie.jpg" for "forest green")
                                if (filename.startsWith(colorParts[0]) &&
                                    !filename.includes(colorParts[1]) &&
                                    colorParts[0].length > 3) {
                                    return true;
                                }
                            }
                        }
                        
                        return false;
                    });
                };
                
                const matchingImages = getMatchingImages();
                
                if (matchingImages.length > 0) {
                    console.log(`Found ${matchingImages.length} URL-matched images for color ${color}`);
                    // Deduplicate images
                    this.filteredImages = deduplicateImages(matchingImages);
                    this.currentImageIndex = 0;
                    this.updateMainImage();
                    this.updateThumbnailGrid();
                    colorImagesFound = true;
                }
            }
            
            // If no color-specific images found after all attempts, use all images
            if (!colorImagesFound && this.currentProduct.images && this.currentProduct.images.length > 0) {
                console.log(`No color-specific images found for ${color}, using all ${this.currentProduct.images.length} images`);
                // Deduplicate all images too
                this.filteredImages = deduplicateImages(this.currentProduct.images);
                this.currentImageIndex = 0;
                this.updateMainImage();
                this.updateThumbnailGrid();
            }
            
            // For multi-word colors, ensure the colorImages map has entries for all variations
            if (isMultiWordColor && colorImagesFound && colorImages.length > 0) {
                // Create entries for variations to improve future lookups
                for (const variation of colorVariations) {
                    if (variation !== color.toLowerCase() && !this.currentProduct.colorImages[variation]) {
                        this.currentProduct.colorImages[variation] = [...colorImages];
                        console.log(`Added color images entry for variation "${variation}" -> ${colorImages.length} images`);
                    }
                }
            }
            
            // Ensure there are no duplicate images in colorToImagesMap
            if (this.currentProduct.colorImages && this.currentProduct.colorImages[color]) {
                // Make sure the color-specific images are properly deduplicated
                const uniqueColorImages = [...new Set(this.currentProduct.colorImages[color])];
                this.currentProduct.colorImages[color] = uniqueColorImages;
                console.log(`Deduplicated color images for "${color}": ${uniqueColorImages.length} unique images`);
            }
            
            // Debug to show actual image count
            if (this.filteredImages && this.filteredImages.length > 0) {
                console.log(`Final filtered images count for ${color}: ${this.filteredImages.length}`);
            }
            
            // Make sure thumbnails and main image are updated
            this.updateThumbnailGrid();
            
        } catch (error) {
            console.error('Error in selectColor:', error);
            // Fallback to using all images
            if (this.currentProduct && this.currentProduct.images) {
                this.filteredImages = deduplicateImages(this.currentProduct.images);
                this.currentImageIndex = 0;
                this.updateMainImage();
                this.updateThumbnailGrid();
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
        
        // Ensure we have a valid array of filtered images
        if (!this.filteredImages || this.filteredImages.length === 0) {
            // Try to get images from the colorImages map first
            if (this.currentProduct?.colorImages &&
                this.selectedVariant?.color &&
                this.currentProduct.colorImages[this.selectedVariant.color]) {
                this.filteredImages = [...this.currentProduct.colorImages[this.selectedVariant.color]];
                // Only log detailed info when debugging is needed
            } else if (this.currentProduct?.images) {
                // Fallback to all product images
                this.filteredImages = [...this.currentProduct.images];
                console.log(`Falling back to all ${this.filteredImages.length} product images for main image`);
            } else {
                // Last resort - use placeholder
                this.filteredImages = ['/assets/product-placeholder.png'];
                console.warn('No images available for main image, using placeholder');
            }
        }
        
        // Ensure index is valid
        if (this.currentImageIndex < 0 || this.currentImageIndex >= this.filteredImages.length) {
            console.warn(`Invalid image index: ${this.currentImageIndex}, resetting to 0`);
            this.currentImageIndex = 0;
        }
        
        // Get the current image to display
        const image = this.filteredImages[this.currentImageIndex];
        if (!image) {
            // Use fallback if image is null or undefined
            const fallbackImage = '/assets/product-placeholder.png';
            mainImageContainer.innerHTML = `
                <img src="${fallbackImage}"
                     alt="${this.currentProduct?.title || 'Product'}"
                     style="width:100%; max-height:500px; object-fit:contain; background-color: #ffffff; padding:10px; border-radius:8px;">
            `;
            return;
        }
        
        // Extract color and view type information from image URL if possible
        const imgUrl = image.toLowerCase();
        const viewTypes = ['front', 'back', 'side', 'detail', 'angle'];
        let viewType = '';
        
        for (const type of viewTypes) {
            if (imgUrl.includes(type)) {
                viewType = type.charAt(0).toUpperCase() + type.slice(1);
                break;
            }
        }
        
        // Create the main image with better error handling
        mainImageContainer.innerHTML = `
            <img src="${image}"
                 alt="${this.currentProduct?.title || 'Product'}${viewType ? ' - ' + viewType + ' View' : ''}"
                 style="width:100%; max-height:500px; object-fit:contain; background-color: #ffffff; padding:10px; border-radius:8px;"
                 onerror="this.src='/assets/product-placeholder.png'; console.warn('Failed to load main image: ${image.replace(/'/g, "\\'")}');">
        `;
        
        // Debug logging removed to reduce console spam
    }
    
    addToCart() {
        try {
            if (!this.currentProduct) {
                console.error('Cannot add to cart: Product not available');
                this.showNotification('Product not available', 'error');
                return;
            }
            
            // Check if product has sizes available
            const hasSizes = this.currentProduct.sizes && this.currentProduct.sizes.length > 0;
            
            // If product has sizes but none selected, show error
            if (hasSizes && !this.selectedVariant.size) {
                console.warn('Cannot add to cart: Size not selected');
                this.showNotification('Please select a size', 'error');
                return;
            } else if (!this.selectedVariant.size) {
                // For products without size options (like beanies), set a default size
                console.log('Product has no size options, using default "One Size"');
                this.selectedVariant.size = "One Size";
            }
            
            if (!this.selectedVariant.color) {
                console.warn('Cannot add to cart: Color not selected');
                this.showNotification('Please select a color', 'error');
                return;
            }
            
            // Create a unique ID for each product variant combination
            const variantId = `${this.currentProduct.id}_${this.selectedVariant.color}_${this.selectedVariant.size}`.replace(/\s+/g, '_');
            
            // Find a color-specific image for the cart thumbnail
            let colorImage = this.currentProduct.mainImage;
            
            // Try to get a color-specific image from the filtered images (already filtered by color)
            if (this.filteredImages && this.filteredImages.length > 0) {
                colorImage = this.filteredImages[0]; // Use the first image of the filtered set
            }
            // Or try the colorImages map directly
            else if (this.currentProduct.colorImages &&
                    this.currentProduct.colorImages[this.selectedVariant.color] &&
                    this.currentProduct.colorImages[this.selectedVariant.color].length > 0) {
                colorImage = this.currentProduct.colorImages[this.selectedVariant.color][0];
            }
            // If all else fails, look through variants
            else if (this.currentProduct.variants) {
                const matchingVariant = this.currentProduct.variants.find(v =>
                    v.color === this.selectedVariant.color);
                if (matchingVariant && matchingVariant.image) {
                    colorImage = matchingVariant.image;
                }
            }
            
            console.log(`Using color image for ${this.selectedVariant.color}: ${colorImage}`);
            
            // Create a properly formatted product object for cart system
            const cartProduct = {
                // Use the variant-specific ID to ensure different variants are treated as different items
                id: variantId,
                productId: this.currentProduct.id, // Keep original product ID for reference
                title: this.currentProduct.title,
                price: this.currentProduct.price,
                image: colorImage, // Use the color-specific image instead of main image
                shopifyId: this.currentProduct.shopifyId,
                // Provide both formats for maximum compatibility
                selectedColor: this.selectedVariant.color,
                selectedSize: this.selectedVariant.size,
                quantity: this.selectedVariant.quantity || 1,
                // Add variants object for cart-checkout-system compatibility
                variants: {
                    color: this.selectedVariant.color,
                    size: this.selectedVariant.size
                },
                // Add variant details directly in the title for display in cart
                variantTitle: `${this.selectedVariant.color} / ${this.selectedVariant.size}`
            };
            
            console.log(`Adding to cart: ${cartProduct.title} - ${cartProduct.variantTitle} (Quantity: ${cartProduct.quantity})`);
            
            // Try to use any available cart system
            let cartAdded = false;
            console.log('Attempting to add product to cart:', this.currentProduct.title);
            
            // Try BobbyCart (simple-cart-system) first as it's our most reliable implementation
            if (window.BobbyCart && typeof window.BobbyCart.addItem === 'function') {
                try {
                    console.log('Using BobbyCart.addItem()');
                    window.BobbyCart.addItem(cartProduct);
                    cartAdded = true;
                    
                    // Force cart to open
                    setTimeout(() => {
                        if (typeof window.BobbyCart.openCart === 'function') {
                            window.BobbyCart.openCart();
                        }
                    }, 300);
                } catch (error) {
                    console.error('Error adding to BobbyCart:', error);
                }
            }
            // Try BobbyCarts system as alternative
            else if (window.BobbyCarts && typeof window.BobbyCarts.addToCart === 'function') {
                try {
                    console.log('Using BobbyCarts.addToCart()');
                    window.BobbyCarts.addToCart(cartProduct);
                    cartAdded = true;
                    
                    // Force cart to open
                    setTimeout(() => {
                        if (typeof window.BobbyCarts.openCart === 'function') {
                            window.BobbyCarts.openCart();
                        }
                    }, 300);
                } catch (error) {
                    console.error('Error adding to BobbyCarts:', error);
                }
            }
            // Try cartManager as final fallback
            else if (window.cartManager && typeof window.cartManager.addItem === 'function') {
                try {
                    console.log('Using cartManager.addItem()');
                    window.cartManager.addItem(cartProduct);
                    cartAdded = true;
                    
                    // Force cart to open
                    setTimeout(() => {
                        if (typeof window.cartManager.openCart === 'function') {
                            window.cartManager.openCart();
                        }
                    }, 300);
                } catch (error) {
                    console.error('Error adding to cartManager:', error);
                }
            }
            
            if (cartAdded) {
                this.showNotification('Product added to cart!', 'success');
                
                // Trigger add to cart animation
                this.playAddToCartAnimation();
                console.log('Product successfully added to cart');
            } else {
                console.error('No cart system available or all cart systems failed');
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
        
        // Enhanced color mapping that includes all predefined CSS colors
        const colorMap = {
            // Core colors
            'black': '#000000',
            'white': '#FFFFFF',
            'red': '#EF4444',
            'green': '#008000',
            'blue': '#0000FF',
            'yellow': '#FFFF00',
            'purple': '#800080',
            'orange': '#FFA500',
            'brown': '#A52A2A',
            'pink': '#FFC0CB',
            'gray': '#808080',
            'grey': '#808080',
            
            // Specific named colors
            'forest green': '#228B22',
            'navy blazer': '#001F3F',
            'navy': '#000080',
            'navy blue': '#000080',
            'charcoal gray': '#36454F',
            'charcoal grey': '#36454F',
            'charcoal': '#36454F',
            'burgundy': '#800020',
            'olive': '#808000',
            'olive green': '#556B2F',
            'teal': '#008080',
            'maroon': '#800000',
            'royal blue': '#4169E1',
            'sky blue': '#87CEEB',
            'turquoise': '#40E0D0',
            'mint green': '#98FB98',
            'sage green': '#BCBFA3',
            'hunter green': '#355E3B',
            'emerald': '#50C878',
            'jade': '#00A86B',
            'khaki': '#C3B091',
            'beige': '#F5F5DC',
            'tan': '#D2B48C',
            'cream': '#FFFDD0',
            'ivory': '#FFFFF0',
            'coral': '#FF7F50',
            'salmon': '#FA8072',
            'peach': '#FFE5B4',
            'rust': '#B7410E',
            'copper': '#B87333',
            'gold': '#FFD700',
            'silver': '#C0C0C0',
            'slate': '#708090',
            'indigo': '#4B0082',
            'lavender': '#E6E6FA',
            'plum': '#8E4585',
            'magenta': '#FF00FF',
            'violet': '#8A2BE2',
            'mustard': '#FFDB58',
            'taupe': '#483C32',
            'light gray': '#D3D3D3',
            'light grey': '#D3D3D3',
            'dark gray': '#A9A9A9',
            'dark grey': '#A9A9A9',
            'vintage black': '#202020',
            'off white': '#F5F5F5',
            'deep purple': '#301934',
            'hot pink': '#FF69B4',
            'dark brown': '#5C4033',
            'light brown': '#B5651D',
            
            // Default
            'default': '#A855F7'  // Site's main accent color as default
        };
        
        if (typeof colorName === 'string') {
            // Try exact match first
            const lowerColor = colorName.toLowerCase();
            if (colorMap[lowerColor]) {
                return colorMap[lowerColor];
            }
            
            // If no exact match, try to match just the main color word
            // For compound colors like "Dark Blue" or "Light Green"
            const colorWords = lowerColor.split(' ');
            const lastWord = colorWords[colorWords.length - 1];
            if (colorMap[lastWord]) {
                return colorMap[lastWord];
            }
            
            // Check if this is a compound color with words reversed
            // e.g. "Blue Navy" instead of "Navy Blue"
            if (colorWords.length >= 2) {
                const reversedKey = `${colorWords[1]} ${colorWords[0]}`;
                if (colorMap[reversedKey]) {
                    return colorMap[reversedKey];
                }
            }
            
            // If no match was found and our color-name-handler.js is loaded
            // it will handle this color through CSS variables or dynamic generation
            return `var(--dynamic-color, #808080)`;
        }
        
        return '#808080'; // Default gray fallback
    }
    
    // Helper method to check if a string is a common color name
    isCommonColor(str) {
        if (!str || typeof str !== 'string') return false;
        
        // Expanded list of common colors to match our CSS variables
        const commonColors = [
            // Basic colors
            'black', 'white', 'red', 'green', 'blue', 'yellow', 'purple',
            'orange', 'pink', 'gray', 'grey', 'brown',
            
            // Extended colors
            'navy', 'maroon', 'charcoal', 'beige', 'olive', 'tan', 'silver', 'gold',
            'teal', 'indigo', 'violet', 'magenta', 'coral', 'turquoise', 'lavender',
            'mint', 'sage', 'forest', 'hunter', 'emerald', 'jade', 'khaki', 'cream',
            'ivory', 'salmon', 'peach', 'rust', 'copper', 'slate', 'plum', 'mustard',
            'taupe', 'burgundy'
        ];
        
        // Check for direct match first
        if (commonColors.includes(str.toLowerCase())) {
            return true;
        }
        
        // Check compound color names
        const compoundColors = [
            'forest green', 'navy blue', 'royal blue', 'sky blue',
            'charcoal gray', 'charcoal grey', 'olive green',
            'mint green', 'sage green', 'hunter green',
            'navy blazer', 'light gray', 'light grey',
            'dark gray', 'dark grey', 'hot pink', 'deep purple',
            'dark brown', 'light brown', 'off white', 'vintage black'
        ];
        
        if (compoundColors.includes(str.toLowerCase())) {
            return true;
        }
        
        // Check if string contains any common color as a word
        const strLower = str.toLowerCase();
        const words = strLower.split(/\s+/);
        
        // Check each word against common colors
        for (const word of words) {
            if (commonColors.includes(word)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Enhanced updateThumbnailGrid method for better color-specific image handling
    updateThumbnailGrid() {
        try {
            // Find the thumbnail container
            const galleryContainer = document.getElementById('product-gallery');
            if (!galleryContainer) return;
            
            // Only log when there's a significant change in the number of images
            // This prevents spamming the console on every update
            
            // Ensure filtered images are properly set
            if (!this.filteredImages || this.filteredImages.length === 0) {
                // Try to get images from the colorImages map first
                if (this.currentProduct?.colorImages &&
                    this.selectedVariant?.color &&
                    this.currentProduct.colorImages[this.selectedVariant.color]) {
                    this.filteredImages = [...this.currentProduct.colorImages[this.selectedVariant.color]];
                    console.log(`Retrieved ${this.filteredImages.length} images from colorImages map`);
                } else if (this.currentProduct?.images) {
                    // Fallback to all product images
                    this.filteredImages = [...this.currentProduct.images];
                    console.log(`Falling back to all ${this.filteredImages.length} product images`);
                }
            }
            
            // Ensure we have at least one image
            if (!this.filteredImages || this.filteredImages.length === 0) {
                this.filteredImages = ['/assets/product-placeholder.png'];
                console.warn('No images available, using placeholder');
            }
            
            // Clear existing thumbnails
            galleryContainer.innerHTML = '';
            
            // Create thumbnails for each filtered image with proper metadata
            this.filteredImages.forEach((img, idx) => {
                // Create thumbnail container
                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.className = `gallery-item ${idx === this.currentImageIndex ? 'active' : ''}`;
                thumbnailDiv.style.cursor = 'pointer';
                thumbnailDiv.style.border = idx === this.currentImageIndex ? '2px solid #a855f7' : '2px solid transparent';
                thumbnailDiv.style.transition = 'all 0.2s ease';
                thumbnailDiv.style.borderRadius = '4px';
                thumbnailDiv.style.overflow = 'hidden';
                thumbnailDiv.style.margin = '4px';
                thumbnailDiv.style.backgroundColor = '#ffffff';
                thumbnailDiv.setAttribute('data-index', idx.toString());
                
                // Create and configure image element
                const imgElement = document.createElement('img');
                imgElement.src = img;
                imgElement.alt = `${this.currentProduct?.title || 'Product'} ${idx + 1}`;
                imgElement.style.width = '60px';
                imgElement.style.height = '60px';
                imgElement.style.objectFit = 'contain';
                imgElement.style.backgroundColor = '#ffffff';
                
                // Extract view type from image URL if possible (front, back, etc.)
                const imgUrl = img.toLowerCase();
                const viewTypes = ['front', 'back', 'side', 'detail', 'angle'];
                let viewType = '';
                
                for (const type of viewTypes) {
                    if (imgUrl.includes(type)) {
                        viewType = type.charAt(0).toUpperCase() + type.slice(1);
                        break;
                    }
                }
                
                // Add view type as tooltip if detected
                if (viewType) {
                    thumbnailDiv.title = viewType + ' View';
                }
                
                // Add color information as metadata
                if (this.selectedVariant && this.selectedVariant.color) {
                    imgElement.setAttribute('data-color', this.selectedVariant.color);
                    thumbnailDiv.setAttribute('data-color', this.selectedVariant.color);
                }
                
                // Add error handling for image
                imgElement.onerror = function() {
                    this.src = '/assets/product-placeholder.png';
                    this.style.objectFit = 'contain';
                    console.warn(`Failed to load image: ${img}`);
                };
                
                // Add image to thumbnail container
                thumbnailDiv.appendChild(imgElement);
                galleryContainer.appendChild(thumbnailDiv);
                
                // Add click event listener to thumbnail
                thumbnailDiv.addEventListener('click', () => {
                    this.currentImageIndex = idx;
                    this.updateMainImage();
                    
                    // Update active state for all thumbnails
                    document.querySelectorAll('.gallery-item').forEach((item) => {
                        const itemIndex = parseInt(item.getAttribute('data-index') || '0');
                        if (itemIndex === idx) {
                            item.classList.add('active');
                            item.style.border = '2px solid #a855f7';
                            item.style.transform = 'scale(1.05)';
                        } else {
                            item.classList.remove('active');
                            item.style.border = '2px solid transparent';
                            item.style.transform = 'scale(1)';
                        }
                    });
                });
            });
                
            // Ensure we have a valid current image index
            if (this.currentImageIndex >= this.filteredImages.length) {
                this.currentImageIndex = 0;
            }
            
            // Update main image to show the current filtered image
            this.updateMainImage();
        } catch (error) {
            console.error('Error in updateThumbnailGrid:', error);
            // Fallback: try to at least display the main image if available
            if (this.currentProduct && this.currentProduct.mainImage) {
                const mainImageContainer = document.getElementById('main-product-image');
                if (mainImageContainer) {
                    mainImageContainer.innerHTML = `
                        <img src="${this.currentProduct.mainImage}"
                             alt="${this.currentProduct.title}"
                             style="width:100%; max-height:500px; object-fit:contain; background-color: #ffffff; padding:10px; border-radius:8px;"
                             onerror="this.src='/assets/product-placeholder.png';">
                    `;
                }
            }
            
            // Add debug information about current color and images
            console.log(`Thumbnail grid updated with ${this.filteredImages?.length} images for color: ${this.selectedVariant?.color}`);
        }
    }
    // Helper method to ensure URLs are absolute
    ensureAbsoluteUrl(url) {
        if (!url) return '/assets/product-placeholder.png';
        
        try {
            // Check for common error patterns
            if (url.includes('product.html?id=')) {
                console.error(`Invalid image URL detected (contains product.html): ${url}`);
                return '/assets/product-placeholder.png';
            }
            
            // If it's already an absolute URL, return it
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            
            // If it's a protocol-relative URL (starts with //), add https:
            if (url.startsWith('//')) {
                return 'https:' + url;
            }
            
            // If it's a root-relative URL (starts with /), add the origin
            if (url.startsWith('/')) {
                return window.location.origin + url;
            }
            
            // If it's a relative URL without leading slash, assume it's relative to origin
            return window.location.origin + '/' + url;
        } catch (error) {
            console.error(`Error processing URL: ${url}`, error);
            return '/assets/product-placeholder.png';
        }
    }
}

// Initialize product detail manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();
});
