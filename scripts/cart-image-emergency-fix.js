/**
 * Cart Image Helper
 * This script ensures cart items correctly display Shopify API images.
 * No emergency fixes needed as cart.js already handles this properly.
 */

(function() {
    console.log('🔄 Cart image helper initialized');
    
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
                        console.log('Using variant image:', selectedVariant.image);
                        product.image = selectedVariant.image;
                    } 
                    else if (product.colorImages && selectedVariant && selectedVariant.color && 
                             product.colorImages[selectedVariant.color] && 
                             product.colorImages[selectedVariant.color].length > 0) {
                        console.log('Using color-specific image:', product.colorImages[selectedVariant.color][0]);
                        product.image = product.colorImages[selectedVariant.color][0];
                    }
                    else if (product.mainImage) {
                        console.log('Using main product image:', product.mainImage);
                        product.image = product.mainImage;
                    }
                    else if (product.images && product.images.length > 0) {
                        console.log('Using first product image:', product.images[0]);
                        product.image = product.images[0];
                    }
                    else {
                        console.log('No product image found, will use placeholder');
                    }
                }
                
                // Call original method
                return originalAddItem.call(this, product, selectedVariant);
            };
            
            console.log('✅ Cart image helper attached to cart manager');
        } else {
            console.log('⚠️ Cart manager not available yet');
        }
    });
})();