// Rainbow Discount Banner - 10% off BUNGIXBOBBY
class DiscountBanner {
    constructor() {
        this.currentDiscount = {
            type: 'first_order',
            title: 'FIRST ORDER DISCOUNT',
            description: '10% off your first order',
            discountPercent: 10,
            isActive: true,
            code: 'BUNGIXBOBBY'
        };
        this.init();
    }

    init() {
        // Wait for DOM to be ready and navbar animation to complete
        setTimeout(() => {
            this.createDiscountBanner();
        }, 2000);
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
}

// Initialize the discount banner
new DiscountBanner();