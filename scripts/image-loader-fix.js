// Enhanced Image Loading and Error Handling

document.addEventListener('DOMContentLoaded', function() {
    // Initialize image loader
    initializeImageLoader();
});

function initializeImageLoader() {
    // Apply to all product images on the page
    fixProductImages();
    
    // Apply to cart images when the cart is opened
    document.addEventListener('click', function(e) {
        if (e.target.closest('#cart-btn, .cart-btn, .cart-icon')) {
            // Apply fixes after a slight delay to ensure cart is rendered
            setTimeout(fixCartImages, 100);
        }
    });
    
    // Watch for DOM changes to catch dynamically added images
    setupImageObserver();
}

function fixProductImages() {
    // Target all product images throughout the site
    const productImages = document.querySelectorAll('.product-image img, .product-img, .preview-img, .cart-item-image');
    
    productImages.forEach(img => {
        enhanceImage(img);
    });
}

function fixCartImages() {
    const cartImages = document.querySelectorAll('.cart-item-image, .cart-product-image');
    
    cartImages.forEach(img => {
        enhanceImage(img);
    });
}

function enhanceImage(img) {
    // Skip if already enhanced
    if (img.dataset.enhanced === 'true') return;
    
    // Mark as enhanced to avoid duplicate processing
    img.dataset.enhanced = 'true';
    
    // Store original source
    const originalSrc = img.src;
    
    // Get parent product element
    const productElement = img.closest('.product-card, .cart-item, .product-detail-item');
    const productType = productElement ? productElement.dataset.product || 'default' : 'default';
    
    // Generate fallback sources array
    const fallbackSources = generateFallbackSources(originalSrc, productType);
    
    // Apply fallback handling
    applyImageFallbacks(img, fallbackSources);
    
    // Preload image
    preloadImage(originalSrc);
}

function generateFallbackSources(originalSrc, productType) {
    // Extract filename and extension
    const urlParts = originalSrc.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Extract product identifier from filename or product type
    let productIdentifier = '';
    if (productType && typeof productType === 'string') {
        productIdentifier = productType.toLowerCase().trim();
    } else if (filename) {
        // Try to extract identifier from filename
        const filenameParts = filename.split('-');
        if (filenameParts.length > 1) {
            productIdentifier = filenameParts[0].toLowerCase();
        }
    }
    
    // Generate domain-relative and absolute URLs to try
    const currentDomain = window.location.origin;
    
    // Default fallbacks that are likely to exist
    const fallbacks = [
        originalSrc, // Original source as provided
        
        // Try with domain-relative paths - these help with cross-domain issues
        originalSrc.startsWith('/') ? originalSrc : `/${originalSrc}`,
        
        // Try with absolute URL if it's a relative path
        originalSrc.startsWith('http') ? originalSrc : `${currentDomain}/${originalSrc}`,
        
        // Try common directory paths
        `/assets/${filename}`,
        `assets/${filename}`,
        
        // Default fallbacks
        `/assets/product-placeholder.png`,
        `assets/product-placeholder.png`,
        `/assets/featured-hoodie.svg`,
        `assets/featured-hoodie.svg`
    ];
    
    // Add product-type specific fallbacks
    if (productType) {
        switch (productType.toLowerCase()) {
            case 'hoodie':
            case 'hoodie-1':
                fallbacks.push('assets/hoodie-1.svg', 'assets/hoodie-front.svg', 'assets/featured-hoodie.svg');
                break;
            case 'tee':
            case 'tee-1':
                fallbacks.push('assets/tee-1.svg', 'assets/tee-1.png');
                break;
            case 'jacket':
            case 'jacket-1':
                fallbacks.push('assets/jacket-1.svg', 'assets/jacket-1.png');
                break;
            case 'pants':
            case 'pants-1':
                fallbacks.push('assets/pants-1.svg', 'assets/pants-1.png');
                break;
        }
    }
    
    return fallbacks;
}

function applyImageFallbacks(img, fallbackSources) {
    // Create a unique error handler for this image
    const uniqueFallbackFunction = `handleImageError_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Add fallback handler to window
    window[uniqueFallbackFunction] = function(imgElement) {
        const currentSrc = imgElement.src;
        const fallbacks = imgElement.dataset.fallbacks ? JSON.parse(imgElement.dataset.fallbacks) : [];
        
        // Find current index
        const currentIndex = fallbacks.indexOf(currentSrc);
        
        // Try next fallback if available
        if (currentIndex < fallbacks.length - 1) {
            const nextSrc = fallbacks[currentIndex + 1];
            console.log(`Image load failed for ${currentSrc}, trying fallback: ${nextSrc}`);
            imgElement.src = nextSrc;
        } else {
            // We've tried all fallbacks, show placeholder
            console.log(`All fallbacks failed for image, showing placeholder`);
            showImagePlaceholder(imgElement);
        }
    };
    
    // Store fallbacks as data attribute
    img.dataset.fallbacks = JSON.stringify(fallbackSources);
    
    // Set the error handler
    img.onerror = function() { 
        window[uniqueFallbackFunction](this); 
    };
    
    // Force image reload to check current source
    if (img.complete) {
        if (!img.naturalWidth) {
            // Image failed to load, try first fallback
            window[uniqueFallbackFunction](img);
        }
    }
}

function showImagePlaceholder(img) {
    // Create placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    placeholder.innerHTML = `
        <div class="placeholder-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        </div>
        <div class="placeholder-text">Image unavailable</div>
    `;
    
    // Insert placeholder
    if (img.parentNode) {
        // Style the placeholder to match image dimensions
        placeholder.style.width = img.width + 'px';
        placeholder.style.height = img.height + 'px';
        
        // Replace image with placeholder
        img.style.display = 'none';
        img.parentNode.insertBefore(placeholder, img.nextSibling);
    }
}

function preloadImage(src) {
    const preloader = new Image();
    preloader.src = src;
}

function setupImageObserver() {
    // Create mutation observer to watch for new images
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Check if any new nodes contain images
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Check for images within this node
                        const newImages = node.querySelectorAll('img');
                        newImages.forEach(img => {
                            enhanceImage(img);
                        });
                        
                        // Check if the node itself is an image
                        if (node.tagName === 'IMG') {
                            enhanceImage(node);
                        }
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Add placeholder styles
const placeholderStyles = `
    .image-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(20, 20, 35, 0.6);
        border: 1px dashed var(--accent-purple);
        border-radius: 8px;
        color: var(--accent-purple);
        padding: 1rem;
        min-height: 100px;
        min-width: 100px;
    }
    
    .placeholder-icon {
        margin-bottom: 0.5rem;
        opacity: 0.7;
    }
    
    .placeholder-text {
        font-size: 0.8rem;
        opacity: 0.8;
    }
`;

// Inject placeholder styles
const styleEl = document.createElement('style');
styleEl.textContent = placeholderStyles;
document.head.appendChild(styleEl);