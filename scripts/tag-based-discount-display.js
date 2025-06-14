// Tag-Based Discount Display System
// Simulates discount pricing for products with sale tags

class TagBasedDiscountDisplay {
  constructor() {
    // Configuration for different sale types
    this.saleConfigs = {
      'weekend-flash': {
        discountPercent: 12,
        badgeText: 'WEEKEND FLASH',
        badgeColor: '#ff4757'
      },
      'flash-sale': {
        discountPercent: 12,
        badgeText: 'FLASH SALE',
        badgeColor: '#ff6b6b'
      },
      'sale': {
        discountPercent: 12,
        badgeText: 'SALE',
        badgeColor: '#e74c3c'
      },
      'clearance': {
        discountPercent: 20,
        badgeText: 'CLEARANCE',
        badgeColor: '#f39c12'
      }
    };
  }

  // Check if product has any sale tags
  hasSaleTag(product) {
    const productNode = product.node || product;
    const tags = productNode.tags || [];
    
    return Object.keys(this.saleConfigs).some(saleTag => 
      tags.some(tag => tag.toLowerCase().includes(saleTag.toLowerCase()))
    );
  }

  // Get sale configuration for product
  getSaleConfig(product) {
    const productNode = product.node || product;
    const tags = productNode.tags || [];
    
    // Check for specific sale tags in order of priority
    for (const [saleTag, config] of Object.entries(this.saleConfigs)) {
      if (tags.some(tag => tag.toLowerCase().includes(saleTag.toLowerCase()))) {
        return { tag: saleTag, ...config };
      }
    }
    
    return null;
  }

  // Calculate original price from discounted price
  calculateOriginalPrice(discountedPrice, discountPercent) {
    // If current price is after 12% discount, original = current / 0.88
    const multiplier = 1 - (discountPercent / 100);
    return discountedPrice / multiplier;
  }

  // Format price for display
  formatPrice(amount, currencyCode = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Generate discount badge HTML
  generateDiscountBadge(saleConfig) {
    if (!saleConfig) return '';

    return `
      <div class="sale-badge" style="background-color: ${saleConfig.badgeColor}">
        <span class="sale-percentage">-${saleConfig.discountPercent}%</span>
        <span class="sale-text">${saleConfig.badgeText}</span>
      </div>
    `;
  }

  // Generate enhanced price display with simulated compare price
  generatePriceDisplay(product) {
    const productNode = product.node || product;
    const saleConfig = this.getSaleConfig(product);
    
    const currentPrice = parseFloat(productNode.priceRange?.minVariantPrice?.amount || 0);
    const currencyCode = productNode.priceRange?.minVariantPrice?.currencyCode || 'USD';

    if (!saleConfig || currentPrice <= 0) {
      // No sale tag - show regular price
      return `
        <div class="price-display">
          <span class="current-price">${this.formatPrice(currentPrice, currencyCode)}</span>
        </div>
      `;
    }

    // Calculate simulated original price
    const originalPrice = this.calculateOriginalPrice(currentPrice, saleConfig.discountPercent);
    const savings = originalPrice - currentPrice;
    const savingsPercent = ((savings / originalPrice) * 100);

    return `
      <div class="price-display with-sale">
        <span class="original-price">${this.formatPrice(originalPrice, currencyCode)}</span>
        <span class="sale-price">${this.formatPrice(currentPrice, currencyCode)}</span>
        <span class="savings-amount">Save ${this.formatPrice(savings, currencyCode)} (${Math.round(savingsPercent)}%)</span>
      </div>
    `;
  }

  // Apply sale styling to existing product cards
  applyToProductCards() {
    const productCards = document.querySelectorAll('.product-card, .product-item');
    let updatedCount = 0;

    productCards.forEach(card => {
      try {
        // Get product data from card
        const productDataAttr = card.dataset.product;
        if (!productDataAttr) return;

        const productData = JSON.parse(productDataAttr);
        const saleConfig = this.getSaleConfig({ node: productData });

        if (saleConfig) {
          // Add sale badge if not already present
          if (!card.querySelector('.sale-badge')) {
            const badge = document.createElement('div');
            badge.innerHTML = this.generateDiscountBadge(saleConfig);
            card.appendChild(badge.firstElementChild);
          }

          // Update price display
          const priceElement = card.querySelector('.price, .product-price, .price-display');
          if (priceElement) {
            priceElement.innerHTML = this.generatePriceDisplay({ node: productData });
            priceElement.classList.add('has-sale');
          }

          // Add sale class to card
          card.classList.add('on-sale');
          updatedCount++;
        }
      } catch (error) {
        console.warn('Error applying sale styling to product card:', error);
      }
    });

    console.log(`✅ Applied sale styling to ${updatedCount} product cards`);
    return updatedCount;
  }

  // Process products array and add sale information
  processProducts(products) {
    if (!Array.isArray(products)) return products;

    return products.map(product => {
      const saleConfig = this.getSaleConfig(product);
      
      return {
        ...product,
        saleInfo: {
          isOnSale: !!saleConfig,
          saleConfig: saleConfig,
          priceDisplay: this.generatePriceDisplay(product),
          discountBadge: this.generateDiscountBadge(saleConfig)
        }
      };
    });
  }

  // Initialize and apply to page
  initialize() {
    console.log('🏷️ Initializing tag-based discount display...');
    
    // Apply to existing product cards
    this.applyToProductCards();

    // Set up observer for dynamically added products
    this.setupProductObserver();

    console.log('✅ Tag-based discount display initialized');
  }

  // Set up mutation observer for dynamically added products
  setupProductObserver() {
    const observer = new MutationObserver((mutations) => {
      let hasNewProducts = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains('product-card') || 
                node.classList?.contains('product-item') ||
                node.querySelector?.('.product-card, .product-item')) {
              hasNewProducts = true;
            }
          }
        });
      });

      if (hasNewProducts) {
        setTimeout(() => this.applyToProductCards(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Create global instance
window.tagBasedDiscountDisplay = new TagBasedDiscountDisplay();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.tagBasedDiscountDisplay.initialize();
  });
} else {
  window.tagBasedDiscountDisplay.initialize();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TagBasedDiscountDisplay;
}