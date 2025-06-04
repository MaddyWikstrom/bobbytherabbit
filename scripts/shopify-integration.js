let PRODUCT_MAPPING = {
  "bungi-x-bobby-rabbit-hardware-unisex-hoodie": {
    shopifyProductId: "BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie",
    variants: [
      {
        option1: "Black",
        sku: "9004018_10779",
        price: "50.00",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png?v=1748999462",
      },
      {
        option1: "Black",
        sku: "9004018_10780",
        price: "50.00",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-back-683f9d11a9742.png?v=1748999463",
      },
      {
        option1: "Black",
        sku: "9004018_10781",
        price: "50.00",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-navy-blazer-front-683f9d11ab4fe.png?v=1748999463",
      },
    ],
  },
  "bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie": {
    shopifyProductId: "BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Unisex Hoodie",
    variants: [
      {
        option1: "S",
        sku: "4356716_10774",
        price: "50.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png?v=1748999411",
      },
      {
        option1: "M",
        sku: "4356716_10775",
        price: "50.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-back-683f9ce10ab8f.png?v=1748999410",
      },
      {
        option1: "L",
        sku: "4356716_10776",
        price: "50.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png?v=1748999411",
      },
    ],
  },
  "bungi-x-bobby-lightmode-rabbit-hardware-mens-t-shirt": {
    shopifyProductId: "BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Men's t-shirt",
    variants: [
      {
        option1: "XS",
        sku: "7836547_8850",
        price: "27.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png?v=1748999335",
      },
      {
        option1: "S",
        sku: "7836547_8851",
        price: "27.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-back-683f9c9fdd370.png?v=1748999335",
      },
      {
        option1: "M",
        sku: "7836547_8852",
        price: "27.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-right-683f9c9fdd489.png?v=1748999335",
      },
    ],
  },
};

// Function to fetch products from Netlify function
async function fetchProducts() {
    try {
        const response = await fetch('/.netlify/functions/get-products');
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching products:', data.error);
            return;
        }

        console.log('✅ Products loaded from Netlify function:', data);

        // Generate mapping
        const mapping = {};
        data.forEach(product => {
            mapping[product.node.title] = product.node.id;
        });

        console.log('📋 Product Mapping:');
        console.log(mapping);

        // Generate the PRODUCT_MAPPING code
        let mappingCode = 'const PRODUCT_MAPPING = {\n';
        data.forEach(product => {
            const productId = product.node.id;
            const productName = product.node.title;
            mappingCode += `    '${productName}': {\n`;
            mappingCode += `        shopifyProductId: '${productId}',\n`;
            mappingCode += `        // Add variant information here\n`;
            mappingCode += `    },\n`;
        });
        mappingCode += '};';

        console.log('📝 Generated PRODUCT_MAPPING code:\n');
        console.log(mappingCode);

        // Store the mapping in localStorage
        localStorage.setItem('shopifyProductMapping', mappingCode);

        // Load the product mapping
        const storedMapping = localStorage.getItem('shopifyProductMapping');
        if (storedMapping) {
            try {
                PRODUCT_MAPPING = eval('(' + storedMapping + ')'); // WARNING: Use with caution
                console.log('✅ Loaded product mapping from local storage');
            } catch (e) {
                console.error('❌ Error parsing product mapping from local storage:', e);
            }
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Load Shopify Buy Button SDK
function loadShopifySDK(callback) {
    if (window.ShopifyBuy) {
        callback();
        return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
    script.onload = callback;
    document.head.appendChild(script);
}

// Initialize Shopify client
function initializeShopifyClient() {
    if (!window.ShopifyBuy) {
        console.error('Shopify Buy SDK not loaded');
        return;
    }

    shopifyClient = window.ShopifyBuy.buildClient({
        domain: 'bobbytherabbit.com.myshopify.com',
        storefrontAccessToken: 'fb92c5b6df6a740fc5d5fc94c30dbd0d',
        apiVersion: '2024-01'
    });

    // Create or retrieve existing checkout
    const checkoutId = localStorage.getItem('shopifyCheckoutId');
    if (checkoutId) {
        shopifyClient.checkout.fetch(checkoutId).then((checkout) => {
            if (!checkout.completedAt) {
                shopifyCheckout = checkout;
            } else {
                // Checkout was completed, create a new one
                createNewCheckout();
            }
        }).catch(() => {
            createNewCheckout();
        });
    } else {
        createNewCheckout();
    }
}

// Create new Shopify checkout
function createNewCheckout() {
    shopifyClient.checkout.create().then((checkout) => {
        shopifyCheckout = checkout;
        localStorage.setItem('shopifyCheckoutId', checkout.id);
    });
}

// Redirect to Shopify checkout
function redirectToShopifyCheckout() {
    if (!shopifyCheckout) {
        console.error('No Shopify checkout available');
        return;
    }

    if (shopifyCheckout && shopifyCheckout.webUrl) {
        window.location.href = shopifyCheckout.webUrl;
    }
}

// Override the checkout button to use Shopify
function overrideCheckoutButton() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Show loading state
            this.innerHTML = '<span>REDIRECTING TO CHECKOUT...</span><div class="btn-glow"></div>';
            this.disabled = true;

            // Redirect to Shopify checkout
            redirectToShopifyCheckout();
        });
    }
}

// Initialize Shopify integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load Shopify SDK and initialize
    loadShopifySDK(() => {
        initializeShopifyClient();

        // Override checkout button
        setTimeout(overrideCheckoutButton, 1000);

         // Fetch products
        fetchProducts();
    });
});