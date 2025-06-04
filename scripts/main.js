// Main JavaScript for Bobby Streetwear Website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeNavigation();
    initializeScrollEffects();
    initializeProductInteractions();
    initializeSmoothScrolling();
    initializeAnimations();
    
    console.log('Bobby Streetwear - Cyberpunk mode activated 🐰⚡');
});

// Navigation functionality
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
            navbar.style.backdropFilter = 'blur(15px)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
    });
    
    // Add active state to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// Scroll effects and animations
function initializeScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                
                // Add staggered animation for product cards
                if (entry.target.classList.contains('product-card')) {
                    const cards = document.querySelectorAll('.product-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.animationDelay = `${index * 0.1}s`;
                            card.classList.add('fade-in', 'active');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const scrollElements = document.querySelectorAll('.scroll-reveal, .product-card, .about-content, .hero-content');
    scrollElements.forEach(el => {
        el.classList.add('scroll-reveal');
        observer.observe(el);
    });
}

// Product interactions
function initializeProductInteractions() {
    const productCards = document.querySelectorAll('.product-card');
    const quickViewBtns = document.querySelectorAll('.quick-view-btn');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    
    // Add click event to product cards
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
     // Add click event to product image to show quick view
    productCards.forEach(card => {
        const productImage = card.querySelector('.product-image');
        productImage.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card toggle
            const productName = card.querySelector('.product-name').textContent;
            const productType = card.dataset.product;
            showQuickView(productName, productType);
        });
    });
    
    // Add to cart functionality
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('.product-name').textContent;
            const productPrice = productCard.querySelector('.product-price').textContent;
            
            addToCart(productName, productPrice);
            
            // Visual feedback
            this.textContent = 'ADDED!';
            this.style.background = 'var(--accent-yellow)';
            this.style.color = 'var(--primary-bg)';
            
            setTimeout(() => {
                this.textContent = 'ADD TO CART';
                this.style.background = 'transparent';
                this.style.color = 'var(--text-primary)';
            }, 2000);
        });
    });
}

// Smooth scrolling for CTA button
function initializeSmoothScrolling() {
    const ctaBtn = document.querySelector('.cta-btn');
    
    if (ctaBtn) {
        ctaBtn.addEventListener('click', function() {
            const collectionSection = document.querySelector('#collection');
            if (collectionSection) {
                collectionSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
}

// Initialize animations
function initializeAnimations() {
    // Add floating animation to hero elements
    const heroElements = document.querySelectorAll('.hero-product, .nav-logo-img');
    heroElements.forEach(el => {
        el.classList.add('floating');
    });
    
    // Add pulse animation to important buttons
    const importantBtns = document.querySelectorAll('.cta-btn, .checkout-btn');
    importantBtns.forEach(btn => {
        btn.classList.add('pulse');
    });
    
    // Initialize parallax effect
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
    
    // Add glitch effect to text elements randomly
    setInterval(() => {
        const glitchTexts = document.querySelectorAll('.glitch-text');
        const randomText = glitchTexts[Math.floor(Math.random() * glitchTexts.length)];
        
        if (randomText && Math.random() < 0.1) { // 10% chance
            randomText.style.animation = 'none';
            setTimeout(() => {
                randomText.style.animation = '';
            }, 100);
        }
    }, 3000);
}

// Quick view modal
function showQuickView(productName, productType) {
    // Determine the image source based on product type
    let imageSrc = '';
    let altImageSrc = '';
    
    switch(productType) {
        case 'hoodie-1':
            imageSrc = 'assets/bungixbobfront.png';
            altImageSrc = 'assets/bungixbobback.png';
            break;
        case 'tee-1':
            imageSrc = 'assets/tee-1.png';
            altImageSrc = 'assets/tee-2.png';
            break;
        case 'jacket-1':
            imageSrc = 'assets/jacket-1.png';
            break;
        case 'pants-1':
            imageSrc = 'assets/pants-1.png';
            break;
        default:
            imageSrc = 'assets/placeholder-product.jpg';
    }
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="glitch-text" data-text="${productName}">${productName}</h2>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <div class="product-preview">
                    <div class="preview-images">
                        <img src="${imageSrc}" alt="${productName}" class="preview-img active">
                        ${altImageSrc ? `<img src="${altImageSrc}" alt="${productName} Alt" class="preview-img">` : ''}
                        ${altImageSrc ? `
                            <div class="image-toggle">
                                <button class="toggle-btn active" data-image="0">View 1</button>
                                <button class="toggle-btn" data-image="1">View 2</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="product-details">
                        <p class="product-description">Premium cyberpunk streetwear designed for the tech elite. Features advanced materials and futuristic aesthetics.</p>
                        <div class="size-selector">
                            <label>Size:</label>
                            <select class="size-select">
                                <option>S</option>
                                <option>M</option>
                                <option>L</option>
                                <option>XL</option>
                            </select>
                        </div>
                        <button class="add-to-cart-modal glitch-btn" data-text="ADD TO CART">ADD TO CART</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.modal-close');
    const addToCartBtn = modal.querySelector('.add-to-cart-modal');
    const toggleBtns = modal.querySelectorAll('.toggle-btn');
    const previewImgs = modal.querySelectorAll('.preview-img');
    
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    addToCartBtn.addEventListener('click', () => {
        const size = modal.querySelector('.size-select').value;
        const price = productName.includes('HOODIE') ? '$89.99' :
                     productName.includes('TEE') ? '$49.99' :
                     productName.includes('JACKET') ? '$149.99' : '$79.99';
        addToCart(productName, price, size);
        document.body.removeChild(modal);
    });
    
    // Image toggle functionality
    toggleBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            previewImgs.forEach(img => img.classList.remove('active'));
            
            btn.classList.add('active');
            previewImgs[index].classList.add('active');
        });
    });
    
    // Animate modal in
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
    }, 10);
}

// Add to cart functionality
function addToCart(name, price, size = 'M') {
    // Get existing cart or create new one
    let cart = JSON.parse(localStorage.getItem('bobbyCart')) || [];
    
    // Add item to cart
    const item = {
        id: Date.now(),
        name: name,
        price: price,
        size: size,
        quantity: 1
    };
    
    cart.push(item);
    localStorage.setItem('bobbyCart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Show notification
    showNotification(`${name} added to cart!`);
}

// Update cart count in navigation
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('bobbyCart')) || [];
    const cartCount = document.querySelector('.cart-count');
    
    if (cartCount) {
        cartCount.textContent = cart.length;
        
        // Add animation
        cartCount.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
        }, 200);
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-text">${message}</span>
            <div class="notification-progress"></div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Sound effects removed for better user experience

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});

// Add CSS for notifications and modals
const additionalStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--secondary-bg);
        border: 2px solid var(--accent-purple);
        border-radius: 8px;
        padding: 1rem;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 0 20px var(--glow-purple);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .notification-text {
        color: var(--text-primary);
        font-weight: 600;
    }
    
    .notification-progress {
        height: 2px;
        background: var(--accent-yellow);
        animation: progress 3s linear;
    }
    
    @keyframes progress {
        from { width: 100%; }
        to { width: 0%; }
    }
    
    .quick-view-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .modal-content {
        background: var(--primary-bg);
        border: 2px solid var(--accent-purple);
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        transform: scale(0.8);
        transition: transform 0.3s ease;
        box-shadow: 0 0 30px var(--glow-purple);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-color);
    }
    
    .modal-close {
        background: none;
        border: none;
        color: var(--text-primary);
        font-size: 2rem;
        cursor: pointer;
        transition: color 0.3s ease;
    }
    
    .modal-close:hover {
        color: var(--accent-yellow);
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .product-preview {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: start;
    }
    
    .preview-images {
        position: relative;
    }
    
    .preview-img {
        width: 100%;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background: #fff;
        padding: 20px;
        object-fit: contain;
        display: none;
    }
    
    .preview-img.active {
        display: block;
    }
    
    .image-toggle {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        justify-content: center;
    }
    
    .toggle-btn {
        background: var(--secondary-bg);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .toggle-btn.active {
        background: var(--accent-purple);
        border-color: var(--accent-purple);
    }
    
    .toggle-btn:hover {
        border-color: var(--accent-yellow);
    }
    
    .product-details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .product-description {
        color: var(--text-secondary);
        line-height: 1.6;
    }
    
    .size-selector {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .size-selector label {
        color: var(--text-primary);
        font-weight: 600;
    }
    
    .size-select {
        background: var(--secondary-bg);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 0.5rem;
        border-radius: 4px;
    }
    
    .add-to-cart-modal {
        width: 100%;
        margin-top: 1rem;
    }
    
    @media (max-width: 768px) {
        .product-preview {
            grid-template-columns: 1fr;
        }
    }
`;

// Inject additional styles
const mainStyleSheet = document.createElement('style');
mainStyleSheet.textContent = additionalStyles;
document.head.appendChild(mainStyleSheet);