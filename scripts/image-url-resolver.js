/**
 * Image URL Resolver - Utility for fixing and standardizing image URLs across the site
 * This can be imported by any file that needs to handle image URLs
 */

// Global namespace to avoid collisions
window.BobbyImageUtils = (function() {
    // Store attempted fixes to avoid redundant work
    const attemptedFixes = new Map();

    /**
     * Fix common issues with image URLs
     * @param {string} url - The original image URL
     * @return {string} - The fixed URL or fallback if unfixable
     */
    function fixImageUrl(url) {
        // Check cache first to avoid redundant processing
        if (attemptedFixes.has(url)) {
            return attemptedFixes.get(url);
        }

        // Default fallback
        const fallbackImage = '/assets/product-placeholder.png';
        
        if (!url) {
            attemptedFixes.set(url, fallbackImage);
            return fallbackImage;
        }
        
        // Handle if URL is malformed or product URL instead of image
        if (url.includes('product.html') || url === 'null' || url === window.location.href) {
            attemptedFixes.set(url, fallbackImage);
            return fallbackImage;
        }
        
        // Already a placeholder - keep it
        if (url.includes('product-placeholder')) {
            attemptedFixes.set(url, url);
            return url;
        }
        
        let fixedUrl = url;
        
        // Check for protocol-related issues
        if (fixedUrl.startsWith('//')) {
            fixedUrl = 'https:' + fixedUrl;
        }
        
        // Fix common Shopify CDN issues
        if (fixedUrl.includes('cdn.shopify.com')) {
            // Ensure HTTPS
            if (fixedUrl.startsWith('http:')) {
                fixedUrl = fixedUrl.replace('http:', 'https:');
            }
            
            // Fix any double slashes (except for protocol)
            fixedUrl = fixedUrl.replace(/([^:])\/\//g, '$1/');
            
            // Add proper extension if missing
            if (!fixedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i)) {
                // Try to detect if URL has parameters
                if (fixedUrl.includes('?')) {
                    fixedUrl = fixedUrl.replace('?', '.jpg?');
                } else {
                    fixedUrl += '.jpg';
                }
            }
        }
        
        // Cache the fixed URL
        attemptedFixes.set(url, fixedUrl);
        return fixedUrl;
    }

    /**
     * Ensure a URL is absolute with proper protocol
     * @param {string} url - The URL to make absolute
     * @return {string} - The absolute URL
     */
    function ensureAbsoluteUrl(url) {
        const fallbackImage = '/assets/product-placeholder.png';
        if (!url) return fallbackImage;
        
        try {
            // Check for common error patterns
            if (url.includes('product.html?id=')) {
                console.error(`Invalid image URL detected (contains product.html): ${url}`);
                return fallbackImage;
            }
            
            // If it's already an absolute URL, return it
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return fixImageUrl(url);
            }
            
            // If it's a protocol-relative URL (starts with //), add https:
            if (url.startsWith('//')) {
                return fixImageUrl('https:' + url);
            }
            
            // If it's a root-relative URL (starts with /), add the origin
            if (url.startsWith('/')) {
                return window.location.origin + url;
            }
            
            // If it's a relative URL without leading slash, assume it's relative to origin
            return window.location.origin + '/' + url;
        } catch (error) {
            console.error(`Error processing URL: ${url}`, error);
            return fallbackImage;
        }
    }

    /**
     * Create an image element with proper error handling
     * @param {string} src - Image source URL
     * @param {string} alt - Alt text for the image
     * @param {object} options - Additional options like classes, styles, etc.
     * @return {HTMLImageElement} - The created image element
     */
    function createImage(src, alt = '', options = {}) {
        const img = document.createElement('img');
        
        // Apply any classes
        if (options.className) {
            img.className = options.className;
        }
        
        // Apply any inline styles
        if (options.style) {
            Object.assign(img.style, options.style);
        }
        
        // Set alt text
        img.alt = alt;
        
        // Store original source
        img.setAttribute('data-original-src', src);
        
        // Set fallback if provided
        if (options.fallback) {
            img.setAttribute('data-fallback', options.fallback);
        } else {
            img.setAttribute('data-fallback', '/assets/product-placeholder.png');
        }
        
        // Add error handling
        img.onerror = function() {
            console.log('Image failed to load:', this.src);
            this.src = this.getAttribute('data-fallback') || '/assets/product-placeholder.png';
        };
        
        // Set src last so onerror can catch load failures
        img.src = fixImageUrl(src);
        
        return img;
    }

    /**
     * Fix image URLs in an array of product image URLs
     * @param {Array} imageUrls - Array of image URLs
     * @return {Array} - Array of fixed image URLs
     */
    function fixProductImages(imageUrls) {
        if (!Array.isArray(imageUrls)) {
            return [];
        }
        
        return imageUrls.map(url => fixImageUrl(url));
    }

    // Expose public methods
    return {
        fixImageUrl,
        ensureAbsoluteUrl,
        createImage,
        fixProductImages
    };
})();

// Apply to all images when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('data-processed')) {
            const originalSrc = img.src;
            img.setAttribute('data-original-src', originalSrc);
            img.setAttribute('data-processed', 'true');
            img.setAttribute('data-fallback', '/assets/product-placeholder.png');
            
            img.onerror = function() {
                console.log('Image failed to load:', this.src);
                this.src = '/assets/product-placeholder.png';
            };
            
            img.src = window.BobbyImageUtils.fixImageUrl(originalSrc);
        }
    });
});

console.log('Image URL Resolver loaded and ready');