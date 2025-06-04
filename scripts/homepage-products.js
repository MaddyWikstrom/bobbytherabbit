// Homepage Product Loader
class HomepageProductLoader {
    constructor() {
        this.products = [];
        this.currentIndex = 0;
        this.productsPerView = 4;
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.renderProducts();
        this.setupScrolling();
    }

    async loadProducts() {
        try {
            // Try to load from CSV first
            const csvData = await this.loadCSVData();
            if (csvData && csvData.trim()) {
                this.products = this.parseCSVToProducts(csvData);
            } else {
                // Fallback to sample products
                this.products = this.getSampleProducts();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = this.getSampleProducts();
        }
    }

    async loadCSVData() {
        try {
            const response = await fetch('products_export_1.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return csvText;
        } catch (error) {
            console.error('Error loading CSV:', error);
            return '';
        }
    }

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
            if (values.length < 10) continue;

            const handle = values[0];
            const title = values[1];
            const description = values[2];
            const price = parseFloat(values[22]) || 0;
            const comparePrice = parseFloat(values[23]) || 0;
            const imageUrl = values[26];

            if (!handle || !title || !imageUrl) continue;

            if (!products.has(handle)) {
                products.set(handle, {
                    id: handle,
                    title: title,
                    description: this.cleanDescription(description),
                    category: this.extractCategory(title),
                    price: price,
                    comparePrice: comparePrice > price ? comparePrice : null,
                    mainImage: imageUrl,
                    featured: Math.random() > 0.7,
                    new: Math.random() > 0.8,
                    sale: comparePrice > price
                });
            }
        }

        return Array.from(products.values()).slice(0, 20); // Limit to 20 products for homepage
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
            .substring(0, 100) + '...';
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

    getSampleProducts() {
        return [
            {
                id: 'bungi-hoodie-black',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Black',
                description: 'Premium streetwear hoodie with unique rabbit hardware design.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: 65.00,
                mainImage: 'assets/hoodie-black.png',
                featured: true,
                new: true,
                sale: true
            },
            {
                id: 'bungi-hoodie-navy',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Navy',
                description: 'Premium streetwear hoodie with unique rabbit hardware design.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'assets/hoodie-navy.png',
                featured: true,
                new: false,
                sale: false
            },
            {
                id: 'bungi-hoodie-maroon',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Maroon',
                description: 'Premium streetwear hoodie with unique rabbit hardware design.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'assets/hoodie-maroon.png',
                featured: false,
                new: true,
                sale: false
            },
            {
                id: 'bungi-hoodie-charcoal',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Charcoal',
                description: 'Premium streetwear hoodie with unique rabbit hardware design.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: 58.00,
                mainImage: 'assets/hoodie-charcoal.png',
                featured: false,
                new: false,
                sale: true
            },
            {
                id: 'bungi-hoodie-white',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - White',
                description: 'Premium streetwear hoodie with unique rabbit hardware design.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'assets/hoodie-white.png',
                featured: true,
                new: false,
                sale: false
            },
            {
                id: 'bungi-hoodie-vintage-black',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Vintage Black',
                description: 'Premium streetwear hoodie with unique rabbit hardware design.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'assets/hoodie-vintage-black.png',
                featured: false,
                new: true,
                sale: false
            }
        ];
    }

    renderProducts() {
        const container = document.getElementById('homepage-products');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="loading-products">
                    <p>No products available</p>
                </div>
            `;
            return;
        }

        const productsHTML = this.products.map(product => this.createProductCard(product)).join('');
        container.innerHTML = productsHTML;

        // Add click handlers
        this.attachEventListeners();
    }

    createProductCard(product) {
        const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
        
        return `
            <div class="product-card" data-product-id="${product.id}" onclick="homepageProductLoader.viewProduct('${product.id}')">
                <div class="product-image">
                    <img src="${product.mainImage}" alt="${product.title}" loading="lazy">
                    ${product.new ? '<div class="product-badge new">New</div>' : ''}
                    ${product.sale ? `<div class="product-badge sale">-${discount}%</div>` : ''}
                    ${product.featured ? '<div class="product-badge featured">Featured</div>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category.replace('-', ' ')}</div>
                    <h3 class="product-name">${product.title}</h3>
                    <div class="product-price">
                        $${product.price.toFixed(2)}
                        ${product.comparePrice ? `<span class="original-price">$${product.comparePrice.toFixed(2)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Add hover effects
        document.querySelectorAll('#homepage-products .product-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    setupScrolling() {
        const scrollContainer = document.querySelector('.product-grid-scroll');
        const leftArrow = document.getElementById('scroll-left');
        const rightArrow = document.getElementById('scroll-right');

        if (!scrollContainer || !leftArrow || !rightArrow) return;

        const scrollAmount = 320; // Width of one card plus gap

        leftArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        rightArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        // Update arrow states based on scroll position
        const updateArrows = () => {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
            leftArrow.disabled = scrollLeft <= 0;
            rightArrow.disabled = scrollLeft >= scrollWidth - clientWidth - 10;
        };

        scrollContainer.addEventListener('scroll', updateArrows);
        updateArrows(); // Initial state

        // Touch/swipe support for mobile
        let startX = 0;
        let scrollStart = 0;

        scrollContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            scrollStart = scrollContainer.scrollLeft;
        });

        scrollContainer.addEventListener('touchmove', (e) => {
            if (!startX) return;
            
            const currentX = e.touches[0].clientX;
            const diff = startX - currentX;
            scrollContainer.scrollLeft = scrollStart + diff;
        });

        scrollContainer.addEventListener('touchend', () => {
            startX = 0;
            scrollStart = 0;
        });
    }

    viewProduct(productId) {
        // Navigate to product detail page
        window.location.href = `product.html?id=${productId}`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the homepage and the main site is visible
    if (document.getElementById('homepage-products')) {
        window.homepageProductLoader = new HomepageProductLoader();
    }
});