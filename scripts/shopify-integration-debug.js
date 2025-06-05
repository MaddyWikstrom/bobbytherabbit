// Shopify Integration Debug Version
// This will help identify configuration issues

console.log('🔍 Shopify Integration Debug Mode Started');

// Configuration - Replace with your actual Shopify details
const SHOPIFY_CONFIG = {
    domain: 'bobbytherabbit.com.myshopify.com', // Replace with your Shopify domain
    storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4', // Replace with your token
    apiVersion: '2024-01'
};

// Test the configuration
console.log('📋 Current Configuration:', {
    domain: SHOPIFY_CONFIG.domain,
    tokenLength: SHOPIFY_CONFIG.storefrontAccessToken.length,
    tokenPreview: SHOPIFY_CONFIG.storefrontAccessToken.substring(0, 10) + '...'
});

// Check if configuration is still default
if (SHOPIFY_CONFIG.domain === 'your-store.myshopify.com') {
    console.error('❌ ERROR: You need to update SHOPIFY_CONFIG.domain with your actual Shopify store domain!');
    console.log('📌 Example: If your Shopify admin URL is https://admin.shopify.com/store/bobby-streetwear');
    console.log('   Then your domain should be: bobby-streetwear.myshopify.com');
}

if (SHOPIFY_CONFIG.storefrontAccessToken === 'your-storefront-access-token') {
    console.error('❌ ERROR: You need to update SHOPIFY_CONFIG.storefrontAccessToken with your actual token!');
    console.log('📌 To get your token:');
    console.log('   1. Go to Shopify Admin → Settings → Apps and sales channels');
    console.log('   2. Click "Develop apps" → Create or select your app');
    console.log('   3. Go to "API credentials" → "Storefront API access token"');
}

// Test function to verify API connection
async function testShopifyConnection() {
    console.log('🔄 Testing Shopify API connection...');
    
    const testQuery = `
        {
            shop {
                name
                primaryDomain {
                    url
                }
            }
        }
    `;
    
    try {
        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: testQuery })
        });
        
        console.log('📡 Response Status:', response.status);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📡 Raw Response (first 500 chars):', responseText.substring(0, 500));
        
        // Try to parse as JSON
        try {
            const data = JSON.parse(responseText);
            
            if (data.errors) {
                console.error('❌ GraphQL Errors:', data.errors);
                
                // Check for common errors
                if (data.errors.some(e => e.message.includes('access token'))) {
                    console.error('🔑 Token Issue: Your access token is invalid or has incorrect permissions');
                    console.log('📌 Make sure your token has these Storefront API permissions:');
                    console.log('   - unauthenticated_read_product_listings');
                    console.log('   - unauthenticated_write_checkouts');
                    console.log('   - unauthenticated_read_checkouts');
                }
            } else if (data.data && data.data.shop) {
                console.log('✅ SUCCESS! Connected to:', data.data.shop.name);
                console.log('🏪 Store URL:', data.data.shop.primaryDomain.url);
                return true;
            }
        } catch (parseError) {
            console.error('❌ Failed to parse response as JSON');
            console.log('📌 This usually means:');
            console.log('   1. The domain is incorrect (getting Shopify 404 page)');
            console.log('   2. CORS is blocking the request (check browser network tab)');
            console.log('   3. The API version is incorrect');
            
            // Check if it's HTML
            if (responseText.includes('<!doctype') || responseText.includes('<html')) {
                console.error('🌐 Received HTML instead of JSON - domain is likely incorrect');
                console.log('📌 Your domain should look like: your-store-name.myshopify.com');
                console.log('   NOT: your-store-name.com');
                console.log('   NOT: admin.shopify.com/store/your-store-name');
            }
        }
        
    } catch (error) {
        console.error('❌ Network Error:', error);
        console.log('📌 Possible causes:');
        console.log('   1. CORS blocking (are you running this locally?)');
        console.log('   2. Network connectivity issues');
        console.log('   3. Shopify API is down');
    }
    
    return false;
}

// Test loading the Buy SDK
function testBuySDK() {
    console.log('🔄 Checking Shopify Buy SDK...');
    
    if (window.ShopifyBuy) {
        console.log('✅ Shopify Buy SDK is loaded');
        
        try {
            const client = window.ShopifyBuy.buildClient({
                domain: SHOPIFY_CONFIG.domain,
                storefrontAccessToken: SHOPIFY_CONFIG.storefrontAccessToken,
                apiVersion: SHOPIFY_CONFIG.apiVersion
            });
            
            console.log('✅ Shopify client created successfully');
            
            // Test fetching products
            client.product.fetchAll(1).then(products => {
                console.log('✅ Successfully fetched products:', products.length);
                if (products.length > 0) {
                    console.log('📦 First product:', {
                        id: products[0].id,
                        title: products[0].title,
                        price: products[0].variants[0].price
                    });
                }
            }).catch(error => {
                console.error('❌ Error fetching products:', error);
            });
            
        } catch (error) {
            console.error('❌ Error creating Shopify client:', error);
        }
    } else {
        console.log('⏳ Shopify Buy SDK not loaded yet, loading now...');
        
        const script = document.createElement('script');
        script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
        script.onload = () => {
            console.log('✅ Shopify Buy SDK loaded');
            testBuySDK(); // Try again
        };
        script.onerror = () => {
            console.error('❌ Failed to load Shopify Buy SDK');
        };
        document.head.appendChild(script);
    }
}

// Run tests when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Running Shopify Integration Diagnostics...');
    
    // Test 1: Configuration
    if (SHOPIFY_CONFIG.domain === 'your-store.myshopify.com' || 
        SHOPIFY_CONFIG.storefrontAccessToken === 'your-storefront-access-token') {
        console.error('⛔ STOP: You must update the configuration first!');
        console.log('📝 Edit this file and replace the placeholder values in SHOPIFY_CONFIG');
        return;
    }
    
    // Test 2: API Connection
    const connected = await testShopifyConnection();
    
    if (connected) {
        // Test 3: Buy SDK
        testBuySDK();
    }
    
    console.log('📊 Diagnostics complete. Check the messages above for any errors.');
});

// Helper function to get Shopify domain from current URL
function getShopifyDomainHelper() {
    console.log('💡 TIP: To find your Shopify domain:');
    console.log('1. Log into your Shopify admin');
    console.log('2. Look at the URL - it will be something like:');
    console.log('   https://admin.shopify.com/store/YOUR-STORE-NAME');
    console.log('3. Your domain is: YOUR-STORE-NAME.myshopify.com');
}

// Export helper functions
window.ShopifyDebug = {
    testConnection: testShopifyConnection,
    testSDK: testBuySDK,
    getDomainHelp: getShopifyDomainHelper,
    config: SHOPIFY_CONFIG
};

console.log('💡 Debug functions available:');
console.log('   ShopifyDebug.testConnection() - Test API connection');
console.log('   ShopifyDebug.testSDK() - Test Buy SDK');
console.log('   ShopifyDebug.getDomainHelp() - Get help finding your domain');