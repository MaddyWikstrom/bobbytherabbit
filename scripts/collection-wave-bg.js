// Collection Wave Background Script
document.addEventListener('DOMContentLoaded', function() {
    // Get the collection section
    const collectionSection = document.getElementById('collection');
    
    if (!collectionSection) {
        console.warn('Collection section not found');
        return;
    }
    
    // Ensure section has proper positioning
    collectionSection.style.position = 'relative';
    collectionSection.style.overflow = 'hidden';
    collectionSection.style.width = '100%';
    
    // Create and add wave pattern background
    const patternElement = document.createElement('div');
    patternElement.className = 'wave-pattern-bg';
    
    // Apply styles for full-width coverage with gray color scheme
    patternElement.style.position = 'absolute';
    patternElement.style.top = '0';
    patternElement.style.left = '0';
    patternElement.style.width = '100%';
    patternElement.style.height = '100%';
    patternElement.style.opacity = '0.08';
    patternElement.style.zIndex = '1';
    patternElement.style.backgroundSize = 'cover';
    patternElement.style.backgroundPosition = 'center center';
    patternElement.style.backgroundRepeat = 'no-repeat';
    patternElement.style.animation = 'breathePattern 15s ease-in-out infinite alternate';
    
    // Add SVG wave pattern with gray gradient
    patternElement.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' preserveAspectRatio='none' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3Cfilter id='distortion' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01 0.02' numOctaves='2' result='noise' seed='5'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='noise' scale='30' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Cmask id='contourMask'%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Cg filter='url(%23distortion)'%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,400 C100,250 300,550 500,400 C700,250 900,550 1100,400 C1300,250 1500,550 1700,400' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,350 C100,200 300,500 500,350 C700,200 900,500 1100,350 C1300,200 1500,500 1700,350' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,300 C100,150 300,450 500,300 C700,150 900,450 1100,300 C1300,150 1500,450 1700,300' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,250 C100,100 300,400 500,250 C700,100 900,400 1100,250 C1300,100 1500,400 1700,250' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,200 C100,50 300,350 500,200 C700,50 900,350 1100,200 C1300,50 1500,350 1700,200' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,150 C100,0 300,300 500,150 C700,0 900,300 1100,150 C1300,0 1500,300 1700,150' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,100 C100,-50 300,250 500,100 C700,-50 900,250 1100,100 C1300,-50 1500,250 1700,100' /%3E%3Cpath fill='none' stroke='black' stroke-width='10' d='M-100,50 C100,-100 300,200 500,50 C700,-100 900,200 1100,50 C1300,-100 1500,200 1700,50' /%3E%3C/g%3E%3C/mask%3E%3ClinearGradient id='grayGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23aaaaaa' /%3E%3Cstop offset='50%25' stop-color='%23888888' /%3E%3Cstop offset='100%25' stop-color='%23555555' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grayGrad)' mask='url(%23contourMask)' /%3E%3C/svg%3E")`;
    
    // Add pattern element as first child
    collectionSection.prepend(patternElement);
    
    // Ensure container and content are properly positioned over the pattern and centered
    const container = collectionSection.querySelector('.container');
    if (container) {
        container.style.position = 'relative';
        container.style.zIndex = '2';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.textAlign = 'center';
        container.style.width = '100%';
        container.style.padding = '0';
        container.style.margin = '0 auto';
        container.style.boxSizing = 'border-box';
    }
    
    // Fix product grid to extend full width and center all items
    const productGrid = collectionSection.querySelector('.product-grid-scroll');
    if (productGrid) {
        productGrid.style.display = 'flex';
        productGrid.style.justifyContent = 'center';
        productGrid.style.alignItems = 'center';
        productGrid.style.width = '100%';
        productGrid.style.overflowX = 'auto';
        productGrid.style.margin = '0 auto';
        productGrid.style.padding = '0';
        productGrid.style.boxSizing = 'border-box';
        
        // Center each product in the scroll
        const productItems = productGrid.querySelectorAll('.product-card');
        productItems.forEach(item => {
            item.style.margin = '0 1rem';
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'center';
        });
    }
    
    // Make scroll container full width
    const scrollContainer = collectionSection.querySelector('.product-scroll-container');
    if (scrollContainer) {
        scrollContainer.style.display = 'flex';
        scrollContainer.style.justifyContent = 'center';
        scrollContainer.style.width = '100%';
        scrollContainer.style.overflowX = 'auto';
        scrollContainer.style.boxSizing = 'border-box';
        scrollContainer.style.padding = '0';
    }
    
    // Center the view-all-container
    const viewAllContainer = collectionSection.querySelector('.view-all-container');
    if (viewAllContainer) {
        viewAllContainer.style.display = 'flex';
        viewAllContainer.style.justifyContent = 'center';
        viewAllContainer.style.width = '100%';
        viewAllContainer.style.marginTop = '30px';
    }
    
    // Reposition arrows to the edges of the screen inline with products
    const arrowContainer = collectionSection.querySelector('.arrow-container');
    if (arrowContainer) {
        arrowContainer.style.position = 'absolute';
        arrowContainer.style.width = '100%';
        arrowContainer.style.top = '50%';
        arrowContainer.style.left = '0';
        arrowContainer.style.transform = 'translateY(-50%)';
        arrowContainer.style.display = 'flex';
        arrowContainer.style.justifyContent = 'space-between';
        arrowContainer.style.padding = '0';
        arrowContainer.style.margin = '0';
        arrowContainer.style.boxSizing = 'border-box';
        arrowContainer.style.pointerEvents = 'none'; // So it doesn't block content
        arrowContainer.style.zIndex = '10';
        
        // Style the left arrow to be at the left edge
        const leftArrow = collectionSection.querySelector('.left-arrow');
        if (leftArrow) {
            leftArrow.style.position = 'relative';
            leftArrow.style.left = '20px';
            leftArrow.style.width = '40px';
            leftArrow.style.height = '40px';
            leftArrow.style.borderRadius = '50%';
            leftArrow.style.backgroundColor = '#a855f7';
            leftArrow.style.color = '#ffffff';
            leftArrow.style.display = 'flex';
            leftArrow.style.alignItems = 'center';
            leftArrow.style.justifyContent = 'center';
            leftArrow.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.5)';
            leftArrow.style.pointerEvents = 'auto'; // Restore pointer events
        }
        
        // Style the right arrow to be at the right edge
        const rightArrow = collectionSection.querySelector('.right-arrow');
        if (rightArrow) {
            rightArrow.style.position = 'relative';
            rightArrow.style.right = '20px';
            rightArrow.style.width = '40px';
            rightArrow.style.height = '40px';
            rightArrow.style.borderRadius = '50%';
            rightArrow.style.backgroundColor = '#a855f7';
            rightArrow.style.color = '#ffffff';
            rightArrow.style.display = 'flex';
            rightArrow.style.alignItems = 'center';
            rightArrow.style.justifyContent = 'center';
            rightArrow.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.5)';
            rightArrow.style.pointerEvents = 'auto'; // Restore pointer events
        }
        
        // Add scrolling functionality to arrows
        const scrollGrid = collectionSection.querySelector('.product-grid-scroll');
        
        // Add click handlers to the already styled arrows
        if (leftArrow && scrollGrid) {
            leftArrow.addEventListener('click', function(e) {
                e.preventDefault();
                // Scroll left by one product width (300px) plus gap (32px)
                scrollGrid.scrollBy({
                    left: -332,
                    behavior: 'smooth'
                });
            });
        }
        
        if (rightArrow && scrollGrid) {
            rightArrow.addEventListener('click', function(e) {
                e.preventDefault();
                // Scroll right by one product width (300px) plus gap (32px)
                scrollGrid.scrollBy({
                    left: 332,
                    behavior: 'smooth'
                });
            });
        }
    }
    
    // Add animation keyframes and additional styles if they don't exist yet
    if (!document.getElementById('wave-pattern-keyframes')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'wave-pattern-keyframes';
        styleElement.textContent = `
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
            
            /* Additional styles for full-width collection section with no gaps */
            .collection {
                width: 100vw !important;
                max-width: 100% !important;
                margin: 0 !important;
                position: relative !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
                padding: 0 !important;
                left: 50% !important;
                right: 50% !important;
                margin-left: -50vw !important;
                margin-right: -50vw !important;
                background-color: var(--secondary-bg) !important;
                padding-bottom: 60px !important; /* Added bottom padding for View All button */
                min-height: 600px !important; /* Ensure minimum height */
            }
            
            .product-scroll-container {
                width: 100% !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                overflow-x: auto !important; /* Changed from hidden to auto */
                position: relative !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            
            .product-grid-scroll {
                display: flex !important;
                flex-wrap: nowrap !important;
                overflow-x: visible !important; /* Changed from auto to visible */
                padding: 2rem !important; /* Increased padding */
                -ms-overflow-style: none !important;  /* IE and Edge */
                scrollbar-width: none !important;  /* Firefox */
                justify-content: flex-start !important; /* Changed from center to flex-start */
                align-items: center !important;
                min-width: max-content !important; /* Added to prevent children from getting cut off */
                margin: 0 auto !important;
                scroll-behavior: smooth !important;
                gap: 2rem !important;
                min-height: 450px !important; /* Ensure enough height for products */
                box-sizing: border-box !important;
            }
            
            /* Fix product card display */
            .product-card {
                flex: 0 0 auto !important; /* Prevent shrinking */
                width: 300px !important; /* Fixed width as recommended */
                height: auto !important;
                min-height: 400px !important;
                overflow: visible !important; /* Changed from hidden to visible */
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                position: relative !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                margin: 0 !important;
            }
            
            .product-image {
                width: 100% !important;
                height: 0 !important; /* Use padding-bottom for aspect ratio */
                padding-bottom: 100% !important; /* 1:1 aspect ratio */
                position: relative !important;
                overflow: hidden !important;
                background: #fff !important;
                display: block !important;
            }
            
            .product-image img {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                object-fit: contain !important;
                object-position: center !important;
                padding: 10px !important;
                box-sizing: border-box !important;
            }
            
            .product-grid-scroll::-webkit-scrollbar {
                display: none !important;
            }
            
            .product-grid-scroll > * {
                flex: 0 0 auto !important;
                max-width: 100% !important;
                height: auto !important;
                transform: translateZ(0) !important; /* Fix for Safari rendering */
            }
            
            /* Fix for mobile sizing */
            @media (max-width: 768px) {
                .product-card {
                    width: 280px !important;
                    max-width: 85vw !important;
                    min-height: 350px !important;
                }
                
                .product-image {
                    height: 250px !important;
                    min-height: 250px !important;
                }
                
                .product-image img {
                    max-height: 230px !important;
                }
            }
            
            /* Fix for very small screens */
            @media (max-width: 480px) {
                .product-card {
                    width: 220px !important;
                    max-width: 80vw !important;
                    min-height: 300px !important;
                }
                
                .product-image {
                    height: 200px !important;
                    min-height: 200px !important;
                }
            }
            
            @media screen and (max-width: 768px) {
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
                
                .collection {
                    padding: 2rem 0 !important;
                }
                
                .product-grid-scroll {
                    padding: 0.5rem !important;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // Ensure all direct children except the pattern have higher z-index
    Array.from(collectionSection.children).forEach(child => {
        if (child !== patternElement) {
            child.style.position = 'relative';
            child.style.zIndex = '2';
        }
    });
    
    console.log('Wave pattern background added to collection section');
});