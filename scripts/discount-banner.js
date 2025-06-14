// Simple Discount Banner - 10% off BUNGIXBOBBY
class DiscountBanner {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createBanner());
        } else {
            this.createBanner();
        }
    }

    createBanner() {
        // Don't create banner if it already exists
        if (document.getElementById('discount-banner')) {
            return;
        }

        // Create banner element
        const banner = document.createElement('div');
        banner.id = 'discount-banner';
        banner.className = 'discount-banner';
        
        banner.innerHTML = `
            <div class="discount-banner-content">
                <div class="discount-icon">🔥</div>
                <div class="discount-text">
                    <span class="discount-title">FIRST ORDER DISCOUNT</span>
                    <span class="discount-description">10% off your first order - Code: BUNGIXBOBBY</span>
                </div>
                <div class="discount-cta">
                    <button class="discount-shop-btn" onclick="window.location.href='products.html'">
                        SHOP NOW
                    </button>
                </div>
                <button class="discount-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
        `;

        // Add styles
        this.addStyles();

        // Insert banner at the top of the page
        this.insertBanner(banner);

        // Show banner with animation
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
    }

    insertBanner(banner) {
        // Try to insert after navbar
        const navbar = document.querySelector('.navbar');
        if (navbar && navbar.parentNode) {
            if (navbar.nextElementSibling) {
                navbar.parentNode.insertBefore(banner, navbar.nextElementSibling);
            } else {
                navbar.parentNode.appendChild(banner);
            }
        } else {
            // Fallback: insert at top of body
            document.body.insertBefore(banner, document.body.firstChild);
        }
    }

    addStyles() {
        // Don't add styles if they already exist
        if (document.getElementById('discount-banner-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'discount-banner-styles';
        style.textContent = `
            .discount-banner {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24, #ff9ff3, #a855f7);
                background-size: 400% 400%;
                animation: discountGradient 3s ease infinite;
                color: white;
                padding: 12px 0;
                position: relative;
                display: block;
                width: 100%;
                z-index: 10;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                transform: translateY(-100%);
                transition: transform 0.5s ease;
                overflow: hidden;
                margin-bottom: 0;
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

            /* Add proper spacing after banner */
            .discount-banner + .collection-header,
            .discount-banner + .hero-section,
            .discount-banner + .main-content > *:first-child {
                margin-top: 0;
                padding-top: 20px;
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

                .discount-text {
                    flex-direction: column;
                    gap: 5px;
                }

                .discount-cta {
                    margin-left: 0;
                }

                .discount-title {
                    font-size: 14px;
                }

                .discount-description {
                    font-size: 12px;
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
                    font-size: 13px;
                }

                .discount-description {
                    font-size: 11px;
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