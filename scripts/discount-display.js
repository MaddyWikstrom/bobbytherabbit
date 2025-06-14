// Discount Display System for Bobby Streetwear
class DiscountDisplayManager {
    constructor() {
        this.discounts = [];
        this.currentDiscount = null;
        this.init();
    }

    async init() {
        console.log('Initializing discount display system');
        await this.loadDiscounts();
        this.createDiscountBanner();
        this.updateProductDiscounts();
        
        // Listen for product updates to refresh discount displays
        document.addEventListener('productDetailRendered', () => {
            this.updateProductDiscounts();
        });
        
        document.addEventListener('productDetailInitialized', () => {
            this.updateProductDiscounts();
        });
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
        // Set a generic discount for when no specific product discounts are found
        this.currentDiscount = {
            type: 'general',
            title: 'LIMITED TIME OFFER',
            description: 'Special discounts available at checkout',
            discountPercent: 15,
            isActive: true,
            code: 'BOBBY15'
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
                    <span class="discount-description">${this.currentDiscount.description}</span>
                    ${this.currentDiscount.code ? `<span class="discount-code">Code: ${this.currentDiscount.code}</span>` : ''}
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
        
        // Insert banner at the top of the page
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.parentNode.insertBefore(banner, navbar);
        } else {
            document.body.insertBefore(banner, document.body.firstChild);
        }

        // Add animation
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
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
                padding: 12px 0;
                position: relative;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                transform: translateY(-100%);
                transition: transform 0.5s ease;
                overflow: hidden;
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
                flex-direction: column;
                gap: 4px;
            }

            .discount-title {
                font-weight: 900;
                font-size: 18px;
                text-transform: uppercase;
                letter-spacing: 1px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }

            .discount-description {
                font-size: 14px;
                opacity: 0.9;
            }

            .discount-code {
                font-size: 12px;
                background: rgba(255,255,255,0.2);
                padding: 2px 8px;
                border-radius: 12px;
                display: inline-block;
                margin-top: 2px;
                font-weight: bold;
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
        // Add discount badges to product cards
        this.addProductDiscountBadges();
        
        // Add savings info to product detail pages
        this.addProductSavingsInfo();
    }

    addProductDiscountBadges() {
        // Find all product cards and add discount badges if they have sales
        const productCards = document.querySelectorAll('.product-card, .related-product');
        
        productCards.forEach(card => {
            // Check if product has a sale badge already
            const existingSaleBadge = card.querySelector('.product-badge.sale');
            if (existingSaleBadge && !card.querySelector('.product-discount-badge')) {
                // Extract discount percentage from existing sale badge
                const discountText = existingSaleBadge.textContent;
                const discountMatch = discountText.match(/-(\d+)%/);
                
                if (discountMatch) {
                    const discountPercent = discountMatch[1];
                    
                    // Create enhanced discount badge
                    const discountBadge = document.createElement('div');
                    discountBadge.className = 'product-discount-badge';
                    discountBadge.textContent = `SAVE ${discountPercent}%`;
                    
                    // Position it relative to the product image
                    const productImage = card.querySelector('.product-image');
                    if (productImage) {
                        productImage.style.position = 'relative';
                        productImage.appendChild(discountBadge);
                    }
                }
            }
        });
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
}

// Initialize discount display system
document.addEventListener('DOMContentLoaded', () => {
    window.discountDisplayManager = new DiscountDisplayManager();
});

// Export for debugging
window.DiscountDisplay = {
    showTest: () => window.discountDisplayManager?.showTestDiscount(),
    hide: () => window.discountDisplayManager?.hideDiscountBanner(),
    reload: () => window.discountDisplayManager?.loadDiscounts()
};