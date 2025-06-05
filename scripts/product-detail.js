// Product Detail Page Manager
class ProductDetailManager {
    constructor() {
        this.currentProduct = null;
        this.selectedVariant = {
            color: null,
            size: null,
            quantity: 1
        };
        this.currentImageIndex = 0;
        this.recentlyViewed = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadRecentlyViewed();
        // Start loading immediately without password protection
        this.startLoadingSequence();
    }

    setupPasswordProtection() {
        const passwordScreen = document.getElementById('password-screen');
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit');
        const passwordError = document.getElementById('password-error');

        const checkPassword = () => {
            const password = passwordInput.value.trim();
            if (password === 'bajablastrabbit47') {
                passwordScreen.style.display = 'none';
                this.startLoadingSequence();
            } else {
                passwordError.style.display = 'block';
                passwordInput.value = '';
                passwordInput.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    passwordInput.style.animation = '';
                    passwordError.style.display = 'none';
                }, 2000);
            }
        };

        passwordSubmit.addEventListener('click', checkPassword);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }

    async startLoadingSequence() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainContent = document.getElementById('main-content');
        const loadingProgress = document.getElementById('loading-progress');
        const loadingPercentage = document.getElementById('loading-percentage');
        const loadingMessage = document.getElementById('loading-message');

        loadingScreen.style.display = 'flex';

        const messages = [
            'LOADING PRODUCT DETAILS',
            'FETCHING INVENTORY DATA',
            'PREPARING IMAGES',
            'LOADING REVIEWS',
            'FINALIZING DISPLAY'
        ];

        let progress = 0;
        let messageIndex = 0;
        let productLoaded = false;

        // Start loading the product data
        this.loadProduct().then(() => {
            productLoaded = true;
        }).catch(error => {
            console.error('Error loading product:', error);
            productLoaded = true; // Continue even if there's an error
        });

        const updateProgress = () => {
            // Slow down progress if product isn't loaded yet
            const progressIncrement = productLoaded ? Math.random() * 20 + 10 : Math.random() * 5 + 2;
            progress += progressIncrement;
            if (progress > 100) progress = 100;

            loadingProgress.style.width = `${progress}%`;
            loadingPercentage.textContent = `${Math.floor(progress)}%`;

            if (messageIndex < messages.length - 1 && progress > (messageIndex + 1) * 20) {
                messageIndex++;
                loadingMessage.textContent = messages[messageIndex];
            }

            if (progress >= 100 && productLoaded) {
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    mainContent.style.display = 'block';
                    document.body.classList.add('loaded');
                }, 500);
            } else {
                setTimeout(updateProgress, Math.random() * 200 + 100);
            }
        };

        updateProgress();
    }

    async loadProduct() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id') || 'bungi-hoodie-black'; // Default product if no ID

        // Load product data (this would typically come from an API)
        this.currentProduct = await this.fetchProductData(productId);
        
        if (!this.currentProduct) {
            // Use sample product as final fallback
            this.currentProduct = this.getSampleProduct(productId);
        }

        this.renderProduct();
        this.addToRecentlyViewed(this.currentProduct);
        this.loadRelatedProducts();
    }

    async fetchProductData(productId) {
        console.log('Loading product data for:', productId);
        
        try {
            // First priority: Try to load from Shopify API
            console.log('🛍️ Attempting to load product from Shopify...');
            const shopifyProduct = await this.loadShopifyProduct(productId);
            
            if (shopifyProduct) {
                console.log('✅ Successfully loaded product from Shopify!');
                return this.convertProductForDetailPage(shopifyProduct);
            }
            
            // Second priority: Try to load from ProductManager (CSV/embedded data)
            console.log('📄 Shopify failed, trying ProductManager...');
            const productManager = this.createProductManager();
            await productManager.loadProducts();
            
            const product = productManager.products.find(p => p.id === productId);
            if (product) {
                console.log('✅ Successfully loaded product from ProductManager!');
                return this.convertProductForDetailPage(product);
            }
            
            // Final fallback: Use sample product
            console.log('⚠️ No product found, using sample product');
            return this.getSampleProduct(productId);
            
        } catch (error) {
            console.error('❌ Error loading product:', error);
            return this.getSampleProduct(productId);
        }
    }

    async loadShopifyProduct(productId) {
        try {
            // Use Netlify function to avoid CORS issues
            console.log('🛍️ Loading product via Netlify function...');
            const response = await fetch('/.netlify/functions/get-products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                console.error('❌ Netlify function error:', data.error);
                return null;
            }

            // Find the specific product by handle/id
            const product = data.products?.find(p => p.handle === productId || p.id === productId);
            
            if (!product) {
                console.log('❌ Product not found in Shopify data');
                return null;
            }

            console.log(`🛍️ Found product via Netlify function: ${product.title}`);
            return this.convertShopifyProductForDetail(product);
            
        } catch (error) {
            console.error('❌ Error loading product via Netlify function:', error);
            return null;
        }
    }

    convertShopifyProductForDetail(shopifyProduct) {
        // Extract images
        const images = shopifyProduct.images.edges.map(imgEdge => imgEdge.node.url);
        
        // Extract variants and organize by color/size
        const variants = [];
        const colors = new Set();
        const sizes = new Set();
        const inventory = {};
        
        shopifyProduct.variants.edges.forEach(variantEdge => {
            const variant = variantEdge.node;
            
            let color = '';
            let size = '';
            
            variant.selectedOptions.forEach(option => {
                if (option.name.toLowerCase() === 'color') {
                    color = option.value;
                    colors.add(color);
                } else if (option.name.toLowerCase() === 'size') {
                    size = option.value;
                    sizes.add(size);
                }
            });
            
            // Add to inventory tracking
            if (color && size) {
                inventory[`${color}-${size}`] = variant.quantityAvailable || 0;
            }
            
            variants.push({
                id: variant.id,
                color: color,
                size: size,
                price: parseFloat(variant.price.amount),
                comparePrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                availableForSale: variant.availableForSale,
                quantityAvailable: variant.quantityAvailable || 0
            });
        });
        
        // Calculate pricing
        const minPrice = parseFloat(shopifyProduct.priceRange.minVariantPrice.amount);
        const maxPrice = parseFloat(shopifyProduct.priceRange.maxVariantPrice.amount);
        const comparePrice = variants.find(v => v.comparePrice)?.comparePrice || null;
        
        return {
            id: shopifyProduct.handle,
            shopifyId: shopifyProduct.id,
            title: shopifyProduct.title,
            description: shopifyProduct.description || 'Premium streetwear with unique design.',
            category: this.extractCategory(shopifyProduct.title),
            price: minPrice,
            comparePrice: comparePrice,
            images: images.length > 0 ? images : ['assets/placeholder.jpg'],
            variants: variants,
            colors: Array.from(colors),
            sizes: Array.from(sizes),
            featured: shopifyProduct.tags.includes('featured'),
            new: shopifyProduct.tags.includes('new'),
            sale: comparePrice > minPrice,
            tags: shopifyProduct.tags,
            productType: shopifyProduct.productType,
            inventory: inventory
        };
    }

    extractCategory(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('hoodie')) return 'Hoodies';
        if (titleLower.includes('t-shirt') || titleLower.includes('tee')) return 'T-Shirts';
        if (titleLower.includes('sweatshirt')) return 'Sweatshirts';
        if (titleLower.includes('joggers') || titleLower.includes('pants')) return 'Joggers';
        if (titleLower.includes('windbreaker') || titleLower.includes('jacket')) return 'Windbreakers';
        if (titleLower.includes('beanie') || titleLower.includes('hat')) return 'Beanies';
        return 'Apparel';
    }

    createProductManager() {
        // Create a simplified product manager for loading products
        return {
            products: [],
            async loadProducts() {
                try {
                    const csvData = await this.loadCSVData();
                    this.products = this.parseCSVToProducts(csvData);
                    
                    if (this.products.length === 0) {
                        this.products = this.getSampleProducts();
                    }
                } catch (error) {
                    console.error('Error loading products:', error);
                    this.products = this.getSampleProducts();
                }
            },
            
            async loadCSVData() {
                try {
                    const response = await fetch('products_export_1.csv');
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return await response.text();
                } catch (error) {
                    console.error('Error loading CSV:', error);
                    return '';
                }
            },
            
            parseCSVToProducts(csvText) {
                if (!csvText || csvText.trim() === '') {
                    return this.getSampleProducts();
                }

                const lines = csvText.split('\n');
                if (lines.length < 2) {
                    return this.getSampleProducts();
                }

                const products = new Map();

                for (let i = 1; i < lines.length; i++) {
                    const values = this.parseCSVLine(lines[i]);
                    if (values.length < 27) continue;

                    const handle = values[0];
                    const title = values[1];
                    const description = values[2];
                    const price = parseFloat(values[22]) || 0;
                    const comparePrice = parseFloat(values[23]) || 0;
                    const imageUrl = values[26];
                    const color = values[9] || '';
                    const size = values[12] || '';

                    if (!handle || !title) continue;

                    if (!products.has(handle)) {
                        const localImages = this.getLocalMockupImages(imageUrl);
                        
                        products.set(handle, {
                            id: handle,
                            title: title,
                            description: this.cleanDescription(description),
                            category: this.extractCategory(title),
                            price: price,
                            comparePrice: comparePrice > price ? comparePrice : null,
                            images: localImages,
                            variants: [],
                            colors: new Set(),
                            sizes: new Set(),
                            featured: Math.random() > 0.7,
                            new: Math.random() > 0.8,
                            sale: comparePrice > price
                        });
                    }

                    const product = products.get(handle);
                    if (color) product.colors.add(color);
                    if (size) product.sizes.add(size);
                    
                    const variantImages = this.getLocalMockupImages(imageUrl);
                    variantImages.forEach(img => {
                        if (!product.images.includes(img)) {
                            product.images.push(img);
                        }
                    });

                    product.variants.push({
                        color: color,
                        size: size,
                        price: price,
                        comparePrice: comparePrice > price ? comparePrice : null,
                        image: variantImages[0] || 'assets/placeholder.jpg'
                    });
                }

                return Array.from(products.values()).map(product => ({
                    ...product,
                    colors: Array.from(product.colors),
                    sizes: Array.from(product.sizes),
                    mainImage: product.images[0] || 'assets/placeholder.jpg'
                }));
            },
            
            parseCSVLine(line) {
                const result = [];
                let current = '';
                let inQuotes = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        result.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                
                result.push(current.trim());
                return result;
            },
            
            cleanDescription(description) {
                if (!description) return '';
                return description
                    .replace(/<[^>]*>/g, '')
                    .replace(/&[^;]+;/g, ' ')
                    .trim()
                    .substring(0, 200) + '...';
            },
            
            extractCategory(title) {
                const titleLower = title.toLowerCase();
                if (titleLower.includes('hoodie')) return 'hoodie';
                if (titleLower.includes('t-shirt') || titleLower.includes('tee')) return 't-shirt';
                if (titleLower.includes('sweatshirt')) return 'sweatshirt';
                if (titleLower.includes('joggers') || titleLower.includes('pants')) return 'joggers';
                if (titleLower.includes('windbreaker') || titleLower.includes('jacket')) return 'windbreaker';
                if (titleLower.includes('beanie') || titleLower.includes('hat')) return 'beanie';
                return 'other';
            },
            
            getLocalMockupImages(imageUrl) {
                if (!imageUrl) return ['assets/placeholder.jpg'];
                
                const match = imageUrl.match(/([a-f0-9]{13})\.png/);
                if (!match) return ['assets/placeholder.jpg'];
                
                const identifier = match[1];
                return this.findMockupsByIdentifier(identifier);
            },
            
            findMockupsByIdentifier(identifier) {
                const identifierMap = {
                    '683f9d11a7936': ['mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png'],
                    '683f9d11a9742': ['mockups/unisex-premium-hoodie-black-front-683f9021c7dbc.png'],
                    '683f9d11ab4fe': ['mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png'],
                    '683f9d11ae0c4': ['mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png'],
                    '683f9d11b1d12': ['mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png'],
                    '683f9d11b64a3': ['mockups/unisex-premium-hoodie-maroon-back-683f90225ac87.png'],
                    '683f9d11bbc17': ['mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png'],
                    '683f9d11c14f8': ['mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022d94ea.png'],
                    '683f9d11c724f': ['mockups/unisex-premium-hoodie-vintage-black-front-683f9023cc9cc.png'],
                    '683f9d11ce1c5': ['mockups/unisex-premium-hoodie-vintage-black-back-683f9023a579e.png'],
                    '683f9ce1094eb': ['mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png'],
                    '683f9ce10ab8f': ['mockups/unisex-premium-hoodie-white-back-683f8fddcabb2.png']
                };
                
                if (identifierMap[identifier]) {
                    return identifierMap[identifier];
                }
                
                return [
                    'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                    'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                    'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png'
                ];
            },
            
            getSampleProducts() {
                return [
                    {
                        id: 'bungi-x-bobby-rabbit-hardware-unisex-hoodie',
                        title: 'BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie - Black',
                        description: 'Premium streetwear hoodie with unique rabbit hardware design. Made from high-quality cotton blend for ultimate comfort.',
                        category: 'hoodie',
                        price: 50.00,
                        comparePrice: 65.00,
                        mainImage: 'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                        images: ['mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png'],
                        colors: ['Black'],
                        sizes: ['S', 'M', 'L', 'XL', '2XL'],
                        featured: true,
                        new: true,
                        sale: true
                    }
                ];
            }
        };
    }

    convertProductForDetailPage(product) {
        // Convert the product data to the format expected by the detail page
        const colorMap = {
            'Black': '#000000',
            'White': '#FFFFFF',
            'Navy': '#001f3f',
            'Navy Blazer': '#001f3f',
            'Maroon': '#800000',
            'Charcoal Heather': '#36454F',
            'Vintage Black': '#2C2C2C',
            'Heather Grey': '#D3D3D3',
            'French Navy': '#002868',
            'Forest Green': '#228B22'
        };

        return {
            id: product.id,
            title: product.title,
            description: product.description,
            category: product.category.charAt(0).toUpperCase() + product.category.slice(1),
            price: product.price,
            comparePrice: product.comparePrice,
            images: product.images,
            colors: product.colors.map(color => ({
                name: color,
                code: colorMap[color] || '#a855f7'
            })),
            sizes: product.sizes,
            features: [
                { icon: '🧵', text: '100% cotton face' },
                { icon: '♻️', text: '65% ring-spun cotton, 35% polyester' },
                { icon: '👜', text: 'Front pouch pocket' },
                { icon: '🎯', text: 'Self-fabric patch on the back' }
            ],
            details: 'This hoodie runs small. For the perfect fit, we recommend ordering one size larger than your usual size.',
            care: 'Machine wash cold, tumble dry low, do not bleach, iron on low heat if needed.',
            shipping: 'This product is made especially for you as soon as you place an order, which is why it takes us a bit longer to deliver it to you.',
            rating: 4.8,
            reviewCount: 127,
            featured: product.featured,
            new: product.new,
            sale: product.sale,
            inventory: this.generateInventory(product.colors, product.sizes)
        };
    }

    generateInventory(colors, sizes) {
        const inventory = {};
        colors.forEach(color => {
            sizes.forEach(size => {
                inventory[`${color}-${size}`] = Math.floor(Math.random() * 20) + 5;
            });
        });
        return inventory;
    }

    getSampleProduct(productId) {
        // Map product IDs to specific sample products
        const productMap = {
            'bungi-hoodie-black': {
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Vintage Black',
                category: 'Hoodies',
                images: [
                    'mockups/unisex-premium-hoodie-vintage-black-front-683f90235e599.png',
                    'mockups/unisex-premium-hoodie-vintage-black-back-683f9023a579e.png',
                    'mockups/unisex-premium-hoodie-vintage-black-left-683f9023d85a1.png',
                    'mockups/unisex-premium-hoodie-vintage-black-right-683f90240cd93.png'
                ],
                colors: [
                    { name: 'Vintage Black', code: '#2C2C2C' }
                ]
            },
            'bungi-hat-black': {
                title: 'BUNGI X BOBBY Tech Animal Beanie - Black',
                category: 'Beanies',
                images: [
                    'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                    'mockups/unisex-premium-hoodie-black-left-683f9021d2cb7.png'
                ],
                colors: [
                    { name: 'Black', code: '#000000' }
                ]
            },
            'bungi-tshirt-white': {
                title: 'BUNGI X BOBBY Tech Animal T-Shirt - White',
                category: 'T-Shirts',
                images: [
                    'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                    'mockups/unisex-premium-hoodie-white-back-683f8fddd1d6d.png'
                ],
                colors: [
                    { name: 'White', code: '#FFFFFF' }
                ]
            },
            'bungi-sweater-gray': {
                title: 'BUNGI X BOBBY Tech Sweater - Heather Gray',
                category: 'Sweaters',
                images: [
                    'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png',
                    'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022d94ea.png'
                ],
                colors: [
                    { name: 'Heather Gray', code: '#D3D3D3' }
                ]
            },
            'bungi-windbreaker-black': {
                title: 'BUNGI X BOBBY Tech Windbreaker - Navy',
                category: 'Windbreakers',
                images: [
                    'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                    'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png'
                ],
                colors: [
                    { name: 'Navy Blazer', code: '#001f3f' }
                ]
            },
            'bungi-sweatpants-white': {
                title: 'BUNGI X BOBBY Tech Sweatpants - Maroon',
                category: 'Sweatpants',
                images: [
                    'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                    'mockups/unisex-premium-hoodie-maroon-back-683f90225ac87.png'
                ],
                colors: [
                    { name: 'Maroon', code: '#800000' }
                ]
            },
            'bungi-hoodie-navy': {
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Navy Blazer',
                category: 'Hoodies',
                images: [
                    'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                    'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png',
                    'mockups/unisex-premium-hoodie-navy-blazer-left-683f90221aa90.png',
                    'mockups/unisex-premium-hoodie-navy-blazer-right-683f90222d3ed.png'
                ],
                colors: [
                    { name: 'Navy Blazer', code: '#001f3f' }
                ]
            },
            'bungi-hoodie-maroon': {
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Maroon',
                category: 'Hoodies',
                images: [
                    'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                    'mockups/unisex-premium-hoodie-maroon-back-683f90225ac87.png',
                    'mockups/unisex-premium-hoodie-maroon-left-683f90228e99c.png',
                    'mockups/unisex-premium-hoodie-maroon-right-683f9022a4ec2.png'
                ],
                colors: [
                    { name: 'Maroon', code: '#800000' }
                ]
            },
            'bungi-hoodie-charcoal': {
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Charcoal Heather',
                category: 'Hoodies',
                images: [
                    'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f90234190a.png',
                    'mockups/unisex-premium-hoodie-charcoal-heather-right-683f9023457b5.png'
                ],
                colors: [
                    { name: 'Charcoal Heather', code: '#36454F' }
                ]
            },
            'bungi-hoodie-white': {
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - White',
                category: 'Hoodies',
                images: [
                    'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                    'mockups/unisex-premium-hoodie-white-back-683f8fddcabb2.png',
                    'mockups/unisex-premium-hoodie-white-left-683f8fddd825c.png',
                    'mockups/unisex-premium-hoodie-white-right-683f8fdddb49b.png'
                ],
                colors: [
                    { name: 'White', code: '#FFFFFF' }
                ]
            }
        };

        const productData = productMap[productId] || productMap['bungi-hoodie-black'];

        // Generate dynamic description based on product type
        const descriptions = {
            'Hoodies': 'Step into the digital underground with Bobby the Rabbit\'s signature hoodie. This premium streetwear piece features the iconic BUNGI X BOBBY RABBIT HARDWARE design, perfect for tech animals of the elite GooberMcGeet club.',
            'Beanies': 'Keep your tech animal style on point with this premium beanie. Featuring Bobby the Rabbit\'s signature design, it\'s perfect for the elite GooberMcGeet club members.',
            'T-Shirts': 'Classic streetwear meets cyberpunk aesthetics. This premium t-shirt showcases Bobby the Tech Animal\'s iconic design for the digital elite.',
            'Sweaters': 'Cozy comfort meets cutting-edge style. This tech-inspired sweater features premium Bobby branding for ultimate streetwear sophistication.',
            'Windbreakers': 'High-tech weather protection with rebellious style. This windbreaker features reflective Bobby elements and elite GooberMcGeet club exclusivity.',
            'Sweatpants': 'Premium comfort for active tech animals. These sweatpants combine Bobby\'s signature styling with ultimate comfort for the digital underground.'
        };

        // Fallback sample product with cyberpunk theme
        return {
            id: productId,
            title: productData.title,
            description: descriptions[productData.category] || descriptions['Hoodies'],
            category: productData.category,
            price: 50.00,
            comparePrice: 65.00,
            images: productData.images,
            colors: productData.colors,
            sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
            features: [
                { icon: '🐰', text: 'Bobby the Tech Animal approved' },
                { icon: '⚡', text: 'Elite GooberMcGeet club exclusive' },
                { icon: '🧵', text: '100% cotton face for ultimate comfort' },
                { icon: '♻️', text: '65% ring-spun cotton, 35% polyester blend' },
                { icon: '👜', text: 'Front pouch pocket for tech essentials' },
                { icon: '🎯', text: 'Self-fabric patch on the back' },
                { icon: '🔥', text: 'Cyberpunk streetwear aesthetic' },
                { icon: '🍪', text: 'Cookie-approved design' }
            ],
            details: 'This product runs small. For the perfect fit, we recommend ordering one size larger than your usual size. Join Bobby\'s crew where the tech animals run wild and cookies are always within reach.',
            care: 'Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed. Handle with the care of a true tech animal.',
            shipping: 'This product is made especially for you as soon as you place an order, which is why it takes us a bit longer to deliver it to you. Each piece is crafted in Bobby\'s digital workshop.',
            rating: 4.9,
            reviewCount: 247,
            featured: true,
            new: true,
            sale: true,
            inventory: this.generateSampleInventory(productData.colors)
        };
    }

    generateSampleInventory(colors) {
        const inventory = {};
        const sizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
        
        colors.forEach(color => {
            sizes.forEach(size => {
                inventory[`${color.name}-${size}`] = Math.floor(Math.random() * 25) + 5;
            });
        });
        
        return inventory;
    }

    renderProduct() {
        const productGrid = document.getElementById('product-detail-grid');
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        
        // Update breadcrumb
        breadcrumbCurrent.textContent = this.currentProduct.title;
        
        // Update page title
        document.title = `${this.currentProduct.title} - Bobby Streetwear`;
        
        // Update page title
        this.updatePageTitle();

        const discount = this.currentProduct.comparePrice ? 
            Math.round(((this.currentProduct.comparePrice - this.currentProduct.price) / this.currentProduct.comparePrice) * 100) : 0;

        productGrid.innerHTML = `
            <!-- Product Images -->
            <div class="product-images">
                <div class="main-image-container">
                    <img src="${this.currentProduct.images[0]}" alt="${this.currentProduct.title}" class="main-image" id="main-image">
                    <button class="image-zoom" onclick="productDetailManager.openImageZoom()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                            <circle cx="11" cy="11" r="3"></circle>
                        </svg>
                    </button>
                    <div class="image-badges">
                        ${this.currentProduct.new ? '<span class="image-badge new">New</span>' : ''}
                        ${this.currentProduct.sale ? `<span class="image-badge sale">-${discount}%</span>` : ''}
                        ${this.currentProduct.featured ? '<span class="image-badge">Featured</span>' : ''}
                    </div>
                </div>
                <div class="thumbnail-grid">
                    ${this.currentProduct.images.map((image, index) => `
                        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="productDetailManager.changeImage(${index})">
                            <img src="${image}" alt="${this.currentProduct.title}">
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Product Info -->
            <div class="product-info">
                <div class="product-category">${this.currentProduct.category}</div>
                <h1 class="product-title">${this.currentProduct.title}</h1>
                
                <div class="product-rating">
                    <div class="stars">
                        ${this.generateStars(this.currentProduct.rating)}
                    </div>
                    <span class="rating-text">${this.currentProduct.rating} (${this.currentProduct.reviewCount} reviews)</span>
                </div>

                <div class="product-price">
                    <span class="price-current">$${this.currentProduct.price.toFixed(2)}</span>
                    ${this.currentProduct.comparePrice ? `<span class="price-original">$${this.currentProduct.comparePrice.toFixed(2)}</span>` : ''}
                    ${this.currentProduct.sale ? `<span class="price-discount">-${discount}%</span>` : ''}
                </div>

                <p class="product-description">${this.currentProduct.description}</p>

                <div class="product-options">
                    ${this.currentProduct.colors.length > 0 ? `
                        <div class="option-group">
                            <label class="option-label">Color</label>
                            <div class="color-options">
                                ${this.currentProduct.colors.map((color, index) => `
                                    <button class="color-option ${index === 0 ? 'active' : ''}" 
                                            style="color: ${color.code}" 
                                            onclick="productDetailManager.selectColor('${color.name}')"
                                            data-color="${color.name}">
                                        <span class="color-name">${color.name}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${this.currentProduct.sizes.length > 0 ? `
                        <div class="option-group">
                            <label class="option-label">
                                Size
                                <a href="#" class="size-guide-link" onclick="productDetailManager.openSizeGuide()">Size Guide</a>
                            </label>
                            <div class="size-options">
                                ${this.currentProduct.sizes.map(size => `
                                    <button class="size-option" 
                                            onclick="productDetailManager.selectSize('${size}')"
                                            data-size="${size}">
                                        ${size}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="quantity-section">
                    <span class="quantity-label">Quantity:</span>
                    <div class="quantity-selector">
                        <button class="quantity-btn" onclick="productDetailManager.updateQuantity(-1)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <span class="quantity-display" id="quantity-display">1</span>
                        <button class="quantity-btn" onclick="productDetailManager.updateQuantity(1)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="product-actions">
                    <button class="add-to-cart-btn" onclick="productDetailManager.addToCart()">
                        Add to Cart
                    </button>
                    <button class="wishlist-btn" onclick="productDetailManager.toggleWishlist()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>

                <div class="product-features">
                    <div class="features-grid">
                        ${this.currentProduct.features.map(feature => `
                            <div class="feature-item">
                                <div class="feature-icon">${feature.icon}</div>
                                <div class="feature-text">${feature.text}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="product-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" onclick="productDetailManager.switchTab('details')">Details</button>
                        <button class="tab-btn" onclick="productDetailManager.switchTab('care')">Care Instructions</button>
                        <button class="tab-btn" onclick="productDetailManager.switchTab('shipping')">Shipping</button>
                        <button class="tab-btn" onclick="productDetailManager.switchTab('reviews')">Reviews</button>
                    </div>
                    <div class="tab-content active" id="tab-details">
                        <p>${this.currentProduct.details}</p>
                    </div>
                    <div class="tab-content" id="tab-care">
                        <p>${this.currentProduct.care}</p>
                    </div>
                    <div class="tab-content" id="tab-shipping">
                        <p>${this.currentProduct.shipping}</p>
                    </div>
                    <div class="tab-content" id="tab-reviews">
                        <p>Customer reviews will be displayed here. Average rating: ${this.currentProduct.rating}/5 based on ${this.currentProduct.reviewCount} reviews.</p>
                    </div>
                </div>
            </div>
        `;

        // Set initial selections
        if (this.currentProduct.colors.length > 0) {
            this.selectedVariant.color = this.currentProduct.colors[0].name;
        }
        
        this.updateInventoryDisplay();
    }

    updatePageTitle() {
        const collectionTitle = document.querySelector('.collection-title');
        
        if (!this.currentProduct) return;
        
        // Update the simple collection title
        if (collectionTitle) {
            collectionTitle.textContent = this.currentProduct.category.toUpperCase();
        }
    }

    generateProductSubtitle() {
        const subtitles = {
            'hoodie': 'Premium streetwear hoodie for the digital elite',
            'hoodies': 'Premium streetwear hoodie for the digital elite',
            't-shirt': 'Classic tech animal streetwear',
            'tshirt': 'Classic tech animal streetwear',
            'sweater': 'Cozy tech-inspired comfort wear',
            'windbreaker': 'High-tech weather protection',
            'sweatpants': 'Premium comfort for tech animals',
            'joggers': 'Elite streetwear for active tech animals',
            'beanie': 'Tech animal headwear essentials',
            'hat': 'Tech animal headwear essentials'
        };
        
        const category = this.currentProduct.category.toLowerCase();
        return subtitles[category] || 'Premium BUNGI X BOBBY streetwear';
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<span class="star">★</span>';
        }
        
        if (hasHalfStar) {
            starsHTML += '<span class="star">☆</span>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<span class="star empty">☆</span>';
        }
        
        return starsHTML;
    }

    setupEventListeners() {
        // Navigation
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Size guide modal
        const sizeGuideModal = document.getElementById('size-guide-modal');
        const sizeGuideClose = document.getElementById('size-guide-close');
        const sizeGuideOverlay = document.getElementById('size-guide-overlay');

        if (sizeGuideClose) {
            sizeGuideClose.addEventListener('click', () => this.closeSizeGuide());
        }

        if (sizeGuideOverlay) {
            sizeGuideOverlay.addEventListener('click', () => this.closeSizeGuide());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSizeGuide();
                this.closeImageZoom();
            }
        });
    }

    changeImage(index) {
        const mainImage = document.getElementById('main-image');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        if (mainImage && this.currentProduct.images[index]) {
            mainImage.src = this.currentProduct.images[index];
            this.currentImageIndex = index;
            
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
        }
    }

    selectColor(colorName) {
        this.selectedVariant.color = colorName;
        
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('active', option.dataset.color === colorName);
        });
        
        this.updateInventoryDisplay();
    }

    selectSize(size) {
        this.selectedVariant.size = size;
        
        document.querySelectorAll('.size-option').forEach(option => {
            option.classList.toggle('active', option.dataset.size === size);
        });
        
        this.updateInventoryDisplay();
    }

    updateQuantity(change) {
        const newQuantity = this.selectedVariant.quantity + change;
        const maxQuantity = this.getAvailableStock();
        
        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
            this.selectedVariant.quantity = newQuantity;
            document.getElementById('quantity-display').textContent = newQuantity;
        }
        
        // Update quantity buttons
        const decreaseBtn = document.querySelector('.quantity-btn:first-child');
        const increaseBtn = document.querySelector('.quantity-btn:last-child');
        
        if (decreaseBtn) decreaseBtn.disabled = this.selectedVariant.quantity <= 1;
        if (increaseBtn) increaseBtn.disabled = this.selectedVariant.quantity >= maxQuantity;
    }

    getAvailableStock() {
        if (!this.selectedVariant.color || !this.selectedVariant.size) {
            return 0;
        }
        
        const variantKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        return this.currentProduct.inventory[variantKey] || 0;
    }

    updateInventoryDisplay() {
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        const sizeOptions = document.querySelectorAll('.size-option');
        
        if (!this.selectedVariant.color) return;
        
        // Update size availability
        sizeOptions.forEach(option => {
            const size = option.dataset.size;
            const variantKey = `${this.selectedVariant.color}-${size}`;
            const stock = this.currentProduct.inventory[variantKey] || 0;
            
            option.classList.toggle('unavailable', stock === 0);
            option.disabled = stock === 0;
        });
        
        // Update add to cart button
        const stock = this.getAvailableStock();
        if (addToCartBtn) {
            addToCartBtn.disabled = stock === 0 || !this.selectedVariant.size;
            addToCartBtn.textContent = stock === 0 ? 'Out of Stock' : 
                                      !this.selectedVariant.size ? 'Select Size' : 'Add to Cart';
        }
    }

    addToCart() {
        if (!this.selectedVariant.color || !this.selectedVariant.size) {
            this.showNotification('Please select color and size', 'error');
            return;
        }
        
        const stock = this.getAvailableStock();
        if (stock < this.selectedVariant.quantity) {
            this.showNotification('Not enough stock available', 'error');
            return;
        }
        
        const cartItem = {
            ...this.currentProduct,
            selectedColor: this.selectedVariant.color,
            selectedSize: this.selectedVariant.size,
            quantity: this.selectedVariant.quantity
        };
        
        if (window.cartManager) {
            window.cartManager.addItem(cartItem, this.selectedVariant);
        }
        
        // Update inventory
        const variantKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        this.currentProduct.inventory[variantKey] -= this.selectedVariant.quantity;
        this.updateInventoryDisplay();
        
        this.showNotification('Added to cart!', 'success');
    }

    toggleWishlist() {
        const wishlistBtn = document.querySelector('.wishlist-btn');
        
        if (window.wishlistManager) {
            window.wishlistManager.toggleItem(this.currentProduct.id);
            wishlistBtn.classList.toggle('active');
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[onclick="productDetailManager.switchTab('${tabName}')"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    openSizeGuide() {
        const modal = document.getElementById('size-guide-modal');
        const content = document.getElementById('size-guide-content');
        
        content.innerHTML = `
            <p>Find your perfect fit with our size guide:</p>
            <table class="size-guide-table">
                <thead>
                    <tr>
                        <th>Size</th>
                        <th>Chest (inches)</th>
                        <th>Length (inches)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>S</td><td>20</td><td>27</td></tr>
                    <tr><td>M</td><td>21</td><td>28</td></tr>
                    <tr><td>L</td><td>23</td><td>29</td></tr>
                    <tr><td>XL</td><td>25</td><td>30</td></tr>
                    <tr><td>2XL</td><td>26½</td><td>31</td></tr>
                    <tr><td>3XL</td><td>28</td><td>32</td></tr>
                </tbody>
            </table>
            <p><strong>Note:</strong> This hoodie runs small. We recommend ordering one size larger than your usual size.</p>
        `;
        
        modal.classList.add('active');
    }

    closeSizeGuide() {
        const modal = document.getElementById('size-guide-modal');
        modal.classList.remove('active');
    }

    openImageZoom() {
        const modal = document.createElement('div');
        modal.className = 'image-zoom-modal';
        modal.innerHTML = `
            <img src="${this.currentProduct.images[this.currentImageIndex]}" alt="${this.currentProduct.title}" class="zoom-image">
            <button class="zoom-close" onclick="productDetailManager.closeImageZoom()">×</button>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeImageZoom();
            }
        });
    }

    closeImageZoom() {
        const modal = document.querySelector('.image-zoom-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    addToRecentlyViewed(product) {
        this.recentlyViewed = this.recentlyViewed.filter(p => p.id !== product.id);
        this.recentlyViewed.unshift(product);
        this.recentlyViewed = this.recentlyViewed.slice(0, 5);
        
        try {
            localStorage.setItem('bobby-streetwear-recently-viewed', JSON.stringify(this.recentlyViewed));
        } catch (error) {
            console.error('Error saving recently viewed:', error);
        }
        
        this.renderRecentlyViewed();
    }

    loadRecentlyViewed() {
        try {
            const saved = localStorage.getItem('bobby-streetwear-recently-viewed');
            if (saved) {
                this.recentlyViewed = JSON.parse(saved);
                this.renderRecentlyViewed();
            }
        } catch (error) {
            console.error('Error loading recently viewed:', error);
        }
    }

    renderRecentlyViewed() {
        const grid = document.getElementById('recently-viewed-grid');
        const section = document.querySelector('.recently-viewed');
        
        if (this.recentlyViewed.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        grid.innerHTML = this.recentlyViewed.map(product => this.createProductCard(product)).join('');
    }

    async loadRelatedProducts() {
        // Load related products based on category
        const relatedProducts = await this.fetchRelatedProducts();
        const grid = document.getElementById('related-products-grid');
        
        grid.innerHTML = relatedProducts.map(product => this.createProductCard(product)).join('');
    }

    async fetchRelatedProducts() {
        // Related products using real mockup images
        return [
            {
                id: 'bungi-hoodie-navy',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Navy Blazer',
                price: 50.00,
                comparePrice: null,
                mainImage: 'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                category: 'hoodie',
                featured: true
            },
            {
                id: 'bungi-hoodie-maroon',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Maroon',
                price: 50.00,
                comparePrice: 58.00,
                mainImage: 'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                category: 'hoodie',
                sale: true
            },
            {
                id: 'bungi-hoodie-white',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - White',
                price: 50.00,
                comparePrice: null,
                mainImage: 'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                category: 'hoodie',
                new: true
            },
            {
                id: 'bungi-hoodie-charcoal',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Charcoal Heather',
                price: 50.00,
                comparePrice: 65.00,
                mainImage: 'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f90234190a.png',
                category: 'hoodie',
                sale: true
            }
        ];
    }

    createProductCard(product) {
        const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
        
        return `
            <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
                <div class="product-image-container">
                    <img src="${product.mainImage}" alt="${product.title}" class="product-image">
                    <div class="product-badges">
                        ${product.new ? '<span class="product-badge new">New</span>' : ''}
                        ${product.sale ? `<span class="product-badge sale">-${discount}%</span>` : ''}
                        ${product.featured ? '<span class="product-badge">Featured</span>' : ''}
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category.replace('-', ' ')}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                        ${product.comparePrice ? `<span class="price-original">$${product.comparePrice.toFixed(2)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
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
}

// Initialize product detail manager
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();
});