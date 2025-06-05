// Shopify Integration Debug Version
// This will help identify configuration issues

console.log('🔍 Shopify Integration Debug Mode Started');

// Configuration - Now uses Netlify functions to avoid CORS issues
const SHOPIFY_CONFIG = {
    domain: 'bobbytherabbit.myshopify.com',
    note: 'Direct API calls disabled - using Netlify functions to prevent CORS errors'
};

// Test the configuration
console.log('📋 Current Configuration:', {
    domain: SHOPIFY_CONFIG.domain,
    method: 'Netlify Functions (CORS-free)',
    note: SHOPIFY_CONFIG.note
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

// Test function to verify Netlify function connection
async function testShopifyConnection() {
    console.log('🔄 Testing Shopify connection via Netlify function...');
    
    try {
        const response = await fetch('/.netlify/functions/get-products');
        
        console.log('📡 Response Status:', response.status);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📡 Raw Response (first 500 chars):', responseText.substring(0, 500));
        
        // Try to parse as JSON
        try {
            const data = JSON.parse(responseText);
            
            if (data.error) {
                console.error('❌ Netlify Function Error:', data.error);
                console.log('📌 Common issues:');
                console.log('   1. Environment variables not set in Netlify Dashboard');
                console.log('   2. SHOPIFY_ADMIN_TOKEN missing or invalid');
                console.log('   3. Netlify function not deployed');
                return false;
            } else if (data.products && Array.isArray(data.products)) {
                console.log('✅ SUCCESS! Connected via Netlify function');
                console.log(`🛍️ Found ${data.products.length} products`);
                if (data.products.length > 0) {
                    console.log('📦 First product:', data.products[0].title);
                }
                return true;
            }
        } catch (parseError) {
            console.error('❌ Failed to parse response as JSON');
            console.log('📌 This usually means:');
            console.log('   1. Netlify function returned an error page');
            console.log('   2. Function is not deployed');
            console.log('   3. Environment variables are missing');
        }
        
    } catch (error) {
        console.error('❌ Network Error:', error);
        console.log('📌 Possible causes:');
        console.log('   1. Netlify function not deployed');
        console.log('   2. Network connectivity issues');
        console.log('   3. Function endpoint incorrect');
    }
    
    return false;
}

// Test loading the Buy SDK (disabled to prevent CORS)
function testBuySDK() {
    console.log('⚠️ Shopify Buy SDK testing disabled to prevent CORS issues');
    console.log('💡 All product data now comes from Netlify functions');
    console.log('📌 Direct Shopify Buy SDK calls have been replaced with CORS-free Netlify functions');
    
    // Note: Buy SDK initialization disabled to prevent CORS errors
    // All checkout and product functionality should use Netlify functions instead
    return;
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