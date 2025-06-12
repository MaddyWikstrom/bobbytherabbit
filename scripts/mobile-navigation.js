// Mobile Navigation Drawer Implementation
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileNav();
});

function initializeMobileNav() {
    // Create mobile nav elements if they don't exist
    if (!document.querySelector('.mobile-nav-toggle')) {
        createMobileNavElements();
    }

    // Set up event listeners
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileNavDrawer = document.querySelector('.mobile-nav-drawer');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    const mobileNavClose = document.querySelector('.mobile-nav-close');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', toggleMobileNav);
    }

    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', closeMobileNav);
    }

    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', closeMobileNav);
    }

    // Close nav when clicking on a link
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileNav);
    });

    // Close nav on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileNav();
        }
    });

    // Update visibility on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileNav();
        }
    });
}

function createMobileNavElements() {
    // Create mobile nav toggle button
    const navContainer = document.querySelector('.nav-container');
    
    if (!navContainer) return;
    
    const mobileNavToggle = document.createElement('button');
    mobileNavToggle.className = 'mobile-nav-toggle';
    mobileNavToggle.setAttribute('aria-label', 'Toggle navigation menu');
    mobileNavToggle.innerHTML = `
        <span class="toggle-bar"></span>
        <span class="toggle-bar"></span>
        <span class="toggle-bar"></span>
    `;
    
    navContainer.appendChild(mobileNavToggle);
    
    // Create mobile nav drawer
    const body = document.body;
    
    const mobileNavOverlay = document.createElement('div');
    mobileNavOverlay.className = 'mobile-nav-overlay';
    
    const mobileNavDrawer = document.createElement('div');
    mobileNavDrawer.className = 'mobile-nav-drawer';
    
    // Get the original menu items and clone them for mobile
    const originalNavMenu = document.querySelector('.nav-menu');
    let mobileNavContent = '';
    
    if (originalNavMenu) {
        mobileNavContent = `
            <div class="mobile-nav-header">
                <div class="mobile-nav-brand">BUNGI X BOBBY</div>
                <button class="mobile-nav-close">×</button>
            </div>
            <ul class="mobile-nav-menu">
                ${Array.from(originalNavMenu.querySelectorAll('.nav-item')).map(item => {
                    const link = item.querySelector('.nav-link');
                    const href = link ? link.getAttribute('href') : '#';
                    const text = link ? link.textContent : '';
                    return `<li class="mobile-nav-item">
                        <a href="${href}" class="mobile-nav-link glitch-hover" data-text="${text}">${text}</a>
                    </li>`;
                }).join('')}
            </ul>
            <div class="mobile-nav-footer">
                <div class="mobile-social-links">
                    <a href="https://instagram.com/bungi_bobby_the_rabbit" class="social-link instagram" target="_blank">
                        <span class="hologram-btn">
                            <img src="assets/instagram-logo.svg" alt="Instagram" class="social-icon">
                        </span>
                    </a>
                    <a href="https://tiktok.com/@bungi__" class="social-link tiktok" target="_blank">
                        <span class="hologram-btn">
                            <img src="assets/tiktok-logo.svg" alt="TikTok" class="social-icon">
                        </span>
                    </a>
                </div>
            </div>
        `;
    } else {
        // Fallback menu if original menu not found
        mobileNavContent = `
            <div class="mobile-nav-header">
                <div class="mobile-nav-brand">BUNGI X BOBBY</div>
                <button class="mobile-nav-close">×</button>
            </div>
            <ul class="mobile-nav-menu">
                <li class="mobile-nav-item"><a href="index.html" class="mobile-nav-link glitch-hover" data-text="HOME">HOME</a></li>
                <li class="mobile-nav-item"><a href="products.html" class="mobile-nav-link glitch-hover" data-text="SHOP">SHOP</a></li>
                <li class="mobile-nav-item"><a href="index.html#collection" class="mobile-nav-link glitch-hover" data-text="COLLECTION">COLLECTION</a></li>
                <li class="mobile-nav-item"><a href="index.html#about" class="mobile-nav-link glitch-hover" data-text="ABOUT">ABOUT</a></li>
                <li class="mobile-nav-item"><a href="index.html#contact" class="mobile-nav-link glitch-hover" data-text="CONTACT">CONTACT</a></li>
            </ul>
            <div class="mobile-nav-footer">
                <div class="mobile-social-links">
                    <a href="https://instagram.com/bungi_bobby_the_rabbit" class="social-link instagram" target="_blank">
                        <span class="hologram-btn">
                            <img src="assets/instagram-logo.svg" alt="Instagram" class="social-icon">
                        </span>
                    </a>
                    <a href="https://tiktok.com/@bungi__" class="social-link tiktok" target="_blank">
                        <span class="hologram-btn">
                            <img src="assets/tiktok-logo.svg" alt="TikTok" class="social-icon">
                        </span>
                    </a>
                </div>
            </div>
        `;
    }
    
    mobileNavDrawer.innerHTML = mobileNavContent;
    
    body.appendChild(mobileNavOverlay);
    body.appendChild(mobileNavDrawer);
    
    // Add CSS for mobile nav
    addMobileNavStyles();
}

function toggleMobileNav() {
    const mobileNavDrawer = document.querySelector('.mobile-nav-drawer');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    
    if (mobileNavDrawer.classList.contains('active')) {
        closeMobileNav();
    } else {
        openMobileNav();
    }
}

function openMobileNav() {
    const mobileNavDrawer = document.querySelector('.mobile-nav-drawer');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    
    if (mobileNavDrawer && mobileNavOverlay) {
        document.body.classList.add('nav-open');
        mobileNavDrawer.classList.add('active');
        mobileNavOverlay.classList.add('active');
    }
}

function closeMobileNav() {
    const mobileNavDrawer = document.querySelector('.mobile-nav-drawer');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    
    if (mobileNavDrawer && mobileNavOverlay) {
        document.body.classList.remove('nav-open');
        mobileNavDrawer.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
    }
}

function addMobileNavStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Enhanced Mobile Navigation Styles */
        @media (max-width: 768px) {
            .mobile-nav-toggle {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                width: 32px;
                height: 26px;
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 0;
                margin-left: auto;
                position: relative;
                z-index: 1001;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                min-width: 44px;
                min-height: 44px;
                align-items: center;
            }
            
            .toggle-bar {
                display: block;
                width: 100%;
                height: 3px;
                background: var(--accent-purple);
                border-radius: 2px;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
                box-shadow: 0 0 3px rgba(139, 92, 246, 0.3);
            }
            
            .nav-open .mobile-nav-toggle .toggle-bar:nth-child(1) {
                transform: translateY(11px) rotate(45deg);
            }
            
            .nav-open .mobile-nav-toggle .toggle-bar:nth-child(2) {
                opacity: 0;
                transform: scale(0);
            }
            
            .nav-open .mobile-nav-toggle .toggle-bar:nth-child(3) {
                transform: translateY(-11px) rotate(-45deg);
            }
        }

        .mobile-nav-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            z-index: 999;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s ease;
        }
        
        .mobile-nav-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        .mobile-nav-drawer {
            position: fixed;
            top: 0;
            right: 0;
            width: 320px;
            max-width: 85vw;
            height: 100%;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(15px);
            border-left: 2px solid var(--accent-purple);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            box-shadow: -10px 0 40px rgba(139, 92, 246, 0.4);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        .mobile-nav-drawer.active {
            transform: translateX(0);
        }
        
        .mobile-nav-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2rem 2rem 1.5rem;
            border-bottom: 2px solid rgba(139, 92, 246, 0.3);
            background: rgba(139, 92, 246, 0.05);
        }
        
        .mobile-nav-brand {
            font-family: 'Orbitron', monospace;
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--accent-purple);
            text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }
        
        .mobile-nav-close {
            background: rgba(139, 92, 246, 0.1);
            border: 2px solid rgba(139, 92, 246, 0.3);
            color: var(--text-primary);
            font-size: 1.8rem;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 8px;
            transition: all 0.3s ease;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }
        
        .mobile-nav-close:hover {
            background: rgba(139, 92, 246, 0.2);
            border-color: var(--accent-purple);
            transform: scale(1.05);
        }
        
        .mobile-nav-menu {
            list-style: none;
            padding: 2rem;
            flex: 1;
        }
        
        .mobile-nav-item {
            margin-bottom: 1.5rem;
        }
        
        .mobile-nav-link {
            color: var(--text-primary);
            text-decoration: none;
            font-size: 1.2rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            display: block;
            padding: 1rem 0;
            position: relative;
            transition: all 0.3s ease;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            border-radius: 8px;
        }
        
        .mobile-nav-link::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(139, 92, 246, 0.1);
            border-radius: 8px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .mobile-nav-link::after {
            content: '';
            position: absolute;
            bottom: 0.5rem;
            left: 0;
            width: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--accent-purple), var(--accent-yellow));
            border-radius: 2px;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .mobile-nav-link:hover::before {
            opacity: 1;
        }
        
        .mobile-nav-link:hover::after {
            width: 100%;
        }
        
        .mobile-nav-link:hover {
            color: var(--accent-purple);
            transform: translateX(5px);
        }
        
        .mobile-nav-footer {
            padding: 2rem;
            border-top: 2px solid rgba(139, 92, 246, 0.3);
            background: rgba(139, 92, 246, 0.05);
        }
        
        .mobile-social-links {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
        }
        
        .mobile-social-links .hologram-btn {
            min-width: 50px;
            height: 50px;
            padding: 0.8rem;
            border-radius: 12px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }
        
        .mobile-social-links .social-icon {
            width: 20px;
            height: 20px;
        }
        
        /* Ensure toggle is only visible on mobile */
        .mobile-nav-toggle {
            display: none;
        }
        
        @media (max-width: 768px) {
            .mobile-nav-toggle {
                display: flex;
            }
            
            .nav-menu {
                display: none;
            }
        }
        
        /* Small mobile adjustments */
        @media (max-width: 480px) {
            .mobile-nav-drawer {
                width: 100vw;
                max-width: 100vw;
                border-left: none;
                border-top: 2px solid var(--accent-purple);
            }
            
            .mobile-nav-header {
                padding: 1.5rem 1.5rem 1rem;
            }
            
            .mobile-nav-brand {
                font-size: 1.1rem;
            }
            
            .mobile-nav-close {
                width: 40px;
                height: 40px;
                font-size: 1.6rem;
            }
            
            .mobile-nav-menu {
                padding: 1.5rem;
            }
            
            .mobile-nav-link {
                font-size: 1.1rem;
                padding: 0.8rem 0;
            }
            
            .mobile-nav-footer {
                padding: 1.5rem;
            }
            
            .mobile-social-links .hologram-btn {
                min-width: 44px;
                height: 44px;
                padding: 0.6rem;
            }
            
            .mobile-social-links .social-icon {
                width: 18px;
                height: 18px;
            }
            
            /* Hide original nav social links on very small screens */
            .nav-actions .social-links {
                display: none;
            }
        }
        
        /* Extra small devices */
        @media (max-width: 360px) {
            .mobile-nav-header {
                padding: 1.2rem 1.2rem 0.8rem;
            }
            
            .mobile-nav-brand {
                font-size: 1rem;
            }
            
            .mobile-nav-menu {
                padding: 1.2rem;
            }
            
            .mobile-nav-link {
                font-size: 1rem;
                letter-spacing: 1px;
            }
        }
        
        /* Body scroll lock when nav is open */
        body.nav-open {
            overflow: hidden;
            position: fixed;
            width: 100%;
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
            .mobile-nav-drawer,
            .mobile-nav-overlay,
            .toggle-bar,
            .mobile-nav-link {
                transition-duration: 0.01ms !important;
            }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .mobile-nav-drawer {
                border-left: 3px solid var(--accent-purple);
                background: rgba(0, 0, 0, 0.95);
            }
            
            .mobile-nav-header,
            .mobile-nav-footer {
                border-color: var(--accent-purple);
            }
            
            .toggle-bar {
                background: var(--accent-purple);
                box-shadow: none;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}