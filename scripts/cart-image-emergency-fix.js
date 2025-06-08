/**
 * Cart Image Helper
 * This script ensures cart items correctly display Shopify API images.
 * No emergency fixes needed as cart.js already handles this properly.
 */

(function() {
    // Wait for DOMContentLoaded to ensure cart manager is available
    document.addEventListener('DOMContentLoaded', () => {
        if (window.cartManager) {
            // Store original addItem method
            const originalAddItem = window.cartManager.addItem;
            
            // Override addItem to ensure images are properly set
            window.cartManager.addItem = function(product, selectedVariant) {
                // Make sure product has a valid image from the Shopify API
                if (product) {
                    // Prioritize the correct image for this variant/color
                    if (selectedVariant && selectedVariant.image) {
                        product.image = selectedVariant.image;
                    }
                    else if (product.colorImages && selectedVariant && selectedVariant.color && 
                             product.colorImages[selectedVariant.color] && 
                             product.colorImages[selectedVariant.color].length > 0) {
                        product.image = product.colorImages[selectedVariant.color][0];
                    }
                    else if (product.mainImage) {
                        product.image = product.mainImage;
                    }
                    else if (product.images && product.images.length > 0) {
                        product.image = product.images[0];
                    }
                    // No image available - will use default placeholder
                }
                
                // Call original method
                return originalAddItem.call(this, product, selectedVariant);
            };
            
            // Cart image helper attached to cart manager
        } else {
            // Cart manager not available yet
        }
    });
})();