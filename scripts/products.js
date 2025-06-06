// Products Management System
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
        await this.loadProducts();
        this.setupEventListeners();
        this.renderProducts();
    }

    async loadProducts() {
        try {
            // First priority: Try Shopify Buy SDK (bypasses CORS)
            console.log('🛍️ Attempting to load products via Shopify Buy SDK...');
            const shopifySDKProducts = await this.loadShopifySDKProducts();
            
            if (shopifySDKProducts && shopifySDKProducts.length > 0) {
                this.products = shopifySDKProducts;
                console.log(`✅ Successfully loaded ${this.products.length} products from Shopify Buy SDK!`);
                this.filteredProducts = [...this.products];
                return;
            }
            
            // Second priority: Try to parse CSV data
            console.log('📄 SDK failed, loading products from CSV data...');
            const csvData = await this.loadCSVData();
            this.products = this.parseCSVToProducts(csvData);
            
            if (this.products.length > 0) {
                console.log(`✅ Successfully loaded ${this.products.length} products from CSV`);
                this.filteredProducts = [...this.products];
                return;
            }
            
            // Third priority: Try to load from Shopify API via Netlify function
            console.log('🛍️ CSV failed, attempting to load products from Shopify API...');
            const shopifyProducts = await this.loadShopifyProducts();
            
            if (shopifyProducts && shopifyProducts.length > 0) {
                this.products = shopifyProducts;
                console.log(`✅ Successfully loaded ${this.products.length} products from Shopify API!`);
                this.filteredProducts = [...this.products];
                return;
            }
            
            // No products found
            console.log('⚠️ No products found from any source');
            this.products = [];
            this.filteredProducts = [];
            
        } catch (error) {
            console.error('❌ Error loading products:', error);
            console.log('❌ No products loaded due to error');
            this.products = [];
            this.filteredProducts = [];
        }
    }

    async loadShopifySDKProducts() {
        try {
            // Initialize Shopify Buy SDK Manager
            if (!window.shopifySDKManager) {
                window.shopifySDKManager = new ShopifyBuySDKManager();
            }
            
            // Wait for SDK to load and initialize
            let attempts = 0;
            while (!window.shopifySDKManager.isLoaded && attempts < 30) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
            
            if (!window.shopifySDKManager.isLoaded) {
                throw new Error('Shopify Buy SDK failed to load within 30 seconds');
            }
            
            // Load products via SDK
            const products = await window.shopifySDKManager.loadProducts();
            return products;
            
        } catch (error) {
            console.error('❌ Error loading products via Shopify Buy SDK:', error);
            return null;
        }
    }

    async loadShopifyProducts() {
        try {
            console.log('🛍️ Fetching products via Netlify function to bypass CORS...');
            
            // Use Netlify function to bypass CORS restrictions
            const response = await fetch('/.netlify/functions/get-products', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.log('❌ Netlify function failed, status:', response.status);
                throw new Error(`Netlify function failed with status: ${response.status}`);
            }

            const shopifyProducts = await response.json();
            console.log(`🛍️ Fetched ${shopifyProducts.length} products from Shopify via Netlify function`);
            
            // Convert Shopify products to our format
            return this.convertShopifyProducts(shopifyProducts);
            
        } catch (error) {
            console.error('❌ Error loading Shopify products via Netlify function:', error);
            return null;
        }
    }


    convertShopifyProducts(shopifyProducts) {
        return shopifyProducts.map(edge => {
            const product = edge.node;
            
            // Extract images from Shopify
            const shopifyImages = product.images.edges.map(imgEdge => imgEdge.node.url);
            
            // Get local mockup images
            const localImages = this.getLocalMockupImages(product.handle, product.title);
            
            // Combine both image sources - local mockups first, then Shopify images
            const images = [...localImages, ...shopifyImages];
            
            // Extract variants and organize by color/size
            const variants = [];
            const colors = new Set();
            const sizes = new Set();
            
            product.variants.edges.forEach(variantEdge => {
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
                
                variants.push({
                    id: variant.id,
                    color: color,
                    size: size,
                    price: parseFloat(variant.price.amount),
                    comparePrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                    availableForSale: variant.availableForSale,
                    image: images[0] || ''
                });
            });
            
            // Determine category from product type or title
            const category = this.extractCategory(product.title);
            
            // Calculate pricing
            const minPrice = parseFloat(product.priceRange.minVariantPrice.amount);
            const maxPrice = parseFloat(product.priceRange.maxVariantPrice.amount);
            const comparePrice = variants.find(v => v.comparePrice)?.comparePrice || null;
            
            return {
                id: product.handle,
                shopifyId: product.id,
                title: product.title,
                description: this.cleanDescription(product.description),
                category: category,
                price: minPrice,
                comparePrice: comparePrice,
                images: images.length > 0 ? images : [],
                mainImage: images[0] || '',
                variants: variants,
                colors: Array.from(colors),
                sizes: Array.from(sizes),
                featured: product.tags.includes('featured') || Math.random() > 0.7,
                new: product.tags.includes('new') || Math.random() > 0.8,
                sale: comparePrice > minPrice,
                tags: product.tags,
                productType: product.productType
            };
        });
    }

    async loadCSVData() {
        try {
            // First try to fetch the CSV file (works when deployed)
            const response = await fetch('products_export_1.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return csvText;
        } catch (error) {
            console.error('Error loading CSV:', error);
            // Return embedded CSV data for local development
            return this.getEmbeddedCSVData();
        }
    }

    getEmbeddedCSVData() {
        // Embedded CSV data to bypass CORS restrictions during local development
        return `Handle,Title,Body (HTML),Vendor,Product Category,Type,Tags,Published,Option1 Name,Option1 Value,Option1 Linked To,Option2 Name,Option2 Value,Option2 Linked To,Option3 Name,Option3 Value,Option3 Linked To,Variant SKU,Variant Grams,Variant Inventory Tracker,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Variant Barcode,Image Src,Image Position,Image Alt Text,Gift Card,SEO Title,SEO Description,Google Shopping / Google Product Category,Google Shopping / Gender,Google Shopping / Age Group,Google Shopping / MPN,Google Shopping / Condition,Google Shopping / Custom Product,Google Shopping / Custom Label 0,Google Shopping / Custom Label 1,Google Shopping / Custom Label 2,Google Shopping / Custom Label 3,Google Shopping / Custom Label 4,Variant Image,Variant Weight Unit,Variant Tax Code,Cost per item,Status
bungi-x-bobby-rabbit-hardware-unisex-hoodie,BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie,"Who knew that the softest hoodie you'll ever own comes with such a cool design. You won't regret buying this classic streetwear piece of apparel with a convenient pouch pocket and warm hood for chilly evenings.",My Store,Uncategorized,"","",false,Color,Black,,Size,S,,,,,9004018_10779,487.61179775,shopify,deny,manual,50.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png?v=1748999462,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png?v=1748999462,oz,PC040100,45.79,active
bungi-x-bobby-rabbit-hardware-unisex-hoodie,,,,,,,,,Black,,,M,,,,,9004018_10780,532.97103475,shopify,deny,manual,50.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-back-683f9d11a9742.png?v=1748999463,2,Product mockup,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png?v=1748999462,oz,PC040100,45.79,
bungi-x-bobby-rabbit-hardware-unisex-hoodie,,,,,,,,,Black,,,L,,,,,9004018_10781,566.9904625,shopify,deny,manual,50.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-navy-blazer-front-683f9d11ab4fe.png?v=1748999463,3,Product mockup,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png?v=1748999462,oz,PC040100,45.79,
bungi-x-bobby-rabbit-hardware-unisex-hoodie,,,,,,,,,Black,,,XL,,,,,9004018_10782,609.5147471875,shopify,deny,manual,50.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-navy-blazer-back-683f9d11ae0c4.png?v=1748999462,4,Product mockup,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png?v=1748999462,oz,PC040100,45.79,
bungi-x-bobby-rabbit-hardware-unisex-hoodie,,,,,,,,,Navy Blazer,,,S,,,,,9004018_11491,487.61179775,shopify,deny,manual,50.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-charcoal-heather-front-683f9d11bbc17.png?v=1748999463,7,Product mockup,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-navy-blazer-front-683f9d11ab4fe.png?v=1748999463,oz,PC040100,45.79,
bungi-x-bobby-rabbit-hardware-unisex-hoodie,,,,,,,,,Navy Blazer,,,M,,,,,9004018_11492,532.97103475,shopify,deny,manual,50.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-charcoal-heather-back-683f9d11c14f8.png?v=1748999462,8,Product mockup,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-navy-blazer-front-683f9d11ab4fe.png?v=1748999463,oz,PC040100,45.79,
bungi-x-bobby-rabbit-hardware-unisex-hoodie,,,,,,,,,Maroon,,,S,,,,,9004018_11486,487.61179775,shopify,deny,manual,50.00,,true,true,,,,,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-maroon-front-683f9d11b1d12.png?v=1748999463,oz,PC040100,45.79,
bungi-x-bobby-rabbit-hardware-unisex-hoodie,,,,,,,,,Maroon,,,M,,,,,9004018_11487,532.97103475,shopify,deny,manual,50.00,,true,true,,,,,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-maroon-front-683f9d11b1d12.png?v=1748999463,oz,PC040100,45.79,
bungi-x-bobby-rabbit-hardware-unisex-hoodie,,,,,,,,,Charcoal Heather,,,S,,,,,9004018_11481,487.61179775,shopify,deny,manual,50.00,,true,true,,,,,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-charcoal-heather-front-683f9d11bbc17.png?v=1748999463,oz,PC040100,45.79,
bungi-x-bobby-rabbit-hardware-unisex-hoodie,,,,,,,,,Vintage Black,,,S,,,,,9004018_20272,487.61179775,shopify,deny,manual,50.00,,true,true,,,,,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-vintage-black-front-683f9d11c724f.png?v=1748999462,oz,PC040100,45.79,
bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie,BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Unisex Hoodie,"Who knew that the softest hoodie you'll ever own comes with such a cool design. You won't regret buying this classic streetwear piece of apparel with a convenient pouch pocket and warm hood for chilly evenings.",My Store,,"","",false,Size,S,,,,,,,,4356716_10774,487.61179775,shopify,deny,manual,50.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png?v=1748999411,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png?v=1748999411,oz,PC040100,45.79,active
bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie,,,,,,,,,M,,,,,,,,4356716_10775,532.97103475,shopify,deny,manual,50.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-back-683f9ce10ab8f.png?v=1748999410,2,Product mockup,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png?v=1748999411,oz,PC040100,45.79,
bungi-x-bobby-lightmode-rabbit-hardware-mens-t-shirt,BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Men's t-shirt,"Get to know your new favorite tee—it's super smooth, super comfortable, and made from a cotton touch polyester jersey that won't fade after washing.",My Store,,"","",false,Size,XS,,,,,,,,7836547_8850,155.07189149375,shopify,deny,manual,27.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png?v=1748999335,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png?v=1748999335,oz,PC040100,22.39,active
bungi-x-bobby-lightmode-rabbit-hardware-mens-t-shirt,,,,,,,,,S,,,,,,,,7836547_8851,174.34956721875,shopify,deny,manual,27.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-back-683f9c9fdd370.png?v=1748999335,2,Product mockup,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png?v=1748999335,oz,PC040100,22.39,
bungi-x-bobby-rabbit-hardware-mens-t-shirt,BUNGI X BOBBY RABBIT HARDWARE Men's t-shirt,"Get to know your new favorite tee—it's super smooth, super comfortable, and made from a cotton touch polyester jersey that won't fade after washing.",My Store,,"","",false,Size,XS,,,,,,,,3735441_8850,155.07189149375,shopify,deny,manual,27.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c6a74d70.png?v=1748999286,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c6a74d70.png?v=1748999286,oz,PC040100,22.39,active
bungi-x-bobby-rabbit-hardware-unisex-sweatshirt,BUNGI X BOBBY RABBIT HARDWARE Unisex Sweatshirt,"Each unique, all-over printed sweatshirt is precision-cut and hand-sewn to achieve the best possible look and bring out the intricate design.",My Store,,"","",false,Size,2XS,,,,,,,,8966477_19769,379.883609875,shopify,deny,manual,42.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-recycled-unisex-sweatshirt-white-front-683f9be9c4dea.png?v=1748999157,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-recycled-unisex-sweatshirt-white-front-683f9be9c4dea.png?v=1748999157,oz,PC040100,34.63,active
bungi-x-bobby-rabbit-hardware-womens-t-shirt,BUNGI X BOBBY RABBIT HARDWARE Women's T-shirt,"Get to know your new favorite tee—it's super smooth, super comfortable, and made from a cotton-touch polyester jersey that won't fade after washing.",My Store,,"","",false,Size,XS,,,,,,,,5932847_8884,104.3262451,shopify,deny,manual,27.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-womens-crew-neck-t-shirt-white-front-683f9bbadb79f.png?v=1748999112,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-womens-crew-neck-t-shirt-white-front-683f9bbadb79f.png?v=1748999112,oz,PC040100,21.37,active
bungi-x-bobby-rabbit-darkmode-embroidered-unisex-organic-oversized-sweatshirt,BUNGI X BOBBY RABBIT DARKMODE EMBROIDERED Unisex organic oversized sweatshirt,"Get comfy in this organic oversized sweatshirt, an excellent companion for getting warm and cozy anywhere.",My Store,,"","",false,Color,Black,,Size,S,,,,,1039392_20831,498.951607,shopify,deny,manual,50.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-organic-oversized-sweatshirt-black-back-683f9b628540b.png?v=1748999022,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-organic-oversized-sweatshirt-black-front-683f9b6285f66.png?v=1748999022,oz,PC040100,44.76,active
bungi-x-bobby-rabbit-hardware-unisex-organic-oversized-sweatshirt,BUNGI X BOBBY RABBIT LIGHTMODE EMBROIDERED Unisex organic oversized sweatshirt,"Get comfy in this organic oversized sweatshirt, an excellent companion for getting warm and cozy anywhere.",My Store,,"","",false,Color,Black,,Size,S,,,,,5234695_20831,498.951607,shopify,deny,manual,50.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-organic-oversized-sweatshirt-black-back-683f9b0bd823b.png?v=1748998934,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-organic-oversized-sweatshirt-black-front-683f9b0bd9027.png?v=1748998934,oz,PC040100,44.76,active
bungi-x-bobby-cuffed-beanie-1,BUNGI X BOBBY Cuffed Beanie,"A snug, form-fitting beanie. It's not only a great head-warming piece but a staple accessory in anyone's wardrobe.",My Store,,"","",false,Color,Black,,,,,,,,4804417_8936,85.048569375,shopify,deny,manual,15.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/cuffed-beanie-black-front-683f9a789ba58.png?v=1748998784,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/cuffed-beanie-black-front-683f9a789ba58.png?v=1748998784,oz,PC040129,12.79,active
bungi-x-bobby-cuffed-beanie-1,,,,,,,,,White,,,,,,,,4804417_8938,85.048569375,shopify,deny,manual,15.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/cuffed-beanie-white-front-683f9a789c355.png?v=1748998784,2,Product mockup,,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/cuffed-beanie-white-front-683f9a789c355.png?v=1748998784,oz,PC040129,12.79,
bungi-x-bobby-dark-mode-wide-leg-joggers,BUNGI X BOBBY DARK MODE Wide-leg joggers,"Rediscover '90s fashion with these all-over print wide-leg joggers. Ideal for athleisure looks and casual outings.",My Store,,"","",false,Size,2XS,,,,,,,,6222891_19889,479.95742650625,shopify,deny,manual,43.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-unisex-wide-leg-joggers-white-back-68421e1085cf8.png?v=1748998622,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085cf9.png?v=1748998622,oz,,38.95,active
wide-leg-joggers,BUNGI X BOBBY LIGHTMODE Wide-leg joggers,"Rediscover '90s fashion with these all-over print wide-leg joggers. Ideal for athleisure looks and casual outings.",My Store,,"","",false,Size,2XS,,,,,,,,7529383_19889,479.95742650625,shopify,deny,manual,44.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-unisex-wide-leg-joggers-white-back-68421e1085d00.png?v=1748998443,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085d01.png?v=1748998443,oz,,38.95,active
bungi-x-bobby-cowboy-unisex-windbreaker,BUNGI X BOBBY COWBOY Unisex windbreaker,"Whether you're hiking, camping, or just running errands, this casual, sporty windbreaker's got you covered.",My Store,Uncategorized,"","",true,Color,Black,,Size,S,,,,,2813074_16424,192.011320125625,shopify,deny,manual,41.00,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/basic-unisex-windbreaker-black-front-683f9890d7838.png?v=1748998298,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/basic-unisex-windbreaker-black-front-683f9890d7838.png?v=1748998298,oz,,33.25,active
bungi-x-bobby-cowboy-unisex-sweatshirt,BUNGI X BOBBY COWBOY Unisex Sweatshirt,"Each unique, all-over printed sweatshirt is precision-cut and hand-sewn to achieve the best possible look and bring out the intricate design.",My Store,,"","",true,Size,2XS,,,,,,,,7066242_19769,379.883609875,shopify,deny,manual,42.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-recycled-unisex-sweatshirt-white-front-683f985018ab4.png?v=1748998234,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-recycled-unisex-sweatshirt-white-front-683f985018ab4.png?v=1748998234,oz,PC040100,34.63,active
bungi-x-bobby-cowboy-mens-t-shirt,BUNGI X BOBBY COWBOY Men's t-shirt,"Get to know your new favorite tee—it's super smooth, super comfortable, and made from a cotton touch polyester jersey that won't fade after washing.",My Store,,"","",true,Size,XS,,,,,,,,9951917_8850,155.07189149375,shopify,deny,manual,27.50,,true,true,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f97ee5c7af.png?v=1748998137,1,Product mockup,false,,,,,,,,,,,,,,https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f97ee5c7af.png?v=1748998137,oz,PC040100,22.39,active`;
    }

    parseCSVToProducts(csvText) {
        if (!csvText || csvText.trim() === '') {
            console.log('CSV data is empty');
            return [];
        }

        const lines = csvText.split('\n');
        if (lines.length < 2) {
            console.log('CSV has insufficient data');
            return [];
        }

        const headers = lines[0].split(',');
        const products = new Map();

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length < headers.length) continue;

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
                // Get local mockup images
                const localImages = this.getLocalMockupImages(handle, title);
                
                // Combine local mockups with CSV image URL
                const images = [...localImages];
                if (imageUrl && !images.includes(imageUrl)) {
                    images.push(imageUrl);
                }
                
                products.set(handle, {
                    id: handle,
                    title: title,
                    description: this.cleanDescription(description),
                    category: this.extractCategory(title),
                    price: price,
                    comparePrice: comparePrice > price ? comparePrice : null,
                    images: images,
                    variants: [],
                    colors: new Set(),
                    sizes: new Set(),
                    featured: title.toLowerCase().includes('featured'),
                    new: title.toLowerCase().includes('new'),
                    sale: comparePrice > price
                });
            }

            const product = products.get(handle);
            if (color) product.colors.add(color);
            if (size) product.sizes.add(size);
            
            // Add image URL if not already included
            if (imageUrl && !product.images.includes(imageUrl)) {
                product.images.push(imageUrl);
            }

            product.variants.push({
                color: color,
                size: size,
                price: price,
                comparePrice: comparePrice > price ? comparePrice : null,
                image: imageUrl || ''
            });
        }

        return Array.from(products.values()).map(product => ({
            ...product,
            colors: Array.from(product.colors),
            sizes: Array.from(product.sizes),
            mainImage: product.images[0] || ''
        }));
    }

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
    }

    cleanDescription(description) {
        if (!description) return '';
        return description
            .replace(/<[^>]*>/g, '')
            .replace(/&[^;]+;/g, ' ')
            .trim()
            .substring(0, 200) + '...';
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

    getLocalMockupImages(productHandle, productTitle) {
        // Map product handles to their local mockup images
        const mockupMappings = {
            'bungi-x-bobby-rabbit-hardware-unisex-hoodie': [
                // Black variants
                'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c7dbc.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c454e.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c613f.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c5335.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021d1e6b.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021d10cf.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d2cb7.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d48f6.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d63b0.png',
                'mockups/unisex-premium-hoodie-black-left-front-683f9021d3bb3.png',
                'mockups/unisex-premium-hoodie-black-left-front-683f9021d719b.png',
                'mockups/unisex-premium-hoodie-black-left-front-683f9021d5672.png',
                'mockups/unisex-premium-hoodie-black-product-details-683f9021d031c.png',
                'mockups/unisex-premium-hoodie-black-right-683f9021d7e69.png',
                'mockups/unisex-premium-hoodie-black-right-683f9021d9a41.png',
                'mockups/unisex-premium-hoodie-black-right-683f9021db0c8.png',
                'mockups/unisex-premium-hoodie-black-right-front-683f9021d8c96.png',
                'mockups/unisex-premium-hoodie-black-right-front-683f9021da77d.png',
                'mockups/unisex-premium-hoodie-black-right-front-683f9021db96e.png',
                // Charcoal Heather variants
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022d94ea.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022dda27.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022e79ce.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022e274e.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022ec2ea.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022f0f8b.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f90230b140.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f902306bbf.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9023029ae.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f90231150c.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f902315348.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022af178.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022b4bc6.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022b9614.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022bf4ef.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022c3b59.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022c7f7d.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022cd03c.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022d1c31.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022d56a9.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f90231dc55.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9023221a7.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-683f90232db97.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-683f902335bde.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-683f9023265c1.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-front-683f90232a100.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-front-683f90233a0a8.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-front-683f9023315c6.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-product-details-683f90231950e.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-683f90233dd40.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-683f90234d7d9.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-683f9023457b5.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f90234190a.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f902349507.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f902351581.png',
                // Maroon variants
                'mockups/unisex-premium-hoodie-maroon-back-683f90225ac87.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90225eace.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90226c655.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90226f069.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90227c5b6.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f902266bfa.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f902278df8.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022632e7.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022698f9.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022725ab.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022757a0.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90223e529.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90224aec2.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90224f7a0.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902237f8f.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902242d51.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902253f58.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902257a94.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902282a52.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902285fda.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f9022352a8.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902247897.png',
                'mockups/unisex-premium-hoodie-maroon-left-683f90228e99c.png',
                'mockups/unisex-premium-hoodie-maroon-left-683f902288f36.png',
                'mockups/unisex-premium-hoodie-maroon-left-683f902293d87.png',
                'mockups/unisex-premium-hoodie-maroon-left-front-683f90228c159.png',
                'mockups/unisex-premium-hoodie-maroon-left-front-683f9022912dc.png',
                'mockups/unisex-premium-hoodie-maroon-left-front-683f902296816.png',
                'mockups/unisex-premium-hoodie-maroon-product-details-683f90227f787.png',
                'mockups/unisex-premium-hoodie-maroon-right-683f9022a4ec2.png',
                'mockups/unisex-premium-hoodie-maroon-right-683f90229f0d8.png',
                'mockups/unisex-premium-hoodie-maroon-right-683f9022996fd.png',
                'mockups/unisex-premium-hoodie-maroon-right-front-683f9022a1ecc.png',
                'mockups/unisex-premium-hoodie-maroon-right-front-683f9022a7df8.png',
                'mockups/unisex-premium-hoodie-maroon-right-front-683f90229c199.png',
                // Navy Blazer variants
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f340b.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90220a49d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90220c026.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902202df1.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902207edc.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902211d54.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f9022063c4.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90220129d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90221017f.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902204828.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021df6e7.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e1a2a.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e4de3.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e67ee.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e3452.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e8427.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021ea7ca.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021ecb13.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021eefd9.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9022165b9.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9022183ba.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-683f90221aa90.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-683f90221f43e.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-683f902223cf8.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-front-683f90221cad5.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-front-683f902221fe4.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-front-683f9022262e7.png',
                'mockups/unisex-premium-hoodie-navy-blazer-product-details-683f90221408e.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-683f90222d3ed.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-683f902227e4c.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-683f90223094d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-front-683f90222a85d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-front-683f90222eec5.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-front-683f902233340.png',
                // Vintage Black variants
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023a579e.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023ad2c6.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023b96cd.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023b2911.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023be376.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023c318e.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f90238c9e9.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f90239dcd9.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f902387cc2.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023918a7.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f902396748.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023cc9cc.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023d2ea2.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90235e599.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90236a5e6.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90236fe1c.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90237e394.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f902364bee.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f902382f2a.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023749ba.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90235506f.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90235970a.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f902379677.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-683f9023d85a1.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-683f9023e21ce.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-683f9023eb72a.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-front-683f9023dd7aa.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-front-683f9023e6e1a.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-front-683f9023f0cab.png',
                'mockups/unisex-premium-hoodie-vintage-black-product-details-683f9023c7e67.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-683f90240cd93.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-683f902402ac4.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-683f902418707.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-front-683f90241faf5.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-front-683f902407984.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-front-683f902413558.png'
            ],
            'bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie': [
                // White variants
                'mockups/unisex-premium-hoodie-white-back-683f8fddcabb2.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd1d6d.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd2d80.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd3e2a.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd4edf.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd5fa6.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd14c9.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd25c8.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd35a9.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd4659.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd5753.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcc3c5.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddccd72.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcd618.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcdeaf.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddce7bf.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcf039.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcf92a.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd0bf4.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd70e7.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd0201.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd7977.png',
                'mockups/unisex-premium-hoodie-white-left-683f8fddd825c.png',
                'mockups/unisex-premium-hoodie-white-left-683f8fddd9327.png',
                'mockups/unisex-premium-hoodie-white-left-683f8fddda3b7.png',
                'mockups/unisex-premium-hoodie-white-left-front-683f8fddd8b54.png',
                'mockups/unisex-premium-hoodie-white-left-front-683f8fddd9b64.png',
                'mockups/unisex-premium-hoodie-white-left-front-683f8fdddaba1.png',
                'mockups/unisex-premium-hoodie-white-product-details-683f8fddd68c9.png',
                'mockups/unisex-premium-hoodie-white-right-683f8fdddb49b.png',
                'mockups/unisex-premium-hoodie-white-right-683f8fdddc582.png',
                'mockups/unisex-premium-hoodie-white-right-683f8fdddd5dc.png',
                'mockups/unisex-premium-hoodie-white-right-front-683f8fdddbd08.png',
                'mockups/unisex-premium-hoodie-white-right-front-683f8fdddcda0.png',
                'mockups/unisex-premium-hoodie-white-right-front-683f8fdddde59.png'
            ],
            'bungi-x-bobby-dark-mode-wide-leg-joggers': [
                'mockups/all-over-print-unisex-wide-leg-joggers-white-back-68421e1085cf8.png',
                'mockups/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085cf9.png'
            ],
            'wide-leg-joggers': [
                'mockups/all-over-print-unisex-wide-leg-joggers-white-back-68421e1085d00.png',
                'mockups/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085d01.png'
            ],
            'bungi-x-bobby-lightmode-rabbit-hardware-mens-t-shirt': [
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png',
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-back-683f9c9fdd370.png'
            ],
            'bungi-x-bobby-rabbit-hardware-mens-t-shirt': [
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c6a74d70.png'
            ],
            'bungi-x-bobby-rabbit-hardware-unisex-sweatshirt': [
                'mockups/all-over-print-recycled-unisex-sweatshirt-white-front-683f9be9c4dea.png'
            ],
            'bungi-x-bobby-rabbit-hardware-womens-t-shirt': [
                'mockups/all-over-print-womens-crew-neck-t-shirt-white-front-683f9bbadb79f.png'
            ],
            'bungi-x-bobby-rabbit-darkmode-embroidered-unisex-organic-oversized-sweatshirt': [
                'mockups/unisex-organic-oversized-sweatshirt-black-back-683f9b628540b.png',
                'mockups/unisex-organic-oversized-sweatshirt-black-front-683f9b6285f66.png'
            ],
            'bungi-x-bobby-rabbit-hardware-unisex-organic-oversized-sweatshirt': [
                'mockups/unisex-organic-oversized-sweatshirt-black-back-683f9b0bd823b.png',
                'mockups/unisex-organic-oversized-sweatshirt-black-front-683f9b0bd9027.png'
            ],
            'bungi-x-bobby-cuffed-beanie-1': [
                'mockups/cuffed-beanie-black-front-683f9a789ba58.png',
                'mockups/cuffed-beanie-white-front-683f9a789c355.png'
            ],
            'bungi-x-bobby-cowboy-unisex-windbreaker': [
                'mockups/basic-unisex-windbreaker-black-front-683f9890d7838.png'
            ],
            'bungi-x-bobby-cowboy-unisex-sweatshirt': [
                'mockups/all-over-print-recycled-unisex-sweatshirt-white-front-683f985018ab4.png'
            ],
            'bungi-x-bobby-cowboy-mens-t-shirt': [
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f97ee5c7af.png'
            ]
        };

        // Check if we have mockups for this product
        if (mockupMappings[productHandle]) {
            return mockupMappings[productHandle];
        }

        // Try to find mockups based on product title keywords
        const titleLower = productTitle.toLowerCase();
        for (const [handle, images] of Object.entries(mockupMappings)) {
            if (titleLower.includes(handle.replace(/-/g, ' '))) {
                return images;
            }
        }

        return [];
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
                <img src="${product.mainImage}" alt="${product.title}" class="search-result-image">
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
            case 'featured':
            default:
                this.filteredProducts.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    if (a.new && !b.new) return -1;
                    if (!a.new && b.new) return 1;
                    return 0;
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
                productsGrid.innerHTML = `
                    <div class="no-products">
                        <h3>No products found</h3>
                        <p>Try adjusting your filters or search terms</p>
                    </div>
                `;
                return;
            }

            productsGrid.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');
            this.renderPagination();
            this.attachProductEventListeners();
        }, 500);
    }

    createProductCard(product) {
        const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.mainImage}" alt="${product.title}" class="product-image">
                    <div class="product-overlay">
                        <button class="product-action-btn quick-view-btn" title="Quick View">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="product-action-btn add-to-cart-quick" title="Add to Cart">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                        </button>
                    </div>
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
                            ${product.colors.slice(0, 4).map(color => `
                                <div class="variant-option" style="background-color: ${this.getColorCode(color)}" title="${color}"></div>
                            `).join('')}
                            ${product.colors.length > 4 ? `<span class="variant-more">+${product.colors.length - 4}</span>` : ''}
                        </div>
                    ` : ''}
                    ${this.currentView === 'list' ? '</div><div class="product-actions">' : ''}
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                    ${this.currentView === 'list' ? '</div>' : ''}
                </div>
            </div>
        `;
    }

    getColorCode(colorName) {
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
        return colorMap[colorName] || '#a855f7';
    }

    attachProductEventListeners() {
        // Quick view buttons
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.closest('.product-card').dataset.productId;
                this.showQuickView(productId);
            });
        });

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn, .add-to-cart-quick').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.closest('.product-card').dataset.productId || e.target.dataset.productId;
                this.addToCart(productId);
            });
        });

        // Wishlist buttons
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.dataset.productId;
                this.toggleWishlist(productId);
            });
        });

        // Product card clicks
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
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

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Add animation effect
        const button = document.querySelector(`[data-product-id="${productId}"] .add-to-cart-btn`);
        if (button) {
            button.style.transform = 'scale(0.95)';
            button.textContent = 'Added!';
            setTimeout(() => {
                button.style.transform = '';
                button.textContent = 'Add to Cart';
            }, 1000);
        }

        // Trigger cart update (handled by cart.js)
        if (window.cartManager) {
            window.cartManager.addItem(product);
        }

        // Show success notification
        this.showNotification('Product added to cart!', 'success');
    }

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

    showQuickView(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('quick-view-modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-images">
                    <img src="${product.mainImage}" alt="${product.title}" class="quick-view-main-image">
                    ${product.images.length > 1 ? `
                        <div class="quick-view-thumbnails">
                            ${product.images.map(img => `
                                <img src="${img}" alt="${product.title}" class="quick-view-thumbnail">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="quick-view-details">
                    <div class="product-category">${product.category.replace('-', ' ')}</div>
                    <h2 class="product-title">${product.title}</h2>
                    <div class="product-price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                        ${product.comparePrice ? `<span class="price-original">$${product.comparePrice.toFixed(2)}</span>` : ''}
                    </div>
                    <p class="product-description">${product.description}</p>
                    ${product.colors.length > 0 ? `
                        <div class="product-options">
                            <h4>Colors:</h4>
                            <div class="color-options">
                                ${product.colors.map(color => `
                                    <button class="color-option" style="background-color: ${this.getColorCode(color)}" title="${color}"></button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${product.sizes.length > 0 ? `
                        <div class="product-options">
                            <h4>Sizes:</h4>
                            <div class="size-options">
                                ${product.sizes.map(size => `
                                    <button class="size-option">${size}</button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="quick-view-actions">
                        <button class="add-to-cart-btn" onclick="productManager.addToCart('${product.id}')">
                            Add to Cart
                        </button>
                        <button class="wishlist-btn" onclick="productManager.toggleWishlist('${product.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');

        // Setup modal close events
        const modalClose = document.getElementById('modal-close');
        const modalOverlay = document.getElementById('modal-overlay');
        
        modalClose.onclick = () => modal.classList.remove('active');
        modalOverlay.onclick = () => modal.classList.remove('active');

        // Setup thumbnail clicks
        document.querySelectorAll('.quick-view-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const mainImage = document.querySelector('.quick-view-main-image');
                mainImage.src = e.target.src;
            });
        });

        // Setup option selections
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        document.querySelectorAll('.size-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.size-option').forEach(o => o.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    viewProduct(productId) {
        // Navigate to individual product page
        window.location.href = `product.html?id=${productId}`;
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

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: rgba(26, 26, 46, 0.95);
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        color: #ffffff;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        backdrop-filter: blur(10px);
        max-width: 300px;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .notification-message {
        flex: 1;
        font-weight: 500;
    }

    .notification-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    .notification-close:hover {
        color: #ffffff;
    }

    .notification-success {
        border-color: rgba(34, 197, 94, 0.5);
        background: rgba(34, 197, 94, 0.1);
    }

    .notification-error {
        border-color: rgba(239, 68, 68, 0.5);
        background: rgba(239, 68, 68, 0.1);
    }

    .notification-info {
        border-color: rgba(59, 130, 246, 0.5);
        background: rgba(59, 130, 246, 0.1);
    }

    @media (max-width: 768px) {
        .notification {
            right: 10px;
            left: 10px;
            max-width: none;
            transform: translateY(-100px);
        }

        .notification.show {
            transform: translateY(0);
        }
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);