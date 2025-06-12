/**
 * Universal Image Loader
 * Agnostic image loading solution that handles various image loading scenarios
 * without hardcoded domain restrictions
 */

class UniversalImageLoader {
    constructor() {
        this.placeholderImage = 'assets/product-placeholder.png';
        this.retryAttempts = 2;
        this.retryDelay = 1000;
        this.init();
    }

    init() {
        // Handle existing images
        this.processExistingImages();
        
        // Watch for new images
        this.observeNewImages();
        
        console.log('🖼️ Universal Image Loader initialized');
    }

    /**
     * Check if a URL is a valid image URL
     */
    isValidImageUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }

        // Remove query parameters and fragments for checking
        const cleanUrl = url.split('?')[0].split('#')[0];
        
        // Check for common image extensions
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
        const hasImageExtension = imageExtensions.some(ext => 
            cleanUrl.toLowerCase().endsWith(ext)
        );

        // If it has an image extension, it's likely valid
        if (hasImageExtension) {
            return true;
        }

        // Check for obvious non-image patterns
        const nonImagePatterns = [
            '.html',
            '.htm',
            '.php',
            '.asp',
            '.jsp',
            '.js',
            '.css',
            '.xml',
            '.json'
        ];

        const isNonImage = nonImagePatterns.some(pattern => 
            cleanUrl.toLowerCase().includes(pattern)
        );

        if (isNonImage) {
            return false;
        }

        // For URLs without clear extensions, assume they might be valid
        // (could be CDN URLs or dynamic image generators)
        return true;
    }

    /**
     * Attempt to load an image with retry logic
     */
    async loadImageWithRetry(imgElement, originalSrc, attempts = 0) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                imgElement.src = originalSrc;
                imgElement.style.display = '';
                resolve(true);
            };
            
            img.onerror = () => {
                if (attempts < this.retryAttempts) {
                    // Retry after delay
                    setTimeout(() => {
                        this.loadImageWithRetry(imgElement, originalSrc, attempts + 1)
                            .then(resolve)
                            .catch(reject);
                    }, this.retryDelay);
                } else {
                    reject(new Error('Image failed to load after retries'));
                }
            };
            
            img.src = originalSrc;
        });
    }

    /**
     * Handle image loading error
     */
    async handleImageError(imgElement) {
        const originalSrc = imgElement.src;
        
        console.log('🔄 Attempting to reload image:', originalSrc);
        
        try {
            await this.loadImageWithRetry(imgElement, originalSrc);
            console.log('✅ Image loaded successfully after retry:', originalSrc);
        } catch (error) {
            console.log('❌ Image failed to load, using placeholder:', originalSrc);
            
            // Try to load placeholder
            try {
                await this.loadImageWithRetry(imgElement, this.placeholderImage);
                console.log('✅ Placeholder image loaded');
            } catch (placeholderError) {
                console.log('❌ Placeholder also failed, hiding image');
                imgElement.style.display = 'none';
                imgElement.alt = 'Image not available';
            }
        }
    }

    /**
     * Set up image error handling for an element
     */
    setupImageErrorHandling(imgElement) {
        // Skip if already has error handling
        if (imgElement.hasAttribute('data-universal-loader')) {
            return;
        }

        // Mark as processed
        imgElement.setAttribute('data-universal-loader', 'true');

        // Validate the current src
        if (!this.isValidImageUrl(imgElement.src)) {
            console.warn('⚠️ Invalid image URL detected:', imgElement.src);
            imgElement.src = this.placeholderImage;
            return;
        }

        // Set up error handler
        imgElement.onerror = () => {
            this.handleImageError(imgElement);
        };

        // If image is already in error state, handle it
        if (imgElement.complete && imgElement.naturalWidth === 0) {
            this.handleImageError(imgElement);
        }
    }

    /**
     * Process all existing images on the page
     */
    processExistingImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => this.setupImageErrorHandling(img));
    }

    /**
     * Watch for new images being added to the DOM
     */
    observeNewImages() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Check if the node itself is an image
                            if (node.tagName === 'IMG') {
                                this.setupImageErrorHandling(node);
                            }
                            
                            // Check for images within the node
                            const images = node.querySelectorAll && node.querySelectorAll('img');
                            if (images) {
                                images.forEach(img => this.setupImageErrorHandling(img));
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Manually refresh all images (useful for debugging)
     */
    refreshAllImages() {
        const images = document.querySelectorAll('img[data-universal-loader]');
        images.forEach(img => {
            img.removeAttribute('data-universal-loader');
            this.setupImageErrorHandling(img);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.UniversalImageLoader = new UniversalImageLoader();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading
} else {
    // DOM is already loaded
    window.UniversalImageLoader = new UniversalImageLoader();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalImageLoader;
}