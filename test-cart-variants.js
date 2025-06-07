/**
 * Test script for debugging cart variant display issues
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add test button if not already present
    if (!document.getElementById('test-variants-btn')) {
        const container = document.querySelector('.test-buttons') || document.body;
        const button = document.createElement('button');
        button.id = 'test-variants-btn';
        button.textContent = 'Test Variant Formats';
        button.addEventListener('click', testVariantFormats);
        container.appendChild(button);
    }
    
    console.log('Cart variant test script loaded');
});

// Test different variant format handling
function testVariantFormats() {
    console.log('Testing different variant formats...');
    
    // Clear existing cart first
    if (window.BobbyCart) {
        BobbyCart.clearCart();
    }
    
    // Test products with different variant formats
    setTimeout(() => {
        // Test product 1: String variant
        addTestProduct({
            id: 'test-product-1',
            title: 'Test Product - String Variant',
            price: 19.99,
            image: 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png',
            variants: { 
                color: 'Black', 
                size: 'M' 
            },
            variantText: 'Color: Black, Size: M',
            shopifyId: 'gid://shopify/ProductVariant/123456789'
        });
        
        // Test product 2: Object variant directly
        addTestProduct({
            id: 'test-product-2',
            title: 'Test Product - Object Variant',
            price: 24.99,
            image: 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png',
            variants: { 
                color: 'White', 
                size: 'L' 
            },
            // No variantText provided, should be generated from variants
            shopifyId: 'gid://shopify/ProductVariant/987654321'
        });
        
        // Test product 3: BUNGI X BOBBY COWBOY (mentioned in feedback)
        addTestProduct({
            id: 'bungi-x-bobby-cowboy',
            title: 'BUNGI X BOBBY COWBOY Men\'s t-shirt',
            price: 29.99,
            image: 'https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png',
            variants: [  // Array instead of object - should be handled properly
                { color: 'White' },
                { size: 'M' }
            ],
            shopifyId: 'gid://shopify/ProductVariant/44444444'
        });
        
        // Show the cart after adding all test products
        setTimeout(() => {
            if (window.BobbyCart) {
                BobbyCart.openCart();
                console.log('Current cart items:', BobbyCart.state.items);
            }
        }, 500);
    }, 100);
}

// Helper function to add test product
function addTestProduct(product) {
    console.log('Adding test product to cart:', product);
    
    if (window.BobbyCart) {
        BobbyCart.addToCart(product);
    } else if (window.BobbyCarts) {
        BobbyCarts.addToCart(product);
    } else {
        console.error('No cart system available for testing');
    }
}