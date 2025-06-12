// Products Management System - No Fallbacks
class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.currentCategory = 'all';
        this.currentSort = 'featured';
        this.currentView = 'grid';
        this.searchQuery = '';
        
        this.init();
    }

    async init() {
        try {
            // Use the ShopifyProductLoader to fetch products with real Shopify variant IDs
            if (window.ShopifyProductLoader && typeof window.ShopifyProductLoader.loadProductsAndRender === 'function') {
                console.log('Using ShopifyProductLoader to fetch products with real variant IDs');
                
                // We'll load the products here but render them through our own system
                await this.loadProductsViaLoader();
            } else {
                // Fall back to original method if loader isn't available
                console.log('ShopifyProductLoader not available, using original loading method');
                await this.loadProducts();
            }
            
            this.setupEventListeners();
            this.renderProducts();
            
            // Add event listener for handling browser navigation (back/forward buttons)
            window.addEventListener('popstate', () => {
                // Remove any open modals when navigating
                this.removeAllModals();
            });
        } catch (error) {
            console.error('Error initializing product manager:', error);
            this.showNotification('Error loading products. Please try again later.', 'error');
        }
    }
    
    // New method to load products using ShopifyProductLoader
    async loadProductsViaLoader() {
        return new Promise((resolve, reject) => {
            try {
                // Create a temporary container to hold the products
                const tempContainer = document.createElement('div');
                tempContainer.style.display = 'none';
                document.body.appendChild(tempContainer);
                
                // Define a callback function to process the products
                window.processShopifyProducts = (products) => {
                    if (Array.isArray(products) && products.length > 0) {
                        console.log(`Received ${products.length} products from ShopifyProductLoader`);
                        
                        // Process each product to match our format
                        this.products = products.map(product => {
                            return {
                                id: product.id,  // This is already the Shopify GID
                                shopifyId: product.id,
                                title: product.title || 'Unknown Product',
                                description: this.cleanDescription(product.description || ''),
                                category: this.extractCategory(product.title || product.productType || ''),
                                price: parseFloat(product.price) || 0,
                                comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null,
                                images: [product.image],
                                mainImage: product.image || '',
                                variants: product.variants || [],
                                colors: product.selectedColor ? [{name: product.selectedColor, code: this.getColorCode(product.selectedColor)}] : [],
                                sizes: product.selectedSize ? [product.selectedSize] : [],
                                featured: false,
                                new: false,
                                sale: product.comparePrice && parseFloat(product.price) < parseFloat(product.comparePrice),
                                tags: [],
                                productType: '',
                                colorImages: {},
                                displayPriority: 999
                            };
                        });
                        
                        // Apply initial sorting
                        this.products.sort((a, b) => {
                            const priorityA = a.displayPriority || 999;
                            const priorityB = b.displayPriority || 999;
                            return priorityA - priorityB;
                        });
                        
                        this.filteredProducts = [...this.products];
                        
                        // Remove the temporary container
                        document.body.removeChild(tempContainer);
                        resolve();
                    } else {
                        console.warn('No products received from ShopifyProductLoader');
                        reject(new Error('No products received from ShopifyProductLoader'));
                    }
                };
                
                // Use the loader to fetch products
                // Store products in a global variable that our callback can access
                window.shopifyProducts = [];
                
                // Create a custom override of the loadProductsAndRender function
                const originalRender = window.ShopifyProductLoader.loadProductsAndRender;
                window.ShopifyProductLoader.loadProductsAndRender = async function(containerSelector, limit, collectionHandle) {
                    try {
                        // Get the products directly from Shopify
                        const products = await this.fetchProducts(limit, collectionHandle);
                        
                        // Store the products globally
                        window.shopifyProducts = products;
                        
                        // Call our callback
                        if (typeof window.processShopifyProducts === 'function') {
                            window.processShopifyProducts(products);
                        }
                        
                        // Restore original function
                        window.ShopifyProductLoader.loadProductsAndRender = originalRender;
                        
                        return products;
                    } catch (error) {
                        console.error('Error in loadProductsAndRender override:', error);
                        reject(error);
                    }
                };
                
                // Add the fetchProducts method if it doesn't exist
                if (!window.ShopifyProductLoader.fetchProducts) {
                    window.ShopifyProductLoader.fetchProducts = async function(limit = 50, collectionHandle = null) {
                        try {
                            // Shopify Storefront API configuration
                            const SHOPIFY_DOMAIN = 'mfdkk3-7g.myshopify.com';
                            const STOREFRONT_ACCESS_TOKEN = '8c6bd66766da4553701a1f1fe7d94dc4';
                            const API_VERSION = '2024-04';
                            
                            // GraphQL query
                            let query;
                            
                            if (collectionHandle) {
                                query = `
                                    {
                                        collection(handle: "${collectionHandle}") {
                                            products(first: ${limit}) {
                                                edges {
                                                    node {
                                                        id
                                                        title
                                                        handle
                                                        description
                                                        variants(first: 10) {
                                                            edges {
                                                                node {
                                                                    id
                                                                    title
                                                                    price {
                                                                        amount
                                                                    }
                                                                    availableForSale
                                                                }
                                                            }
                                                        }
                                                        images(first: 5) {
                                                            edges {
                                                                node {
                                                                    url
                                                                    altText
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                `;
                            } else {
                                query = `
                                    {
                                        products(first: ${limit}) {
                                            edges {
                                                node {
                                                    id
                                                    title
                                                    handle
                                                    description
                                                    variants(first: 10) {
                                                        edges {
                                                            node {
                                                                id
                                                                title
                                                                price {
                                                                    amount
                                                                }
                                                                availableForSale
                                                            }
                                                        }
                                                    }
                                                    images(first: 5) {
                                                        edges {
                                                            node {
                                                                url
                                                                altText
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                `;
                            }
                            
                            // Fetch products from Shopify Storefront API
                            const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN
                                },
                                body: JSON.stringify({ query })
                            });
                            
                            if (!response.ok) {
                                throw new Error(`API error: ${response.status} ${response.statusText}`);
                            }
                            
                            const result = await response.json();
                            
                            // Handle GraphQL errors
                            if (result.errors && result.errors.length > 0) {
                                throw new Error(`GraphQL error: ${result.errors[0].message}`);
                            }
                            
                            // Extract products from response
                            const productsData = collectionHandle
                                ? (result.data.collection?.products?.edges || [])
                                : (result.data.products?.edges || []);
                            
                            // Map to simpler format
                            return productsData.map(({ node: product }) => {
                                const firstVariant = product.variants.edges[0]?.node || {};
                                const firstImage = product.images.edges[0]?.node?.url || '';
                                
                                return {
                                    id: firstVariant.id || product.id, // Use variant ID as product ID
                                    title: product.title,
                                    description: product.description,
                                    price: firstVariant.price?.amount || 0,
                                    image: firstImage,
                                    handle: product.handle
                                };
                            });
                        } catch (error) {
                            console.error('Error fetching products:', error);
                            return [];
                        }
                    };
                }
                
                // Trigger the loader to fetch products
                window.ShopifyProductLoader.loadProductsAndRender('.temp-container', 50);
                
                // Set a timeout in case the loader doesn't respond
                setTimeout(() => {
                    reject(new Error('ShopifyProductLoader timed out'));
                }, 10000);
            } catch (error) {
                console.error('Error in loadProductsViaLoader:', error);
                reject(error);
            }
        });
    }
    
    // Helper to remove all modals
    removeAllModals() {
        // Remove any quick view modals
        const quickViewModal = document.querySelector('.quick-view-modal-overlay');
        if (quickViewModal) {
            quickViewModal.remove();
        }
        
        // Remove any related modal styles
        const modalStyles = document.querySelectorAll('style[data-modal-styles]');
        modalStyles.forEach(style => style.remove());
    }

    async loadProducts() {
        try {
            // Try to load from Shopify API via Netlify function first
            // Loading products from Shopify API
            const shopifyProducts = await this.loadShopifyProducts();
            
            if (shopifyProducts && shopifyProducts.length > 0) {
                // Deduplicate products by handle
                const uniqueProducts = new Map();
                shopifyProducts.forEach(product => {
                    if (!uniqueProducts.has(product.id)) {
                        uniqueProducts.set(product.id, product);
                    }
                });
                
                this.products = Array.from(uniqueProducts.values());
                
                // Apply initial sorting by display priority before applying any filters
                this.products.sort((a, b) => {
                    const priorityA = a.displayPriority || 999;
                    const priorityB = b.displayPriority || 999;
                    return priorityA - priorityB;
                });
                
                // Successfully loaded products from Shopify API
                this.filteredProducts = [...this.products];
                return;
            }
            
            // API calls will only work when deployed, not locally
            
            // Do not use mock products - clear products instead
            this.products = [];
            this.filteredProducts = [];
            
            // Show error notification
            this.showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
            this.filteredProducts = [];
        }
    }

    async loadShopifyProducts() {
        try {
            // First try direct Storefront API
            const directProducts = await this.loadProductsDirectFromStorefront();
            if (directProducts && directProducts.length > 0) {
                console.log(`Successfully loaded ${directProducts.length} products directly from Storefront API`);
                return directProducts;
            }
            
            // Fall back to Netlify function if direct method fails
            console.log('Direct Storefront API failed, falling back to Netlify function');
            
            // Use Netlify function to bypass CORS restrictions
            // Add a timestamp to prevent caching issues
            const timestamp = new Date().getTime();
            const url = `/.netlify/functions/get-products?_=${timestamp}`;
            
            // Log request for debugging
            console.log(`Fetching from URL: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                // Add a timeout to prevent hanging if the server is slow
                signal: AbortSignal.timeout(15000) // 15 second timeout (increased from 10)
            });

            console.log(`API response status: ${response.status}, type: ${response.headers.get('content-type')}`);

            if (!response.ok) {
                // Netlify function failed
                const errorText = await response.text();
                console.error(`Netlify function failed with status: ${response.status}`, errorText.substring(0, 200));
                throw new Error(`Netlify function failed with status: ${response.status}`);
            }

            // Get the response as text first for debugging
            const responseText = await response.text();
            console.log(`Response received, length: ${responseText.length} characters`);
            
            // Parse the JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error(`Failed to parse API response: ${parseError.message}`);
            }
            
            console.log('API returned data structure:', Object.keys(data));
            
            // Check if we received valid data in new or old format
            let products = [];
            
            if (data.products && Array.isArray(data.products)) {
                // New API format with products array inside an object
                console.log(`Found ${data.products.length} products in data.products`);
                products = data.products;
            } else if (Array.isArray(data)) {
                // Old API format with direct array
                console.log(`Found ${data.length} products in direct array`);
                products = data;
            } else {
                console.error('Received invalid product data from API');
                throw new Error('Invalid product data format received');
            }
            
            if (products.length > 0) {
                console.log(`Successfully loaded ${products.length} products from API`);
                // Convert Shopify products to our format
                return this.convertShopifyProducts(products);
            } else {
                console.error('No products found in API response');
                throw new Error('No products found in API response');
            }
            
        } catch (error) {
            console.error('Error loading Shopify products via Netlify function:', error);
            // Show error notification to user
            this.showNotification(`Error loading products: ${error.message}`, 'error');
            return null;
        }
    }

    async loadProductsDirectFromStorefront() {
        try {
            console.log('Attempting to load products directly from Shopify Storefront API');
            
            // Shopify Storefront API configuration
            const SHOPIFY_DOMAIN = 'mfdkk3-7g.myshopify.com';
            const STOREFRONT_ACCESS_TOKEN = '8c6bd66766da4553701a1f1fe7d94dc4';
            const API_VERSION = '2024-04';
            
            // GraphQL query - same as used in the Netlify function
            const productsQuery = `
                query Products {
                    products(first: 250) {
                        edges {
                            node {
                                id
                                title
                                handle
                                description
                                priceRange {
                                    minVariantPrice {
                                        amount
                                        currencyCode
                                    }
                                    maxVariantPrice {
                                        amount
                                        currencyCode
                                    }
                                }
                                featuredImage {
                                    url
                                    altText
                                }
                                images(first: 5) {
                                    edges {
                                        node {
                                            url
                                            altText
                                        }
                                    }
                                }
                                variants(first: 100) {
                                    edges {
                                        node {
                                            id
                                            title
                                            price {
                                                amount
                                                currencyCode
                                            }
                                            compareAtPrice {
                                                amount
                                                currencyCode
                                            }
                                            availableForSale
                                            selectedOptions {
                                                name
                                                value
                                            }
                                            image {
                                                url
                                            }
                                        }
                                    }
                                }
                                tags
                                productType
                            }
                        }
                    }
                }
            `;
            
            // Make direct request to Shopify Storefront API
            const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ query: productsQuery })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Storefront API request failed: ${response.status}`, errorText);
                return null;
            }
            
            const data = await response.json();
            
            if (data.errors) {
                console.error('GraphQL errors:', data.errors);
                return null;
            }
            
            if (!data.data || !data.data.products || !data.data.products.edges) {
                console.error('Invalid data structure returned from Storefront API');
                return null;
            }
            
            console.log(`Successfully loaded ${data.data.products.edges.length} products from Storefront API`);
            
            // Convert the products to our format
            return this.convertShopifyProducts(data.data.products.edges);
            
        } catch (error) {
            console.error('Error loading products directly from Storefront API:', error);
            return null;
        }
    }

    convertShopifyProducts(shopifyProducts) {
        // Create a map to track unique products by handle
        const uniqueProductsMap = new Map();
        
        shopifyProducts.forEach(edge => {
            const product = edge.node;
            
            // Skip if we already have this product
            if (uniqueProductsMap.has(product.handle)) {
                return;
            }
            
            // Extract images from Shopify - this will be our only image source
            const shopifyImages = product.images.edges.map(imgEdge => imgEdge.node.url);
            
            // Get the featured image (Shopify's designated thumbnail)
            const featuredImageUrl = product.featuredImage ? product.featuredImage.url : null;
            
            // Create a map to track which images are associated with which variants
            const variantImageMap = new Map();
            
            // Use images directly from Shopify API only
            let images = shopifyImages;
            
            // If we have a featured image, ensure it's the first image in our array
            if (featuredImageUrl && !images.includes(featuredImageUrl)) {
                // Featured image is not in the regular images array, add it at the beginning
                images = [featuredImageUrl, ...images];
            } else if (featuredImageUrl && images.includes(featuredImageUrl)) {
                // Featured image is in the array but not first, move it to the front
                images = images.filter(img => img !== featuredImageUrl);
                images = [featuredImageUrl, ...images];
            }
            
            // Extract variants and organize by color/size
            const variants = [];
            const colors = new Set();
            const sizes = new Set();
            
            // Maps to associate images with colors
            const colorToImagesMap = new Map();
            
            product.variants.edges.forEach(variantEdge => {
                const variant = variantEdge.node;
                
                let color = '';
                let size = '';
                
                // Process variant data
                
                let foundSize = false;
                
                // First: Always capture variant title as a potential size regardless of other options
                // This ensures we preserve all variant data from the API
                if (variant.title && variant.title !== 'Default Title') {
                    size = variant.title;
                    sizes.add(size);
                    foundSize = true;
                }
                
                // Second: Look for explicit "Size" option to add as additional data
                variant.selectedOptions.forEach(option => {
                    if (option.name.toLowerCase() === 'color') {
                        color = option.value;
                        colors.add(color);
                    } else if (option.name.toLowerCase() === 'size') {
                        size = option.value;
                        sizes.add(size);
                        foundSize = true;
                    }
                });
                
                // Second pass: Look for size-like values in any option (if size not found)
                if (!foundSize) {
                    variant.selectedOptions.forEach(option => {
                        // Skip options we already processed as color
                        if (option.name.toLowerCase() === 'color') return;
                        
                        // Check if this might be a size value
                        const upperValue = option.value.toUpperCase().trim();
                        if (['S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'].includes(upperValue) ||
                            upperValue.includes('SMALL') ||
                            upperValue.includes('MEDIUM') ||
                            upperValue.includes('LARGE') ||
                            /^\d+$/.test(upperValue) || // Numeric sizes
                            /^[0-9]+\.[0-9]+$/.test(upperValue)) { // Decimal sizes
                            
                            size = option.value;
                            sizes.add(size);
                            foundSize = true;
                        }
                    });
                }
                
                // Extract additional size info from variant title to ensure we catch everything
                // This is for backward compatibility with our previous approach
                if (variant.title && variant.title !== 'Default Title') {
                    
                    // For variants with slash format (Color / Size)
                    if (variant.title.includes('/')) {
                        const parts = variant.title.split('/').map(p => p.trim());
                        // Usually size is the second part (after color)
                        if (parts.length > 1) {
                            const extractedSize = parts[1];
                            sizes.add(extractedSize);
                        }
                    }
                }
                
                // SPECIAL HANDLING: If we reach here and still have no size, use the original variant title
                if (!size && variant.title) {
                    size = variant.title;
                    sizes.add(size);
                }
                
                // If variant has an image, associate it with the color
                if (variant.image && variant.image.url) {
                    if (!colorToImagesMap.has(color)) {
                        colorToImagesMap.set(color, []);
                    }
                    colorToImagesMap.get(color).push(variant.image.url);
                }
                
                variants.push({
                    id: variant.id,
                    color: color,
                    size: size,
                    price: parseFloat(variant.price.amount),
                    comparePrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                    availableForSale: variant.availableForSale,
                    image: variant.image ? variant.image.url : (images[0] || '')
                });
            });
            
            // Assign images to colors if we don't have explicit associations
            if (colorToImagesMap.size === 0 && colors.size > 0) {
                // If we don't have color-specific images, just assign all images to all colors
                colors.forEach(color => {
                    colorToImagesMap.set(color, [...images]);
                });
            }
            
            // Determine category from product type or title
            const category = this.extractCategory(product.title || product.productType || '');
            
            // Calculate pricing - handle potential missing priceRange with fallbacks
            let minPrice = 0;
            try {
                if (product.priceRange?.minVariantPrice?.amount) {
                    minPrice = parseFloat(product.priceRange.minVariantPrice.amount);
                } else if (variants.length > 0) {
                    // Get minimum price from variants
                    minPrice = Math.min(...variants.map(v => v.price || 0));
                } else if (product.price) {
                    // Direct price field
                    minPrice = parseFloat(typeof product.price === 'object' ? product.price.amount : product.price);
                }
            } catch (priceError) {
                console.error('Error calculating price:', priceError);
                minPrice = 0; // Default to 0 if calculation fails
            }
            
            // Get compare price from various sources with fallbacks
            let comparePrice = null;
            try {
                if (product.compareAtPriceRange?.maxVariantPrice?.amount) {
                    comparePrice = parseFloat(product.compareAtPriceRange.maxVariantPrice.amount);
                } else if (variants.find(v => v.comparePrice)) {
                    comparePrice = variants.find(v => v.comparePrice)?.comparePrice;
                } else if (product.compareAtPrice) {
                    comparePrice = parseFloat(typeof product.compareAtPrice === 'object' ?
                        product.compareAtPrice.amount : product.compareAtPrice);
                }
            } catch (comparePriceError) {
                console.error('Error calculating compare price:', comparePriceError);
                comparePrice = null; // Default to null if calculation fails
            }
            
            // Create color objects with name and code
            const colorObjects = Array.from(colors).map(color => ({
                name: color,
                code: this.getColorCode(color)
            }));
            
            // Extract priority from tags (format: "priority:N" where N is a number)
            let displayPriority = 999; // Default to low priority if no priority tag exists
            
            if (product.tags && Array.isArray(product.tags)) {
                for (const tag of product.tags) {
                    if (typeof tag === 'string' && tag.startsWith('priority:')) {
                        const priorityValue = parseInt(tag.split(':')[1]);
                        if (!isNaN(priorityValue)) {
                            displayPriority = priorityValue;
                            break;
                        }
                    }
                }
            }
            
            const convertedProduct = {
                id: product.handle || (product.id ? String(product.id).split('/').pop() : 'unknown'),
                shopifyId: product.id,
                title: product.title || 'Unknown Product',
                description: this.cleanDescription(product.description || ''),
                category: category,
                price: minPrice,
                comparePrice: comparePrice,
                images: images,
                mainImage: images[0] || '',
                variants: variants,
                colors: colorObjects, // Use objects with name and code for better compatibility
                sizes: Array.from(sizes),
                featured: product.tags?.includes('featured') || false,
                new: product.tags?.includes('new') || false,
                sale: comparePrice > minPrice,
                tags: product.tags || [],
                productType: product.productType || '',
                // Add the color to images mapping for easy filtering
                colorImages: Object.fromEntries(colorToImagesMap),
                // Add display priority for controlling product order
                displayPriority: displayPriority
            };
            
            uniqueProductsMap.set(product.handle, convertedProduct);
        });
        
        return Array.from(uniqueProductsMap.values());
    }

    cleanDescription(description) {
        if (!description) return '';
        try {
            return description
                .replace(/<[^>]*>/g, '')  // Remove HTML tags
                .replace(/&[^;]+;/g, ' ') // Replace HTML entities with space
                .trim()
                .substring(0, 200) + '...';
        } catch (error) {
            console.error('Error cleaning description:', error);
            return description.substring(0, 200) + '...';
        }
    }
    
    getColorCode(colorInput) {
        // Handle both string and object formats
        const colorName = typeof colorInput === 'object' ? colorInput.name : colorInput;
        
        // If input is already a color code (starts with #), return it
        if (typeof colorName === 'string' && colorName.startsWith('#')) {
            return colorName;
        }
        
        // Enhanced color mapping that includes all predefined CSS colors
        const colorMap = {
            // Core colors
            'black': '#000000',
            'white': '#FFFFFF',
            'red': '#EF4444',
            'green': '#008000',
            'blue': '#0000FF',
            'yellow': '#FFFF00',
            'purple': '#800080',
            'orange': '#FFA500',
            'brown': '#A52A2A',
            'pink': '#FFC0CB',
            'gray': '#808080',
            'grey': '#808080',
            
            // Specific named colors
            'forest green': '#228B22',
            'navy blazer': '#001F3F',
            'navy': '#000080',
            'navy blue': '#000080',
            'charcoal gray': '#36454F',
            'charcoal grey': '#36454F',
            'charcoal': '#36454F',
            'burgundy': '#800020',
            'olive': '#808000',
            'olive green': '#556B2F',
            'teal': '#008080',
            'maroon': '#800000',
            'royal blue': '#4169E1',
            'sky blue': '#87CEEB',
            'turquoise': '#40E0D0',
            'mint green': '#98FB98',
            'sage green': '#BCBFA3',
            'hunter green': '#355E3B',
            'emerald': '#50C878',
            'jade': '#00A86B',
            'khaki': '#C3B091',
            'beige': '#F5F5DC',
            'tan': '#D2B48C',
            'cream': '#FFFDD0',
            'ivory': '#FFFFF0',
            'coral': '#FF7F50',
            'salmon': '#FA8072',
            'peach': '#FFE5B4',
            'rust': '#B7410E',
            'copper': '#B87333',
            'gold': '#FFD700',
            'silver': '#C0C0C0',
            'slate': '#708090',
            'indigo': '#4B0082',
            'lavender': '#E6E6FA',
            'plum': '#8E4585',
            'magenta': '#FF00FF',
            'violet': '#8A2BE2',
            'mustard': '#FFDB58',
            'taupe': '#483C32',
            'light gray': '#D3D3D3',
            'light grey': '#D3D3D3',
            'dark gray': '#A9A9A9',
            'dark grey': '#A9A9A9',
            'vintage black': '#202020',
            'off white': '#F5F5F5',
            'deep purple': '#301934',
            'hot pink': '#FF69B4',
            'dark brown': '#5C4033',
            'light brown': '#B5651D',
            'heather grey': '#D3D3D3',
            'french navy': '#002868',
            
            // Default
            'default': '#a855f7'  // Site's main accent color as default
        };
        
        if (typeof colorName === 'string') {
            // Try exact match first
            const lowerColor = colorName.toLowerCase();
            if (colorMap[lowerColor]) {
                return colorMap[lowerColor];
            }
            
            // If no exact match, try to match just the main color word
            // For compound colors like "Dark Blue" or "Light Green"
            const colorWords = lowerColor.split(' ');
            const lastWord = colorWords[colorWords.length - 1];
            if (colorMap[lastWord]) {
                return colorMap[lastWord];
            }
            
            // Check if this is a compound color with words reversed
            // e.g. "Blue Navy" instead of "Navy Blue"
            if (colorWords.length >= 2) {
                const reversedKey = `${colorWords[1]} ${colorWords[0]}`;
                if (colorMap[reversedKey]) {
                    return colorMap[reversedKey];
                }
            }
            
            // If no match was found, return the default color
            return `var(--dynamic-color, #a855f7)`;
        }
        
        return '#a855f7'; // Default purple fallback
    }

    extractCategory(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('hoodie')) return 'hoodie';
        if (titleLower.includes('t-shirt') || titleLower.includes('tee')) return 't-shirt';
        if (titleLower.includes('sweatshirt')) return 'sweatshirt';
        if (titleLower.includes('joggers') || titleLower.includes('pants')) return 'joggers';
        if (titleLower.includes('windbreaker') || titleLower.includes('jacket')) return 'windbreaker';
        if (titleLower.includes('beanie') || titleLower.includes('hat')) return 'beanie';
        return 'other';
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.currentPage = 1;
                this.filterProducts();
                this.renderProducts();
            });
        });

        // Sort select
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.sortProducts();
                this.renderProducts();
            });
        }

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.updateView();
            });
        });

        // Search functionality
        this.setupSearch();

        // Navigation
        this.setupNavigation();
    }

    setupSearch() {
        const searchToggle = document.getElementById('search-toggle');
        const searchOverlay = document.getElementById('search-overlay');
        const searchClose = document.getElementById('search-close');
        const searchInput = document.getElementById('search-input');

        if (searchToggle && searchOverlay) {
            searchToggle.addEventListener('click', () => {
                searchOverlay.classList.add('active');
                searchInput.focus();
            });

            searchClose.addEventListener('click', () => {
                searchOverlay.classList.remove('active');
                searchInput.value = '';
                this.searchQuery = '';
                this.filterProducts();
                this.renderProducts();
            });

            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.performSearch();
            });

            // Close on escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                    searchOverlay.classList.remove('active');
                }
            });
        }
    }

    setupNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }
    }

    performSearch() {
        if (this.searchQuery.length === 0) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }

        const results = this.products.filter(product =>
            product.title.toLowerCase().includes(this.searchQuery) ||
            product.description.toLowerCase().includes(this.searchQuery) ||
            product.category.toLowerCase().includes(this.searchQuery)
        ).slice(0, 5);

        this.renderSearchResults(results);
    }

    renderSearchResults(results) {
        const searchResults = document.getElementById('search-results');
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No products found</div>';
            return;
        }

        searchResults.innerHTML = results.map(product => `
            <div class="search-result-item" onclick="productManager.viewProduct('${product.id}')">
                ${product.mainImage ? 
                  `<img src="${product.mainImage}" alt="${product.title}" class="search-result-image" onerror="this.style.display='none';">` : 
                  `<div class="search-result-no-image">${product.title.charAt(0)}</div>`}
                <div class="search-result-info">
                    <div class="search-result-title">${product.title}</div>
                    <div class="search-result-price">$${product.price.toFixed(2)}</div>
                </div>
            </div>
        `).join('');
    }

    filterProducts() {
        this.filteredProducts = this.products.filter(product => {
            const categoryMatch = this.currentCategory === 'all' || product.category === this.currentCategory;
            const searchMatch = this.searchQuery === '' || 
                product.title.toLowerCase().includes(this.searchQuery) ||
                product.description.toLowerCase().includes(this.searchQuery);
            
            return categoryMatch && searchMatch;
        });

        this.sortProducts();
    }

    sortProducts() {
        switch (this.currentSort) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'newest':
                // Sort by "new" tag first, then by most recently added (using ID as proxy for recency)
                this.filteredProducts.sort((a, b) => {
                    if (a.new && !b.new) return -1;
                    if (!a.new && b.new) return 1;
                    // Assuming newer products have higher IDs or were added later in the array
                    return a.id > b.id ? -1 : 1;
                });
                break;
            case 'bestselling':
                // In a real implementation, this would use sales data
                // For now, we'll prioritize featured products then new products
                // as a proxy for popularity
                this.filteredProducts.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    if (a.new && !b.new) return -1;
                    if (!a.new && b.new) return 1;
                    // Could add logic here to incorporate sales data when available
                    return 0;
                });
                break;
            case 'sale':
                // Sort by items on sale first, then by discount percentage
                this.filteredProducts.sort((a, b) => {
                    if (a.sale && !b.sale) return -1;
                    if (!a.sale && b.sale) return 1;
                    if (a.sale && b.sale) {
                        // Calculate discount percentages
                        const aDiscount = a.comparePrice ? ((a.comparePrice - a.price) / a.comparePrice) * 100 : 0;
                        const bDiscount = b.comparePrice ? ((b.comparePrice - b.price) / b.comparePrice) * 100 : 0;
                        return bDiscount - aDiscount; // Higher discount first
                    }
                    return 0;
                });
                break;
            case 'featured':
            default:
                this.filteredProducts.sort((a, b) => {
                    // First, sort by featured tag
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    
                    // Then by new tag
                    if (a.new && !b.new) return -1;
                    if (!a.new && b.new) return 1;
                    
                    // Then by sale items
                    if (a.sale && !b.sale) return -1;
                    if (!a.sale && b.sale) return 1;
                    
                    // If both are on sale, sort by discount percentage
                    if (a.sale && b.sale) {
                        const aDiscount = a.comparePrice ? ((a.comparePrice - a.price) / a.comparePrice) * 100 : 0;
                        const bDiscount = b.comparePrice ? ((b.comparePrice - b.price) / b.comparePrice) * 100 : 0;
                        if (bDiscount !== aDiscount) return bDiscount - aDiscount; // Higher discount first
                    }
                    
                    // Finally, sort alphabetically as a last resort
                    return a.title.localeCompare(b.title);
                });
                break;
        }
    }

    updateView() {
        const productsGrid = document.getElementById('products-grid');
        if (this.currentView === 'list') {
            productsGrid.classList.add('list-view');
        } else {
            productsGrid.classList.remove('list-view');
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('products-grid');
        const loadingSkeleton = document.getElementById('loading-skeleton');
        
        // Show loading skeleton
        loadingSkeleton.style.display = 'grid';
        productsGrid.innerHTML = '';

        setTimeout(() => {
            loadingSkeleton.style.display = 'none';
            
            const startIndex = (this.currentPage - 1) * this.productsPerPage;
            const endIndex = startIndex + this.productsPerPage;
            const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

            if (productsToShow.length === 0) {
                // Show generic no products message regardless of environment
                productsGrid.innerHTML = `
                    <div class="no-products">
                        <h3>No products found</h3>
                        <p>Try adjusting your filters or search terms</p>
                        <p class="small-text">This app requires deployment to Netlify to load products.</p>
                    </div>
                `;
                return;
            }

            productsGrid.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');
            this.renderPagination();
            this.attachProductEventListeners();
            
            // Ensure initial images show the active color for each product card
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                try {
                    // Find the active color option
                    const activeColorOption = card.querySelector('.variant-option.active');
                    if (activeColorOption && activeColorOption.dataset.colorImage) {
                        // Get the product image and update it with the active color's image
                        const productImage = card.querySelector('.product-image');
                        if (productImage) {
                            productImage.src = activeColorOption.dataset.colorImage;
                            productImage.dataset.originalSrc = activeColorOption.dataset.colorImage;
                            // No logging needed
                        }
                    }
                } catch (err) {
                    console.warn('Error setting initial product image:', err);
                }
            });
        }, 500);
    }

    createProductCard(product) {
        const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
        
        // Store color-specific data for JavaScript handling
        // Ensure the color keys are strings, not objects
        let colorImagesForJSON = {};
        if (product.colorImages) {
            // Convert any object keys to string keys
            Object.keys(product.colorImages).forEach(colorKey => {
                // Use the color name as the key
                const colorName = typeof colorKey === 'object' ? colorKey.name : colorKey;
                colorImagesForJSON[colorName] = product.colorImages[colorKey];
            });
        }
        
        // Stringify the color images with simple error handling
        let colorImagesJSON = '{}';
        try {
            colorImagesJSON = JSON.stringify(colorImagesForJSON);
        } catch (err) {
            console.error('Error stringifying color images');
        }
        
        // Create HTML for variant options with data attributes for main page color switching
        const variantOptionsHTML = product.colors.length > 0
            ? product.colors.slice(0, 4).map((color, index) => {
                // Extract color name from object or string
                const colorName = typeof color === 'object' ? color.name : color;
                const colorCode = typeof color === 'object' ? color.code : this.getColorCode(color);
                
                // Get the first image for this color
                const colorImage = product.colorImages && product.colorImages[colorName] && product.colorImages[colorName].length > 0
                    ? product.colorImages[colorName][0]
                    : product.mainImage;
                
                // Set the first color as active by default
                const isActive = index === 0 ? 'active' : '';
                
                return `<div class="variant-option ${isActive}"
                           data-color="${colorName}"
                           data-color-image="${colorImage}"
                           style="background-color: ${colorCode}"
                           title="${colorName}"></div>`;
            }).join('')
            : '';
        
        return `
            <div class="product-card" data-product-id="${product.id}" data-color-images='${colorImagesJSON}'>
                <div class="product-image-container">
                    ${product.mainImage ?
                      `<img src="${product.mainImage}" alt="${product.title}" class="product-image" style="background-color: #ffffff;" onerror="this.style.display='none'; this.parentElement.querySelector('.product-no-image').style.display='flex';">
                       <div class="product-no-image" style="display:none; width:100%; height:100%; align-items:center; justify-content:center; background:#ffffff; color:#555;">
                         <div>${product.title.charAt(0)}</div>
                       </div>` :
                      `<div class="product-no-image" style="display:flex; width:100%; height:100%; align-items:center; justify-content:center; background:#ffffff; color:#555;">
                         <div>${product.title.charAt(0)}</div>
                       </div>`
                    }
                    <!-- Product overlay removed to eliminate all popups -->
                    <div class="product-badges">
                        ${product.new ? '<span class="product-badge new">New</span>' : ''}
                        ${product.sale ? `<span class="product-badge sale">-${discount}%</span>` : ''}
                        ${product.featured ? '<span class="product-badge">Featured</span>' : ''}
                    </div>
                    <button class="wishlist-btn" data-product-id="${product.id}" title="Add to Wishlist">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="product-info">
                    ${this.currentView === 'list' ? '<div class="product-details">' : ''}
                    <div class="product-category">${product.category.replace('-', ' ')}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                        ${product.comparePrice ? `<span class="price-original">$${product.comparePrice.toFixed(2)}</span>` : ''}
                        ${product.sale ? `<span class="price-discount">-${discount}%</span>` : ''}
                    </div>
                    ${product.colors.length > 0 ? `
                        <div class="product-variants">
                            ${variantOptionsHTML}
                            ${product.colors.length > 4 ? `<span class="variant-more">+${product.colors.length - 4}</span>` : ''}
                        </div>
                    ` : ''}
                    ${this.currentView === 'list' ? '</div><div class="product-actions">' : ''}
                    <!-- Add to Cart button completely removed -->
                    ${this.currentView === 'list' ? '</div>' : ''}
                </div>
            </div>
        `;
    }

    // This method doesn't need a legacy version since we've updated
    // the main getColorCode method to handle all color formats

    attachProductEventListeners() {
        // Quick view buttons removed

        // Add to cart buttons completely removed

        // Wishlist buttons
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.dataset.productId;
                this.toggleWishlist(productId);
            });
        });

        // Color variant options for product cards
        document.querySelectorAll('.variant-option').forEach(option => {
            // Store reference to the ProductManager instance
            const self = this;
            
            // Store a reference to the product manager
            const productManager = this;
            
            // Change product image on hover
            option.addEventListener('mouseenter', (e) => {
                const colorOption = e.target;
                const productCard = colorOption.closest('.product-card');
                const productImage = productCard.querySelector('.product-image');
                const colorImage = colorOption.dataset.colorImage;
                
                // Store original image to restore on mouseleave
                if (!productImage.dataset.originalSrc) {
                    productImage.dataset.originalSrc = productImage.src;
                }
                
                // Change to color-specific image
                if (colorImage) {
                    productImage.src = colorImage;
                }
            });
            
            // Restore original image on mouse leave
            option.addEventListener('mouseleave', (e) => {
                const productCard = e.target.closest('.product-card');
                const productImage = productCard.querySelector('.product-image');
                
                // Only restore if not the active color
                if (!e.target.classList.contains('active') && productImage.dataset.originalSrc) {
                    productImage.src = productImage.dataset.originalSrc;
                }
            });
            
            // Set active color on click - use a regular function for proper 'this' binding
            option.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click
                
                const colorOption = e.target;
                const productCard = colorOption.closest('.product-card');
                const productImage = productCard.querySelector('.product-image');
                const colorImage = colorOption.dataset.colorImage;
                const colorName = colorOption.dataset.color;
                
                // Remove active class from all options in this card
                productCard.querySelectorAll('.variant-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                
                // Add active class to clicked option
                colorOption.classList.add('active');
                
                // First approach: Direct update for immediate feedback
                if (colorImage) {
                    productImage.src = colorImage;
                    productImage.dataset.originalSrc = colorImage;
                }
                
                // Second approach: Use the instance method for thorough update
                if (typeof productManager.updateProductCardImage === 'function') {
                    try {
                        productManager.updateProductCardImage(productCard, colorName);
                    } catch (err) {
                        // Fallback: update all instances of this product across the page
                        const productId = productCard.dataset.productId;
                        
                        document.querySelectorAll(`.product-card[data-product-id="${productId}"]`).forEach(card => {
                            if (card !== productCard) { // Skip the card we already updated
                                // Find the matching color option
                                const matchingOption = card.querySelector(`.variant-option[data-color="${colorName}"]`);
                                if (matchingOption) {
                                    // Remove active class from all options in this card
                                    card.querySelectorAll('.variant-option').forEach(opt => {
                                        opt.classList.remove('active');
                                    });
                                    // Add active class to matching option
                                    matchingOption.classList.add('active');
                                    
                                    // Update image
                                    const cardImage = card.querySelector('.product-image');
                                    if (cardImage && matchingOption.dataset.colorImage) {
                                        cardImage.src = matchingOption.dataset.colorImage;
                                        cardImage.dataset.originalSrc = matchingOption.dataset.colorImage;
                                    }
                                }
                            }
                        });
                    }
                }
            });
            
            // We no longer need the standalone updateProductCardImage function
            // as we're using the class instance method directly
        });

        // Product card clicks
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('.variant-option')) {
                    const productId = card.dataset.productId;
                    this.viewProduct(productId);
                }
            });
        });
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="productManager.goToPage(${this.currentPage - 1})">
                ‹ Previous
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="productManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="productManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="productManager.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="productManager.goToPage(${this.currentPage + 1})">
                Next ›
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Add to cart functionality completely removed from product listings

    toggleWishlist(productId) {
        const button = document.querySelector(`[data-product-id="${productId}"]`);
        if (button) {
            button.classList.toggle('active');
            
            if (button.classList.contains('active')) {
                this.showNotification('Added to wishlist!', 'success');
            } else {
                this.showNotification('Removed from wishlist!', 'info');
            }
        }

        // Trigger wishlist update (handled by wishlist.js)
        if (window.wishlistManager) {
            window.wishlistManager.toggleItem(productId);
        }
    }

    // Quick view and quick add functionality completely removed

    viewProduct(productId, selectedColor = null) {
        // Basic error check
        if (!productId) {
            console.error('Cannot view product: Product ID is missing');
            return;
        }
        
        try {
            // Find the product in our data for basic verification
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                console.warn(`Product with ID ${productId} not found in local data`);
                // Continue anyway as the product might exist on the server
            }
            
            // Build the URL with just the product ID - simple approach without color parameter
            let url = `product.html?id=${encodeURIComponent(productId)}`;
            
            // Navigate to the product page
            window.location.href = url;
            
        } catch (error) {
            // Fail safe - just go to the product page with ID only
            console.error('Error in viewProduct:', error);
            window.location.href = `product.html?id=${encodeURIComponent(productId)}`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    // Method to update product card images based on selected color
    updateProductCardImage(productCard, colorName) {
        if (!productCard || !colorName) return;
        
        try {
            // Get product ID
            const productId = productCard.dataset.productId;
            if (!productId) return;
            
            // Find product in our data
            const product = this.products.find(p => p.id === productId);
            if (!product) return;
            
            // Get product image element
            const productImage = productCard.querySelector('.product-image');
            if (!productImage) return;
            
            // Method 1: Try to get image from variant option data attribute (most reliable)
            const colorOption = productCard.querySelector(`.variant-option[data-color="${colorName}"]`);
            if (colorOption && colorOption.dataset.colorImage) {
                // Use the image directly from the option's data attribute
                productImage.src = colorOption.dataset.colorImage;
                productImage.dataset.originalSrc = colorOption.dataset.colorImage;
                
                // Update all other instances of this product
                document.querySelectorAll(`.product-card[data-product-id="${productId}"]`).forEach(card => {
                    if (card !== productCard) { // Skip the card we already updated
                        const matchingOption = card.querySelector(`.variant-option[data-color="${colorName}"]`);
                        const cardImage = card.querySelector('.product-image');
                        
                        if (matchingOption && cardImage) {
                            // Update active color selection
                            card.querySelectorAll('.variant-option').forEach(opt => {
                                opt.classList.remove('active');
                            });
                            matchingOption.classList.add('active');
                            
                            // Update image if the option has a color image
                            if (matchingOption.dataset.colorImage) {
                                cardImage.src = matchingOption.dataset.colorImage;
                                cardImage.dataset.originalSrc = matchingOption.dataset.colorImage;
                            }
                        }
                    }
                });
                
                return; // Exit if we successfully updated the image
            }
            
            // Method 2: Try to get image from product's colorImages mapping
            if (product.colorImages && product.colorImages[colorName] &&
                Array.isArray(product.colorImages[colorName]) && product.colorImages[colorName].length > 0) {
                
                const colorImage = product.colorImages[colorName][0];
                
                productImage.src = colorImage;
                productImage.dataset.originalSrc = colorImage;
                
                // Update all other instances of this product
                document.querySelectorAll(`.product-card[data-product-id="${productId}"]`).forEach(card => {
                    if (card !== productCard) {
                        const cardImage = card.querySelector('.product-image');
                        const matchingOption = card.querySelector(`.variant-option[data-color="${colorName}"]`);
                        
                        if (cardImage) {
                            cardImage.src = colorImage;
                            cardImage.dataset.originalSrc = colorImage;
                        }
                        
                        if (matchingOption) {
                            // Update active color selection
                            card.querySelectorAll('.variant-option').forEach(opt => {
                                opt.classList.remove('active');
                            });
                            matchingOption.classList.add('active');
                        }
                    }
                });
                
                return; // Exit if we successfully updated the image
            }
            
            // Method 3: Try to get image from card's data-color-images attribute
            if (productCard.dataset.colorImages) {
                try {
                    const colorImagesMap = JSON.parse(productCard.dataset.colorImages);
                    
                    if (colorImagesMap[colorName] && Array.isArray(colorImagesMap[colorName]) &&
                        colorImagesMap[colorName].length > 0) {
                        
                        const colorImage = colorImagesMap[colorName][0];
                        
                        productImage.src = colorImage;
                        productImage.dataset.originalSrc = colorImage;
                        
                        // Update all other instances
                        document.querySelectorAll(`.product-card[data-product-id="${productId}"]`).forEach(card => {
                            if (card !== productCard) {
                                const cardImage = card.querySelector('.product-image');
                                const matchingOption = card.querySelector(`.variant-option[data-color="${colorName}"]`);
                                
                                if (cardImage) {
                                    cardImage.src = colorImage;
                                    cardImage.dataset.originalSrc = colorImage;
                                }
                                
                                if (matchingOption) {
                                    // Update active color selection
                                    card.querySelectorAll('.variant-option').forEach(opt => {
                                        opt.classList.remove('active');
                                    });
                                    matchingOption.classList.add('active');
                                }
                            }
                        });
                        
                        return; // Exit if we successfully updated the image
                    }
                } catch (parseError) {
                    // Silent fail - we'll try other methods
                }
            }
            
            // Last resort - for any color option
            // Force direct attribute update for any variant
            const specificOption = productCard.querySelector(`.variant-option[data-color="${colorName}"]`);
            if (specificOption) {
                const specificImg = specificOption.getAttribute('data-color-image');
                if (specificImg) {
                    productImage.src = specificImg;
                    productImage.dataset.originalSrc = specificImg;
                }
            }
            
        } catch (error) {
            // Silent error handling to prevent console spam
        }
    }
}

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
});