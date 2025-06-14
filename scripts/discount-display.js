// Discount Display System for Bobby Streetwear
class DiscountDisplayManager {
    constructor() {
        console.log('🎯 Initializing PRECISE Discount Display Manager');
        this.discounts = [];
        this.currentDiscount = null;
        this.init();
    }

    async init() {
        console.log('🎯 Initializing precise discount display system');
        // Skip loading external discounts, use our precise logic instead
        this.setupPreciseDiscounts();
        
        // Delay product discount updates to ensure products are loaded
        setTimeout(() => {
            this.updateProductDiscounts();
        }, 2000);
        
        setTimeout(() => {
            this.updateProductDiscounts();
        }, 4000);
        
        // Listen for page changes to update product detail pages
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.updateProductDiscounts();
            }, 1000);
        });
        
        // Also listen for product detail page loads
        if (window.location.pathname.includes('product')) {
            setTimeout(() => {
                this.updateProductDetailPricing();
            }, 1500);
        }
    }
    
    setupPreciseDiscounts() {
        // Use the same precise logic as PreciseDiscountSystem
        console.log('🎯 Setting up precise discount rules for product tiles');
    }
    
    // Check if product should have discount (same logic as cart system)
    shouldHaveDiscount(productTitle) {
        if (!productTitle) return false;
        
        const title = productTitle.toLowerCase();
        
        // Only BUNGI X BOBBY products with these specific types
        const isBungiProduct = title.includes('bungi x bobby');
        
        if (isBungiProduct) {
            // Specific product types that should get discounts
            const discountTypes = [
                'sweatshirt',
                'joggers',
                'hoodie'
            ];
            
            // Check if this BUNGI X BOBBY product is one of the discount types
            const hasDiscountType = discountTypes.some(type => title.includes(type));
            
            if (hasDiscountType) {
                return { percentage: 12, description: '12% off BUNGI X BOBBY collection' };
            }
        }
        
        return null; // No discount for other items
        
        // Delay banner creation to ensure DOM is ready and navbar animation is complete
        setTimeout(() => {
            this.createDiscountBanner();
        }, 2000); // Increased delay to wait for navbar animation
        
        // Delay product discount updates to ensure products are loaded
        setTimeout(() => {
            this.updateProductDiscounts();
        }, 4000);
        
        // Add additional triggers for product pricing updates
        setTimeout(() => {
            this.updateProductDiscounts();
        }, 6000);
        
        setTimeout(() => {
            this.updateProductDiscounts();
        }, 8000);
        
        // Listen for product updates to refresh discount displays
        document.addEventListener('productDetailRendered', () => {
            this.updateProductDiscounts();
        });
        
        document.addEventListener('productDetailInitialized', () => {
            this.updateProductDiscounts();
        });
        
        // Listen for homepage products loaded
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.updateProductDiscounts();
            }, 2000);
        });
        
        // Also listen for when homepage products are specifically loaded
        if (window.homepageProductLoader) {
            // If homepage loader already exists, trigger update
            setTimeout(() => {
                this.updateProductDiscounts();
            }, 4000);
        } else {
            // Wait for homepage loader to be created
            const checkForLoader = setInterval(() => {
                if (window.homepageProductLoader) {
                    clearInterval(checkForLoader);
                    setTimeout(() => {
                        this.updateProductDiscounts();
                    }, 1000);
                }
            }, 500);
        }
    }

    async loadDiscounts() {
        try {
            // Check for active discounts from Shopify products
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            let products = [];
            
            if (data.products && Array.isArray(data.products)) {
                products = data.products.map(p => p.node || p);
            } else if (Array.isArray(data)) {
                products = data.map(p => p.node || p);
            }

            // Analyze products for discounts
            this.analyzeProductDiscounts(products);
            
        } catch (error) {
            console.error('Error loading discounts:', error);
            // Set a fallback discount for demonstration
            this.setFallbackDiscount();
        }
    }

    analyzeProductDiscounts(products) {
        const discountedProducts = [];
        let totalDiscountValue = 0;
        let maxDiscountPercent = 0;

        products.forEach(product => {
            if (product.variants && product.variants.edges) {
                product.variants.edges.forEach(variantEdge => {
                    const variant = variantEdge.node;
                    if (variant.compareAtPrice && variant.price) {
                        const comparePrice = parseFloat(variant.compareAtPrice.amount);
                        const currentPrice = parseFloat(variant.price.amount);
                        
                        if (comparePrice > currentPrice) {
                            const discountAmount = comparePrice - currentPrice;
                            const discountPercent = Math.round((discountAmount / comparePrice) * 100);
                            
                            discountedProducts.push({
                                title: product.title,
                                originalPrice: comparePrice,
                                salePrice: currentPrice,
                                discountAmount: discountAmount,
                                discountPercent: discountPercent
                            });
                            
                            totalDiscountValue += discountAmount;
                            maxDiscountPercent = Math.max(maxDiscountPercent, discountPercent);
                        }
                    }
                });
            }
        });

        if (discountedProducts.length > 0) {
            this.currentDiscount = {
                type: 'product_sale',
                title: 'SALE NOW ON',
                description: `Up to ${maxDiscountPercent}% off select items`,
                discountPercent: maxDiscountPercent,
                products: discountedProducts,
                totalSavings: totalDiscountValue,
                isActive: true
            };
            
            console.log(`Found ${discountedProducts.length} discounted products with max discount of ${maxDiscountPercent}%`);
        } else {
            this.setFallbackDiscount();
        }
    }

    setFallbackDiscount() {
        // Set the specific discount code for first-time customers
        this.currentDiscount = {
            type: 'first_order',
            title: 'FIRST ORDER DISCOUNT',
            description: '10% off your first order',
            discountPercent: 10,
            isActive: true,
            code: 'BUNGIXBOBBY'
        };
    }

    createDiscountBanner() {
        if (!this.currentDiscount || !this.currentDiscount.isActive) {
            return;
        }

        // Remove existing discount banner if it exists
        const existingBanner = document.getElementById('discount-banner');
        if (existingBanner) {
            existingBanner.remove();
        }

        // Create discount banner
        const banner = document.createElement('div');
        banner.id = 'discount-banner';
        banner.className = 'discount-banner';
        
        const bannerContent = `
            <div class="discount-banner-content">
                <div class="discount-icon">🔥</div>
                <div class="discount-text">
                    <span class="discount-title">${this.currentDiscount.title}</span>
                    <span class="discount-description">${this.currentDiscount.description}${this.currentDiscount.code ? ` - Code: ${this.currentDiscount.code}` : ''}</span>
                </div>
                <div class="discount-cta">
                    <button class="discount-shop-btn" onclick="window.location.href='products.html'">
                        SHOP NOW
                    </button>
                </div>
                <button class="discount-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
        `;
        
        banner.innerHTML = bannerContent;
        
        // Add styles
        this.addDiscountStyles();
        
        // Wait for DOM to be ready and insert banner properly below navbar
        this.insertBannerBelowNavbar(banner);

        // Add animation
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
    }

    insertBannerBelowNavbar(banner) {
        // Wait for navbar animation to complete
        this.waitForNavbarAnimation(() => {
            console.log('Navbar animation complete, inserting banner...');
            
            // First, try to find the main site container
            const mainSite = document.getElementById('main-site');
            if (mainSite) {
                console.log('Found main-site container');
                
                // Look for navbar within main-site
                const navbar = mainSite.querySelector('.navbar');
                if (navbar) {
                    console.log('Found navbar inside main-site, inserting banner after it');
                    
                    // Insert banner right after the navbar
                    if (navbar.nextElementSibling) {
                        mainSite.insertBefore(banner, navbar.nextElementSibling);
                    } else {
                        mainSite.appendChild(banner);
                    }
                    
                    console.log('Banner successfully inserted after navbar in main-site');
                    return;
                }
                
                // If no navbar found in main-site, insert at the beginning
                console.log('No navbar found in main-site, inserting at beginning');
                mainSite.insertBefore(banner, mainSite.firstChild);
                console.log('Banner inserted at beginning of main-site');
                return;
            }
            
            // Fallback: try to find navbar anywhere in the document
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                console.log('Found navbar in document, inserting banner after it');
                
                // Insert banner after navbar
                if (navbar.nextElementSibling) {
                    navbar.parentNode.insertBefore(banner, navbar.nextElementSibling);
                } else {
                    navbar.parentNode.appendChild(banner);
                }
                
                console.log('Banner inserted after navbar');
                return;
            }
            
            // Last resort: insert at top of body
            console.log('No navbar found, inserting at top of body');
            document.body.insertBefore(banner, document.body.firstChild);
            console.log('Banner inserted at top of body as fallback');
        });
    }

    waitForNavbarAnimation(callback) {
        // Wait for navbar to be present and animation to complete
        let attempts = 0;
        const maxAttempts = 20; // 4 seconds max wait time
        
        const checkNavbar = () => {
            attempts++;
            const navbar = document.querySelector('.navbar');
            
            if (navbar) {
                // Check if navbar has finished animating by checking its computed styles
                const computedStyle = window.getComputedStyle(navbar);
                const transform = computedStyle.transform;
                const opacity = computedStyle.opacity;
                
                console.log(`Navbar check ${attempts}: transform=${transform}, opacity=${opacity}`);
                
                // If navbar is visible and not being transformed, animation is likely complete
                if (opacity === '1' && (transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)')) {
                    console.log('Navbar animation appears complete');
                    callback();
                    return;
                }
            }
            
            if (attempts < maxAttempts) {
                setTimeout(checkNavbar, 200);
            } else {
                console.log('Max attempts reached, proceeding with banner insertion');
                callback();
            }
        };
        
        // Start checking after initial delay
        setTimeout(checkNavbar, 500);
    }

    addDiscountStyles() {
        if (document.getElementById('discount-styles')) {
            return; // Styles already added
        }

        const style = document.createElement('style');
        style.id = 'discount-styles';
        style.textContent = `
            .discount-banner {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24, #ff9ff3, #a855f7);
                background-size: 400% 400%;
                animation: discountGradient 3s ease infinite;
                color: white;
                padding: 8px 0;
                position: static;
                display: block;
                width: 100%;
                z-index: 10;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                transform: translateY(-100%);
                transition: transform 0.5s ease;
                overflow: hidden;
                margin: 60px 0 15px 0;
                clear: both;
            }

            .discount-banner.show {
                transform: translateY(0);
            }

            .discount-banner::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: discountShine 2s infinite;
            }

            @keyframes discountGradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            @keyframes discountShine {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            .discount-banner-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 20px;
                position: relative;
                z-index: 2;
            }

            .discount-icon {
                font-size: 24px;
                margin-right: 15px;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            .discount-text {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .discount-title {
                font-weight: 900;
                font-size: 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                white-space: nowrap;
            }

            .discount-description {
                font-size: 14px;
                opacity: 0.9;
                white-space: nowrap;
            }

            .discount-cta {
                margin-left: 20px;
            }

            .discount-shop-btn {
                background: rgba(255,255,255,0.2);
                border: 2px solid white;
                color: white;
                padding: 8px 20px;
                border-radius: 25px;
                font-weight: bold;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .discount-shop-btn:hover {
                background: white;
                color: #a855f7;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }

            .discount-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 5px;
                margin-left: 15px;
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }

            .discount-close:hover {
                opacity: 1;
            }

            /* Product discount badges */
            .product-discount-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 10;
                animation: discountPulse 2s infinite;
            }

            @keyframes discountPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .product-savings-info {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                margin: 10px 0;
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }

            .product-savings-info .savings-amount {
                font-size: 16px;
                display: block;
                margin-bottom: 2px;
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .discount-banner-content {
                    flex-direction: column;
                    gap: 10px;
                    text-align: center;
                    padding: 0 15px;
                }

                .discount-icon {
                    margin-right: 0;
                }

                .discount-cta {
                    margin-left: 0;
                }

                .discount-title {
                    font-size: 16px;
                }

                .discount-description {
                    font-size: 13px;
                }

                .discount-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    margin-left: 0;
                }
            }

            @media (max-width: 480px) {
                .discount-banner {
                    padding: 15px 0;
                }

                .discount-title {
                    font-size: 14px;
                }

                .discount-description {
                    font-size: 12px;
                }

                .discount-shop-btn {
                    padding: 6px 16px;
                    font-size: 12px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    updateProductDiscounts() {
        // Add discount badges to product cards (using precise logic)
        this.addProductDiscountBadges();
        
        // Update product pricing display (using precise logic)
        this.updatePreciseProductPricing();
        
        // Update product detail pages with precise logic
        this.updateProductDetailPricing();
        
        // Add savings info to product detail pages
        this.addProductSavingsInfo();
    }
    
    updatePreciseProductPricing() {
        console.log('🎯 Updating product pricing with PRECISE logic...');
        
        const productCards = document.querySelectorAll('.product-card, .related-product');
        
        productCards.forEach((card, index) => {
            try {
                // Get product title
                const titleElement = card.querySelector('.product-title, .product-name, h3, h2');
                const productTitle = titleElement ? titleElement.textContent.trim() : '';
                
                // Check if this specific product should have a discount
                const discount = this.shouldHaveDiscount(productTitle);
                
                const priceContainer = card.querySelector('.product-price, .price-container, .price');
                if (!priceContainer) {
                    return;
                }
                
                if (discount) {
                    console.log(`🎯 Applying ${discount.percentage}% discount pricing to: ${productTitle}`);
                    
                    // Check if already has enhanced pricing
                    if (priceContainer.querySelector('.sale-price-enhanced')) {
                        return;
                    }
                    
                    // Extract current price
                    const priceText = priceContainer.textContent;
                    const priceMatch = priceText.match(/\$([0-9.]+)/);
                    
                    if (priceMatch) {
                        const originalPrice = parseFloat(priceMatch[1]);
                        // Calculate discounted price (subtract 12% from original)
                        const discountedPrice = originalPrice * (1 - discount.percentage / 100);
                        
                        // Update the price display with enhanced styling
                        priceContainer.innerHTML = this.renderSalePrice(discountedPrice, originalPrice, discount.percentage);
                        this.addEnhancedPricingStyles();
                    }
                } else {
                    // Remove any existing enhanced pricing from non-eligible products
                    const enhancedPricing = priceContainer.querySelector('.price-display-enhanced');
                    if (enhancedPricing) {
                        console.log(`🗑️ Removing discount pricing from: ${productTitle}`);
                        // Restore original price display
                        const priceText = priceContainer.textContent;
                        const priceMatch = priceText.match(/\$([0-9.]+)/);
                        if (priceMatch) {
                            priceContainer.innerHTML = `$${priceMatch[1]}`;
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error processing card ${index}:`, error);
            }
        });
        
        console.log('✅ Precise product pricing update complete');
    }
    
    updateProductDetailPricing() {
        console.log('🎯 Updating product detail page pricing with PRECISE logic...');
        
        // Check if we're on a product detail page
        const productTitle = document.querySelector('.product-title, .product-name, h1')?.textContent?.trim();
        if (!productTitle) {
            return;
        }
        
        // Check if this specific product should have a discount
        const discount = this.shouldHaveDiscount(productTitle);
        
        if (discount) {
            console.log(`🎯 Applying ${discount.percentage}% discount to product detail page: ${productTitle}`);
            
            // Find the price container on product detail page
            const priceContainer = document.querySelector('.price-container, .product-price, .price');
            if (priceContainer && !priceContainer.querySelector('.sale-price-enhanced')) {
                
                // Extract current price
                const priceText = priceContainer.textContent;
                const priceMatch = priceText.match(/\$([0-9.]+)/);
                
                if (priceMatch) {
                    const originalPrice = parseFloat(priceMatch[1]);
                    // Calculate discounted price (subtract 12% from original)
                    const discountedPrice = originalPrice * (1 - discount.percentage / 100);
                    
                    // Update the price display with enhanced styling
                    priceContainer.innerHTML = this.renderSalePrice(discountedPrice, originalPrice, discount.percentage);
                    this.addEnhancedPricingStyles();
                    
                    console.log(`✅ Applied ${discount.percentage}% discount to product detail page`);
                }
            }
        } else {
            console.log(`ℹ️ No discount applied to product detail page: ${productTitle}`);
        }
    }

    addProductDiscountBadges() {
        // Find all product cards and add discount badges ONLY for BUNGI X BOBBY products
        const productCards = document.querySelectorAll('.product-card, .related-product');
        
        productCards.forEach(card => {
            // Get product title
            const titleElement = card.querySelector('.product-title, .product-name, h3, h2');
            const productTitle = titleElement ? titleElement.textContent.trim() : '';
            
            // Check if this specific product should have a discount
            const discount = this.shouldHaveDiscount(productTitle);
            
            if (discount) {
                // Only add badge if it doesn't already exist
                if (!card.querySelector('.product-discount-badge')) {
                    console.log(`🎯 Adding discount badge to: ${productTitle}`);
                    
                    // Create enhanced discount badge
                    const discountBadge = document.createElement('div');
                    discountBadge.className = 'product-discount-badge';
                    discountBadge.textContent = `${discount.percentage}% OFF`;
                    
                    // Add to product image if it exists
                    const productImage = card.querySelector('.product-image');
                    if (productImage) {
                        productImage.style.position = 'relative';
                        productImage.appendChild(discountBadge);
                    }
                }
            } else {
                // Remove any existing discount badges from non-eligible products
                const existingBadge = card.querySelector('.product-discount-badge');
                if (existingBadge) {
                    console.log(`🗑️ Removing discount badge from: ${productTitle}`);
                    existingBadge.remove();
                }
            }
        });
    }

    updateProductPricing() {
        // Wait for products to load, then update pricing
        setTimeout(() => {
            this.updateHomepageProductPricing();
            this.updateProductDetailPricing();
        }, 1000);
        
        // Also listen for when products are dynamically loaded
        const observer = new MutationObserver(() => {
            this.updateHomepageProductPricing();
        });
        
        const productsContainer = document.getElementById('homepage-products') || document.getElementById('products-grid');
        if (productsContainer) {
            observer.observe(productsContainer, { childList: true, subtree: true });
        }
    }

    updateHomepageProductPricing() {
        // Wait a bit for products to load
        setTimeout(() => {
            console.log('=== UPDATING HOMEPAGE PRODUCT PRICING ===');
            
            // Try multiple selectors to find product cards
            const selectors = [
                '#homepage-products .product-card',
                '.product-card',
                '.product-item',
                '.product'
            ];
            
            let productCards = [];
            for (const selector of selectors) {
                productCards = document.querySelectorAll(selector);
                if (productCards.length > 0) {
                    console.log(`Found ${productCards.length} product cards using selector: ${selector}`);
                    break;
                }
            }
            
            if (productCards.length === 0) {
                console.log('No product cards found with any selector');
                return;
            }
            
            productCards.forEach((card, index) => {
                console.log(`\n--- Processing Card ${index} ---`);
                
                // Try multiple selectors for price containers
                const priceSelectors = ['.product-price', '.price', '.product-pricing', '.price-container'];
                let priceContainer = null;
                
                for (const selector of priceSelectors) {
                    priceContainer = card.querySelector(selector);
                    if (priceContainer) {
                        console.log(`Card ${index}: Found price container with selector: ${selector}`);
                        break;
                    }
                }
                
                if (!priceContainer) {
                    console.log(`Card ${index}: No price container found`);
                    return;
                }
                
                // Check if this card already has enhanced pricing
                if (priceContainer.querySelector('.sale-price-enhanced')) {
                    console.log(`Card ${index}: Already has enhanced pricing`);
                    return;
                }
                
                // Log the current price container content
                console.log(`Card ${index}: Price container HTML:`, priceContainer.innerHTML);
                console.log(`Card ${index}: Price container text:`, priceContainer.textContent);
                
                // Look for existing price elements in various structures
                const originalPriceSpan = priceContainer.querySelector('.original-price') ||
                                        priceContainer.querySelector('.compare-price') ||
                                        priceContainer.querySelector('.was-price');
                
                const currentPriceSpan = priceContainer.querySelector('.current-price') ||
                                       priceContainer.querySelector('.sale-price') ||
                                       priceContainer.querySelector('.now-price');
                
                if (originalPriceSpan || currentPriceSpan) {
                    console.log(`Card ${index}: Found price spans - original:`, originalPriceSpan?.textContent, 'current:', currentPriceSpan?.textContent);
                    
                    // Extract prices from the existing structure
                    const priceText = priceContainer.textContent;
                    const priceMatches = priceText.match(/\$(\d+\.?\d*)/g);
                    
                    console.log(`Card ${index}: Price matches found:`, priceMatches);
                    
                    if (priceMatches && priceMatches.length >= 2) {
                        const currentPrice = parseFloat(priceMatches[0].replace('$', ''));
                        const originalPrice = parseFloat(priceMatches[1].replace('$', ''));
                        
                        console.log(`Card ${index}: Parsed - Current: $${currentPrice}, Original: $${originalPrice}`);
                        
                        if (originalPrice > currentPrice) {
                            // Calculate discount percentage
                            const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
                            
                            console.log(`Card ${index}: ✅ APPLYING ${discountPercent}% discount styling`);
                            
                            // Update the price display with Bobby theme styling
                            priceContainer.innerHTML = this.renderSalePrice(currentPrice, originalPrice, discountPercent);
                            
                            // Add enhanced pricing styles
                            this.addEnhancedPricingStyles();
                        } else {
                            console.log(`Card ${index}: No discount (original <= current)`);
                        }
                    } else {
                        console.log(`Card ${index}: Could not extract prices from text`);
                    }
                } else {
                    console.log(`Card ${index}: No original-price span found, checking for sale badge...`);
                    
                    // Check if there's a sale badge on this product
                    const saleBadge = card.querySelector('.product-badge.sale');
                    if (saleBadge) {
                        console.log(`Card ${index}: ✅ Found sale badge:`, saleBadge.textContent);
                        
                        // Extract discount percentage from badge
                        const badgeText = saleBadge.textContent;
                        const discountMatch = badgeText.match(/-(\d+)%/);
                        
                        if (discountMatch) {
                            const discountPercent = parseInt(discountMatch[1]);
                            const priceText = priceContainer.textContent;
                            const priceMatch = priceText.match(/\$(\d+\.?\d*)/);
                            
                            if (priceMatch) {
                                const currentPrice = parseFloat(priceMatch[1]);
                                // Calculate original price from discount percentage
                                const originalPrice = currentPrice / (1 - discountPercent / 100);
                                
                                console.log(`Card ${index}: ✅ APPLYING ${discountPercent}% discount styling from badge`);
                                console.log(`Card ${index}: Current: $${currentPrice}, Calculated Original: $${originalPrice.toFixed(2)}`);
                                
                                // Update the price display with enhanced styling
                                priceContainer.innerHTML = this.renderSalePrice(currentPrice, originalPrice, discountPercent);
                                this.addEnhancedPricingStyles();
                            }
                        }
                    } else {
                        console.log(`Card ${index}: ❌ No sale indicators found (no original-price span or sale badge)`);
                    }
                }
            });
            
            console.log('=== FINISHED UPDATING HOMEPAGE PRODUCT PRICING ===\n');
        }, 1000);
        
        // Also set up a mutation observer to catch dynamically loaded products
        const homepageContainer = document.getElementById('homepage-products') || document.querySelector('.products-grid') || document.querySelector('.product-grid');
        if (homepageContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        console.log('New products detected, updating pricing...');
                        setTimeout(() => this.updateHomepageProductPricing(), 1000);
                    }
                });
            });
            
            observer.observe(homepageContainer, {
                childList: true,
                subtree: true
            });
        }
    }

    updateProductDetailPricing() {
        // Update product detail page pricing
        const currentPriceEl = document.getElementById('product-price');
        const comparePriceEl = document.getElementById('product-compare-price');
        
        if (currentPriceEl && comparePriceEl) {
            const currentPriceText = currentPriceEl.textContent.match(/\$(\d+\.?\d*)/);
            const comparePriceText = comparePriceEl.textContent.match(/\$(\d+\.?\d*)/);
            
            if (currentPriceText && comparePriceText) {
                const currentPrice = parseFloat(currentPriceText[1]);
                const comparePrice = parseFloat(comparePriceText[1]);
                
                if (comparePrice > currentPrice) {
                    const discountPercent = Math.round(((comparePrice - currentPrice) / comparePrice) * 100);
                    
                    // Update the price container with enhanced styling
                    const priceContainer = document.querySelector('.price-container');
                    if (priceContainer && !priceContainer.querySelector('.sale-price-enhanced')) {
                        priceContainer.innerHTML = this.renderSalePrice(currentPrice, comparePrice, discountPercent);
                        this.addEnhancedPricingStyles();
                    }
                }
            }
        }
    }

    renderSalePrice(salePrice, originalPrice, discountPercent) {
        return `
            <div class="price-display-enhanced">
                <span class="sale-price-enhanced">$${salePrice.toFixed(2)}</span>
                <span class="original-price-enhanced">$${originalPrice.toFixed(2)}</span>
                <span class="discount-badge-enhanced">-${discountPercent}%</span>
            </div>
        `;
    }

    addEnhancedPricingStyles() {
        if (document.getElementById('enhanced-pricing-styles')) {
            return; // Styles already added
        }

        const style = document.createElement('style');
        style.id = 'enhanced-pricing-styles';
        style.textContent = `
            .price-display-enhanced {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
                margin: 8px 0;
            }
            
            .sale-price-enhanced {
                color: #a855f7;
                font-weight: 900;
                font-size: 20px;
                text-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
                font-family: 'Orbitron', monospace;
            }
            
            .original-price-enhanced {
                text-decoration: line-through;
                color: #6b7280;
                font-size: 16px;
                opacity: 0.7;
                font-weight: 400;
            }
            
            .discount-badge-enhanced {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
                animation: discountPulse 2s infinite;
            }
            
            /* Product detail page specific styling */
            .price-container .price-display-enhanced .sale-price-enhanced {
                font-size: 28px;
                color: #10b981;
            }
            
            .price-container .price-display-enhanced .original-price-enhanced {
                font-size: 20px;
            }
            
            .price-container .price-display-enhanced .discount-badge-enhanced {
                font-size: 14px;
                padding: 6px 12px;
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .sale-price-enhanced {
                    font-size: 18px;
                }
                
                .original-price-enhanced {
                    font-size: 14px;
                }
                
                .price-container .price-display-enhanced .sale-price-enhanced {
                    font-size: 24px;
                }
                
                .price-container .price-display-enhanced .original-price-enhanced {
                    font-size: 18px;
                }
            }
            
            /* Animation for discount badge */
            @keyframes discountPulse {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    addProductSavingsInfo() {
        // Add savings information to product detail pages
        const priceContainer = document.querySelector('.price-container');
        const comparePrice = document.getElementById('product-compare-price');
        const currentPrice = document.getElementById('product-price');
        
        if (priceContainer && comparePrice && currentPrice && !document.querySelector('.product-savings-info')) {
            const comparePriceValue = parseFloat(comparePrice.textContent.replace('$', ''));
            const currentPriceValue = parseFloat(currentPrice.textContent.replace('$', ''));
            
            if (comparePriceValue > currentPriceValue) {
                const savings = comparePriceValue - currentPriceValue;
                const savingsPercent = Math.round((savings / comparePriceValue) * 100);
                
                const savingsInfo = document.createElement('div');
                savingsInfo.className = 'product-savings-info';
                savingsInfo.innerHTML = `
                    <span class="savings-amount">You Save $${savings.toFixed(2)}!</span>
                    <span>That's ${savingsPercent}% off the regular price</span>
                `;
                
                // Insert after price container
                priceContainer.parentNode.insertBefore(savingsInfo, priceContainer.nextSibling);
            }
        }
    }

    // Method to manually trigger discount display (for testing)
    showTestDiscount() {
        this.currentDiscount = {
            type: 'test',
            title: 'FLASH SALE',
            description: '25% off everything - Limited time only!',
            discountPercent: 25,
            isActive: true,
            code: 'FLASH25'
        };
        
        this.createDiscountBanner();
        this.updateProductDiscounts();
    }

    // Method to hide discount banner
    hideDiscountBanner() {
        const banner = document.getElementById('discount-banner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    // Debug method to check product pricing
    debugProductPricing() {
        console.log('=== DEBUG PRODUCT PRICING ===');
        
        // Check what products are loaded
        const selectors = [
            '#homepage-products .product-card',
            '.product-card',
            '.product-item',
            '.product'
        ];
        
        let productCards = [];
        for (const selector of selectors) {
            productCards = document.querySelectorAll(selector);
            if (productCards.length > 0) {
                console.log(`Found ${productCards.length} product cards using selector: ${selector}`);
                break;
            }
        }
        
        if (productCards.length === 0) {
            console.log('❌ No product cards found on page');
            return;
        }
        
        productCards.forEach((card, index) => {
            console.log(`\n--- DEBUG Card ${index} ---`);
            console.log('Card HTML:', card.outerHTML);
            
            const priceSelectors = ['.product-price', '.price', '.product-pricing', '.price-container'];
            let priceContainer = null;
            
            for (const selector of priceSelectors) {
                priceContainer = card.querySelector(selector);
                if (priceContainer) {
                    console.log(`Price container found with: ${selector}`);
                    console.log('Price container HTML:', priceContainer.outerHTML);
                    console.log('Price container text:', priceContainer.textContent);
                    break;
                }
            }
            
            if (!priceContainer) {
                console.log('❌ No price container found');
            }
        });
        
        console.log('=== END DEBUG ===');
    }
}

// Initialize discount display system
document.addEventListener('DOMContentLoaded', () => {
    window.discountDisplayManager = new DiscountDisplayManager();
});

// Export for debugging
window.DiscountDisplay = {
    showTest: () => window.discountDisplayManager?.showTestDiscount(),
    hide: () => window.discountDisplayManager?.hideDiscountBanner(),
    reload: () => window.discountDisplayManager?.loadDiscounts(),
    debugPricing: () => window.discountDisplayManager?.debugProductPricing(),
    forceUpdate: () => window.discountDisplayManager?.updateProductDiscounts()
};