/**
 * Cart Cleanup Script
 * 
 * Clears any corrupted or test cart data that might be auto-adding items
 */

(function() {
    console.log('🧹 Cart Cleanup Starting');
    
    // List of all possible cart storage keys
    const cartKeys = [
        'bobby-cart-items',
        'bobby-streetwear-cart',
        'bobby-cart-backup',
        'bobby-cart-backup-universal',
        'bobby-cart-last-save',
        'bobby-checkout-in-progress',
        'checkout-in-progress',
        'cart-backup',
        'cartItems',
        'cart_items'
    ];
    
    // Function to clear all cart data
    function clearAllCartData() {
        console.log('🗑️ Clearing all cart data...');
        
        cartKeys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    console.log(`Removing ${key}:`, value);
                    localStorage.removeItem(key);
                }
            } catch (error) {
                console.error(`Error removing ${key}:`, error);
            }
        });
        
        // Also clear any cart data from window objects
        if (window.BobbyCart) {
            window.BobbyCart.items = [];
            console.log('Cleared BobbyCart items');
        }
        
        if (window.cartManager) {
            window.cartManager.items = [];
            console.log('Cleared cartManager items');
        }
        
        // Update cart count displays
        const cartCounts = document.querySelectorAll('.cart-count');
        cartCounts.forEach(element => {
            element.textContent = '0';
            element.style.display = 'none';
        });
        
        console.log('✅ All cart data cleared');
    }
    
    // Function to check for problematic cart data
    function checkForProblematicData() {
        let foundProblems = false;
        
        cartKeys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                if (value && value !== '[]' && value !== 'null') {
                    console.log(`Found data in ${key}:`, value);
                    
                    // Check if it contains test data like "navy blazer"
                    if (value.toLowerCase().includes('navy') || 
                        value.toLowerCase().includes('blazer') ||
                        value.toLowerCase().includes('test')) {
                        console.warn(`⚠️ Found problematic test data in ${key}`);
                        foundProblems = true;
                    }
                }
            } catch (error) {
                console.error(`Error checking ${key}:`, error);
            }
        });
        
        return foundProblems;
    }
    
    // Check for problems on load
    if (checkForProblematicData()) {
        console.log('🚨 Problematic cart data detected - clearing automatically');
        clearAllCartData();
    }
    
    // Expose cleanup function globally for manual use
    window.clearCartData = clearAllCartData;
    window.checkCartData = checkForProblematicData;
    
    // Add a manual clear button for debugging (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        setTimeout(() => {
            const clearButton = document.createElement('button');
            clearButton.textContent = 'Clear Cart Data (Debug)';
            clearButton.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 10000;
                background: red;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
            `;
            clearButton.onclick = () => {
                clearAllCartData();
                alert('Cart data cleared!');
            };
            document.body.appendChild(clearButton);
        }, 1000);
    }
    
    console.log('✅ Cart Cleanup Ready');
})();