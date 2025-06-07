/**
 * Cart Image Fix
 * This script ensures cart images display properly by using the Shopify API images
 * when available rather than relying on mock data or fallbacks.
 */

(function() {
    console.log('🔄 Cart Image Fix - Running...');
    
    // Function to ensure cart images are displayed correctly
    function fixCartImages() {
        // Check for cart items in localStorage
        try {
            const cartKey = 'bobby-streetwear-cart';
            const storedCart = localStorage.getItem(cartKey);
            
            if (storedCart) {
                const cartData = JSON.parse(storedCart);
                let cartItems = Array.isArray(cartData) ? cartData : (cartData.items || []);
                let fixedCount = 0;
                
                // Make sure each cart item has a valid image URL
                cartItems.forEach(item => {
                    // Only process items with missing or broken images
                    if (!item.image || !item.image.startsWith('http')) {
                        // If the item has a mainImage property, use that
                        if (item.mainImage && item.mainImage.startsWith('http')) {
                            item.image = item.mainImage;
                            fixedCount++;
                        }
                        // If the item has images array, use the first image
                        else if (item.images && item.images.length > 0 && item.images[0].startsWith('http')) {
                            item.image = item.images[0];
                            fixedCount++;
                        }
                    }
                });
                
                // Save changes if any images were fixed
                if (fixedCount > 0) {
                    console.log(`✅ Fixed ${fixedCount} cart image URLs in localStorage`);
                    
                    if (Array.isArray(cartData)) {
                        localStorage.setItem(cartKey, JSON.stringify(cartItems));
                    } else {
                        cartData.items = cartItems;
                        localStorage.setItem(cartKey, JSON.stringify(cartData));
                    }
                }
            }
        } catch (error) {
            console.error('Error processing cart images in localStorage:', error);
        }
        
        // Check for cart images in the DOM
        setTimeout(fixDOMCartImages, 500);
    }
    
    // Fix images in the DOM
    function fixDOMCartImages() {
        // Find all cart item images in the DOM
        const cartImages = document.querySelectorAll('.cart-item-image');
        if (cartImages.length === 0) {
            console.log('No cart images found in DOM yet, will check again soon');
            // Try again in a second if cart might not be rendered yet
            setTimeout(fixDOMCartImages, 1000);
            return;
        }
        
        let fixedCount = 0;
        
        cartImages.forEach(img => {
            // Only fix broken images
            if (img.complete && img.naturalWidth === 0) {
                // Get the cart item
                const cartItem = img.closest('.cart-item');
                if (!cartItem) return;
                
                // Get item ID from the data attribute
                const itemId = cartItem.dataset.itemId;
                if (!itemId) return;
                
                // Try to find the item in localStorage
                try {
                    const cartData = JSON.parse(localStorage.getItem('bobby-streetwear-cart')) || [];
                    const items = Array.isArray(cartData) ? cartData : (cartData.items || []);
                    const item = items.find(i => i.id === itemId);
                    
                    if (item && item.image && item.image.startsWith('http')) {
                        // Use the image from localStorage
                        img.src = item.image;
                        img.style.display = 'block';
                        fixedCount++;
                    } else {
                        // If no image is available, show a letter placeholder
                        const title = cartItem.querySelector('.cart-item-title')?.textContent || '';
                        if (title) {
                            // Create a placeholder with the first letter
                            const placeholder = document.createElement('div');
                            placeholder.className = 'cart-item-no-image';
                            placeholder.textContent = title.charAt(0).toUpperCase();
                            img.parentNode.insertBefore(placeholder, img);
                            img.style.display = 'none';
                        }
                    }
                } catch (error) {
                    console.error('Error retrieving cart data:', error);
                }
            }
        });
        
        if (fixedCount > 0) {
            console.log(`✅ Fixed ${fixedCount} cart images in the DOM`);
        }
    }
    
    // Run the fix
    fixCartImages();
    
    // Run initial fix
    fixCartImages();
    
    // Monitor cart changes
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Check for cart becoming visible
            if (mutation.type === 'attributes' &&
                mutation.attributeName === 'class' &&
                (mutation.target.classList.contains('active') ||
                 !mutation.target.classList.contains('hidden'))) {
                
                if (mutation.target.id === 'cart-sidebar' ||
                    mutation.target.id === 'cart-modal' ||
                    mutation.target.classList.contains('cart-sidebar')) {
                    
                    fixDOMCartImages();
                }
            }
            
            // Check for new cart items
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 &&
                        (node.classList.contains('cart-item') ||
                         node.querySelector('.cart-item'))) {
                        
                        // Wait a moment for the image to be added
                        setTimeout(fixDOMCartImages, 100);
                        break;
                    }
                }
            }
        }
    });
    
    // Start observing document for cart changes
    observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true
    });
    
    // Listen for add to cart events
    document.addEventListener('DOMContentLoaded', () => {
        if (window.cartManager) {
            // Store original addItem method
            const originalAddItem = window.cartManager.addItem;
            
            // Override addItem to ensure images are properly set
            window.cartManager.addItem = function(product, selectedVariant) {
                // Make sure product has a valid image
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
                }
                
                // Call original method
                return originalAddItem.call(this, product, selectedVariant);
            };
        }
    });
    
    console.log('🔄 Cart image fix installed and running');
})();