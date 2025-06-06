/**
 * Emergency Cart Image Fix
 * This script runs immediately when loaded and fixes all cart images
 * by directly injecting correct Shopify CDN URLs based on product title matching
 */

(function() {
    console.log('🔄 Emergency Cart Image Fix - Running...');
    
    // Direct mapping of product titles to known working image URLs
    const DIRECT_IMAGE_MAPPINGS = {
        'BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie': 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png',
        'BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Unisex Hoodie': 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png',
        'BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Men\'s t-shirt': 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png',
        'Hoodie': 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png',
        'T-shirt': 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png',
        'Sweatshirt': 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-recycled-unisex-sweatshirt-white-front-683f9be9c4dea.png',
        'Joggers': 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085cf9.png',
        'Beanie': 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/cuffed-beanie-black-front-683f9a789ba58.png'
    };

    // Default fallback image if nothing else works
    const DEFAULT_IMAGE = 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png';
    
    // Function to fix cart item images by direct replacement
    function fixCartImages() {
        // First check if we have a cart in localStorage
        try {
            const cartKey = 'bobby-streetwear-cart';
            const storedCart = localStorage.getItem(cartKey);
            if (storedCart) {
                const cartData = JSON.parse(storedCart);
                let cartItems = Array.isArray(cartData) ? cartData : (cartData.items || []);
                let fixedCount = 0;
                
                // Fix each item's image URL directly
                cartItems.forEach(item => {
                    let fixedImage = null;
                    
                    // Try direct title match
                    if (item.title) {
                        for (const [titlePattern, imageUrl] of Object.entries(DIRECT_IMAGE_MAPPINGS)) {
                            if (item.title.includes(titlePattern)) {
                                fixedImage = imageUrl;
                                break;
                            }
                        }
                    }
                    
                    // If no match by title, try category matching
                    if (!fixedImage && item.title) {
                        const titleLower = item.title.toLowerCase();
                        if (titleLower.includes('hoodie')) fixedImage = DIRECT_IMAGE_MAPPINGS['Hoodie'];
                        else if (titleLower.includes('t-shirt') || titleLower.includes('tee')) fixedImage = DIRECT_IMAGE_MAPPINGS['T-shirt'];
                        else if (titleLower.includes('sweatshirt')) fixedImage = DIRECT_IMAGE_MAPPINGS['Sweatshirt'];
                        else if (titleLower.includes('joggers') || titleLower.includes('pants')) fixedImage = DIRECT_IMAGE_MAPPINGS['Joggers'];
                        else if (titleLower.includes('beanie') || titleLower.includes('hat')) fixedImage = DIRECT_IMAGE_MAPPINGS['Beanie'];
                    }
                    
                    // Apply fallback if we still don't have an image
                    if (!fixedImage) {
                        fixedImage = DEFAULT_IMAGE;
                    }
                    
                    // Update the item's image
                    if (fixedImage && item.image !== fixedImage) {
                        item.image = fixedImage;
                        fixedCount++;
                    }
                });
                
                // If we fixed any images, save back to localStorage
                if (fixedCount > 0) {
                    console.log(`✅ Fixed ${fixedCount} cart image URLs in localStorage`);
                    
                    // Save cart data back to localStorage
                    if (Array.isArray(cartData)) {
                        localStorage.setItem(cartKey, JSON.stringify(cartItems));
                    } else {
                        cartData.items = cartItems;
                        localStorage.setItem(cartKey, JSON.stringify(cartData));
                    }
                }
            }
        } catch (error) {
            console.error('Error fixing cart images in localStorage:', error);
        }
        
        // Now fix any images currently in the DOM
        setTimeout(fixDOMCartImages, 500);
    }
    
    // Fix images in the DOM directly
    function fixDOMCartImages() {
        // Find all cart item images in the DOM
        const cartImages = document.querySelectorAll('.cart-item-image');
        if (cartImages.length === 0) {
            console.log('No cart images found in DOM yet');
            // Try again in a second if cart might not be rendered yet
            setTimeout(fixDOMCartImages, 1000);
            return;
        }
        
        let fixedCount = 0;
        
        cartImages.forEach(img => {
            // Get product info
            const cartItem = img.closest('.cart-item');
            if (!cartItem) return;
            
            const title = cartItem.querySelector('.cart-item-title')?.textContent;
            if (!title) return;
            
            // Try to match with a known working image
            let fixedImage = null;
            
            // Try direct title match
            for (const [titlePattern, imageUrl] of Object.entries(DIRECT_IMAGE_MAPPINGS)) {
                if (title.includes(titlePattern)) {
                    fixedImage = imageUrl;
                    break;
                }
            }
            
            // If no match by title, try category matching
            if (!fixedImage) {
                const titleLower = title.toLowerCase();
                if (titleLower.includes('hoodie')) fixedImage = DIRECT_IMAGE_MAPPINGS['Hoodie'];
                else if (titleLower.includes('t-shirt') || titleLower.includes('tee')) fixedImage = DIRECT_IMAGE_MAPPINGS['T-shirt'];
                else if (titleLower.includes('sweatshirt')) fixedImage = DIRECT_IMAGE_MAPPINGS['Sweatshirt'];
                else if (titleLower.includes('joggers') || titleLower.includes('pants')) fixedImage = DIRECT_IMAGE_MAPPINGS['Joggers'];
                else if (titleLower.includes('beanie') || titleLower.includes('hat')) fixedImage = DIRECT_IMAGE_MAPPINGS['Beanie'];
            }
            
            // Apply fallback if we still don't have an image
            if (!fixedImage) {
                fixedImage = DEFAULT_IMAGE;
            }
            
            // Apply the fix
            if (fixedImage && img.src !== fixedImage) {
                console.log(`Fixing image for: ${title} → ${fixedImage}`);
                img.src = fixedImage;
                img.style.display = 'block';
                
                // Hide any placeholder that might be showing
                const placeholder = img.nextElementSibling;
                if (placeholder && placeholder.classList.contains('cart-item-placeholder')) {
                    placeholder.style.display = 'none';
                }
                
                // Hide any retry button
                const retryBtn = img.nextElementSibling?.nextElementSibling;
                if (retryBtn && retryBtn.classList.contains('image-retry-btn')) {
                    retryBtn.style.display = 'none';
                }
                
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            console.log(`✅ Fixed ${fixedCount} cart images in the DOM`);
        } else {
            console.log('No cart images needed fixing in the DOM');
        }
    }
    
    // Run the fix
    fixCartImages();
    
    // Set up a MutationObserver to fix images when cart is opened
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' && 
                (mutation.target.classList.contains('active') || 
                 !mutation.target.classList.contains('hidden'))) {
                
                // Something was shown - might be the cart
                if (mutation.target.id === 'cart-sidebar' || 
                    mutation.target.id === 'cart-modal' || 
                    mutation.target.classList.contains('cart-sidebar')) {
                    
                    console.log('Cart opened - checking for images to fix');
                    fixDOMCartImages();
                }
            }
            
            // Also look for added cart items
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // See if any cart items were added
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && // Element node
                        (node.classList.contains('cart-item') || 
                         node.querySelector('.cart-item'))) {
                        
                        console.log('Cart items added - checking for images to fix');
                        fixDOMCartImages();
                        break;
                    }
                }
            }
        });
    });
    
    // Start observing the entire document for cart-related changes
    observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true
    });
    
    console.log('🔄 Cart image emergency fix installed and running');
})();