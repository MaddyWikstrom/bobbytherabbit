// scripts/discount-calculator.js
// Advanced discount calculation and display system

class DiscountCalculator {
  constructor() {
    this.activeDiscounts = [];
    this.discountCache = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastFetch = 0;
  }

  // Fetch active discounts from Admin API
  async fetchActiveDiscounts() {
    const now = Date.now();
    
    // Use cache if still valid
    if (this.discountCache && (now - this.lastFetch) < this.cacheExpiry) {
      console.log('Using cached discount data');
      return this.discountCache;
    }

    try {
      console.log('Fetching active discounts from Admin API...');
      
      const response = await fetch('/.netlify/functions/get-active-discounts', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('Discount API error:', data.error);
        return { discounts: [] };
      }

      this.activeDiscounts = data.discounts || [];
      this.discountCache = data;
      this.lastFetch = now;
      
      console.log(`Loaded ${this.activeDiscounts.length} active discounts`);
      return data;

    } catch (error) {
      console.error('Failed to fetch discounts:', error);
      // Return empty discounts on error
      return { discounts: [] };
    }
  }

  // Check if a product is eligible for a specific discount
  isProductEligible(product, discount) {
    // If no specific targeting, discount applies to all products
    if (discount.target_selection === 'all' && 
        (!discount.entitled_product_ids || discount.entitled_product_ids.length === 0) &&
        (!discount.entitled_collection_ids || discount.entitled_collection_ids.length === 0)) {
      return true;
    }

    // Check if product ID is in entitled products
    if (discount.entitled_product_ids && discount.entitled_product_ids.length > 0) {
      const productId = this.extractShopifyId(product.id);
      return discount.entitled_product_ids.some(id => 
        this.extractShopifyId(id) === productId
      );
    }

    // Check if any product variants are in entitled variants
    if (discount.entitled_variant_ids && discount.entitled_variant_ids.length > 0) {
      const productVariants = product.variants?.edges || [];
      return productVariants.some(variant => {
        const variantId = this.extractShopifyId(variant.node.id);
        return discount.entitled_variant_ids.some(id => 
          this.extractShopifyId(id) === variantId
        );
      });
    }

    // For collection-based discounts, we'd need collection data
    // This would require additional API calls or product metadata
    
    return false;
  }

  // Extract numeric ID from Shopify GID
  extractShopifyId(gid) {
    if (typeof gid === 'string' && gid.includes('gid://')) {
      return gid.split('/').pop();
    }
    return gid;
  }

  // Calculate the best applicable discount for a product
  calculateBestDiscount(product, price) {
    if (!this.activeDiscounts || this.activeDiscounts.length === 0) {
      return {
        originalPrice: price,
        discountedPrice: price,
        discount: null,
        savings: 0,
        savingsPercentage: 0
      };
    }

    let bestDiscount = null;
    let bestDiscountedPrice = price;
    let maxSavings = 0;

    for (const discount of this.activeDiscounts) {
      if (!this.isProductEligible(product, discount)) {
        continue;
      }

      let discountedPrice = price;
      let savings = 0;

      if (discount.value_type === 'percentage') {
        const discountAmount = (parseFloat(price) * parseFloat(discount.value)) / 100;
        discountedPrice = parseFloat(price) - discountAmount;
        savings = discountAmount;
      } else if (discount.value_type === 'fixed_amount') {
        savings = Math.min(parseFloat(discount.value), parseFloat(price));
        discountedPrice = parseFloat(price) - savings;
      }

      // Keep the discount that provides the most savings
      if (savings > maxSavings) {
        maxSavings = savings;
        bestDiscountedPrice = discountedPrice;
        bestDiscount = discount;
      }
    }

    const savingsPercentage = price > 0 ? (maxSavings / price) * 100 : 0;

    return {
      originalPrice: parseFloat(price),
      discountedPrice: Math.max(0, bestDiscountedPrice),
      discount: bestDiscount,
      savings: maxSavings,
      savingsPercentage: savingsPercentage
    };
  }

  // Apply discounts to product display
  async applyDiscountsToProducts(products) {
    await this.fetchActiveDiscounts();

    return products.map(product => {
      const productNode = product.node || product;
      const minPrice = productNode.priceRange?.minVariantPrice?.amount || 0;
      const maxPrice = productNode.priceRange?.maxVariantPrice?.amount || 0;

      const minPriceCalc = this.calculateBestDiscount(productNode, minPrice);
      const maxPriceCalc = this.calculateBestDiscount(productNode, maxPrice);

      // Enhanced product with discount information
      return {
        ...product,
        discountInfo: {
          hasDiscount: minPriceCalc.discount !== null || maxPriceCalc.discount !== null,
          minPrice: minPriceCalc,
          maxPrice: maxPriceCalc,
          bestDiscount: minPriceCalc.discount || maxPriceCalc.discount
        }
      };
    });
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
  generateDiscountBadge(discountInfo) {
    if (!discountInfo.hasDiscount || !discountInfo.bestDiscount) {
      return '';
    }

    const discount = discountInfo.bestDiscount;
    let badgeText = '';

    if (discount.value_type === 'percentage') {
      badgeText = `-${Math.round(discount.value)}%`;
    } else {
      badgeText = `-$${discount.value}`;
    }

    return `
      <div class="discount-badge" data-discount-id="${discount.id}">
        <span class="discount-value">${badgeText}</span>
        <span class="discount-title">${discount.title}</span>
      </div>
    `;
  }

  // Generate price display HTML with discount
  generatePriceDisplay(product, discountInfo) {
    const productNode = product.node || product;
    const currencyCode = productNode.priceRange?.minVariantPrice?.currencyCode || 'USD';
    
    if (!discountInfo.hasDiscount) {
      // No discount - show regular price
      const price = productNode.priceRange?.minVariantPrice?.amount || 0;
      return `
        <div class="price-display">
          <span class="current-price">${this.formatPrice(price, currencyCode)}</span>
        </div>
      `;
    }

    // Has discount - show original and discounted prices
    const originalPrice = discountInfo.minPrice.originalPrice;
    const discountedPrice = discountInfo.minPrice.discountedPrice;
    const savings = discountInfo.minPrice.savings;
    const savingsPercentage = discountInfo.minPrice.savingsPercentage;

    return `
      <div class="price-display with-discount">
        <span class="original-price">${this.formatPrice(originalPrice, currencyCode)}</span>
        <span class="discounted-price">${this.formatPrice(discountedPrice, currencyCode)}</span>
        <span class="savings-amount">Save ${this.formatPrice(savings, currencyCode)} (${Math.round(savingsPercentage)}%)</span>
      </div>
    `;
  }

  // Update product cards with discount information
  async updateProductCards() {
    try {
      await this.fetchActiveDiscounts();
      
      const productCards = document.querySelectorAll('.product-card, .product-item');
      
      for (const card of productCards) {
        const productData = card.dataset.product ? JSON.parse(card.dataset.product) : null;
        
        if (!productData) continue;

        const discountCalc = this.calculateBestDiscount(productData, productData.price || 0);
        
        if (discountCalc.discount) {
          // Add discount badge
          const existingBadge = card.querySelector('.discount-badge');
          if (!existingBadge) {
            const badge = document.createElement('div');
            badge.className = 'discount-badge';
            badge.innerHTML = `
              <span class="discount-value">-${Math.round(discountCalc.savingsPercentage)}%</span>
              <span class="discount-title">${discountCalc.discount.title}</span>
            `;
            card.appendChild(badge);
          }

          // Update price display
          const priceElement = card.querySelector('.price, .product-price');
          if (priceElement) {
            priceElement.innerHTML = `
              <span class="original-price">${this.formatPrice(discountCalc.originalPrice)}</span>
              <span class="discounted-price">${this.formatPrice(discountCalc.discountedPrice)}</span>
            `;
            priceElement.classList.add('has-discount');
          }
        }
      }

      console.log(`Updated ${productCards.length} product cards with discount information`);
      
    } catch (error) {
      console.error('Error updating product cards with discounts:', error);
    }
  }

  // Initialize discount system
  async initialize() {
    console.log('Initializing discount calculator...');
    
    try {
      await this.fetchActiveDiscounts();
      
      // Update existing product displays
      await this.updateProductCards();
      
      // Set up periodic refresh
      setInterval(() => {
        this.updateProductCards();
      }, this.cacheExpiry);
      
      console.log('Discount calculator initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize discount calculator:', error);
    }
  }
}

// Create global instance
window.discountCalculator = new DiscountCalculator();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.discountCalculator.initialize();
  });
} else {
  window.discountCalculator.initialize();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiscountCalculator;
}