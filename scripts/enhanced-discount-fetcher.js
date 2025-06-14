// Enhanced Discount Fetcher
// Uses the improved get-discounts Netlify function to fetch and apply active discounts

class EnhancedDiscountFetcher {
  constructor() {
    this.discountCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.activeDiscounts = [];
  }

  // Fetch all active discounts
  async fetchActiveDiscounts() {
    const cacheKey = 'all-discounts';
    const cached = this.discountCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      console.log('📦 Using cached discount data');
      return cached.data;
    }

    try {
      console.log('🔄 Fetching active discounts from API...');
      
      const response = await fetch('/.netlify/functions/get-discounts', {
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
        console.error('❌ Discount API error:', data.error);
        return { discounts: [], meta: {} };
      }

      // Cache the result
      this.discountCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      this.activeDiscounts = data.discounts || [];
      console.log(`✅ Loaded ${this.activeDiscounts.length} active discounts`);
      
      return data;

    } catch (error) {
      console.error('❌ Failed to fetch discounts:', error);
      return { discounts: [], meta: {} };
    }
  }

  // Fetch discounts for a specific product handle
  async fetchProductDiscounts(handle) {
    if (!handle) {
      console.warn('⚠️ No product handle provided');
      return { discounts: [], product: null };
    }

    const cacheKey = `product-${handle}`;
    const cached = this.discountCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      console.log(`📦 Using cached discount data for ${handle}`);
      return cached.data;
    }

    try {
      console.log(`🔄 Fetching discounts for product: ${handle}`);
      
      const response = await fetch(`/.netlify/functions/get-discounts?handle=${encodeURIComponent(handle)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`⚠️ Product not found: ${handle}`);
          return { discounts: [], product: null };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Product discount API error:', data.error);
        return { discounts: [], product: null };
      }

      // Cache the result
      this.discountCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      console.log(`✅ Found ${data.discounts?.length || 0} discounts for ${handle}`);
      
      return data;

    } catch (error) {
      console.error(`❌ Failed to fetch discounts for ${handle}:`, error);
      return { discounts: [], product: null };
    }
  }

  // Calculate discount amount for a price
  calculateDiscountAmount(price, discount) {
    const priceNum = parseFloat(price);
    
    if (discount.value_type === 'percentage') {
      // For percentage discounts, value is negative (e.g., "-12.0")
      const percentage = Math.abs(parseFloat(discount.value));
      return (priceNum * percentage) / 100;
    } else if (discount.value_type === 'fixed_amount') {
      // For fixed amount discounts
      return Math.min(Math.abs(parseFloat(discount.value)), priceNum);
    }
    
    return 0;
  }

  // Apply discount to a price
  applyDiscount(price, discount) {
    const priceNum = parseFloat(price);
    const discountAmount = this.calculateDiscountAmount(price, discount);
    
    return {
      originalPrice: priceNum,
      discountAmount: discountAmount,
      discountedPrice: Math.max(0, priceNum - discountAmount),
      discountPercentage: priceNum > 0 ? (discountAmount / priceNum) * 100 : 0,
      discount: discount
    };
  }

  // Find the best discount for a price
  findBestDiscount(price, discounts) {
    if (!discounts || discounts.length === 0) {
      return null;
    }

    let bestDiscount = null;
    let maxSavings = 0;

    for (const discount of discounts) {
      const savings = this.calculateDiscountAmount(price, discount);
      if (savings > maxSavings) {
        maxSavings = savings;
        bestDiscount = discount;
      }
    }

    return bestDiscount ? this.applyDiscount(price, bestDiscount) : null;
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
    if (!discountInfo || !discountInfo.discount) {
      return '';
    }

    const discount = discountInfo.discount;
    const percentage = Math.round(discountInfo.discountPercentage);
    
    return `
      <div class="discount-badge active-discount" data-discount-id="${discount.id}">
        <span class="discount-percentage">-${percentage}%</span>
        <span class="discount-title">${discount.title}</span>
      </div>
    `;
  }

  // Generate enhanced price display
  generatePriceDisplay(discountInfo, currencyCode = 'USD') {
    if (!discountInfo) {
      return '';
    }

    if (!discountInfo.discount) {
      // No discount - show regular price
      return `
        <div class="price-display">
          <span class="current-price">${this.formatPrice(discountInfo.originalPrice, currencyCode)}</span>
        </div>
      `;
    }

    // Has discount - show original and discounted prices
    return `
      <div class="price-display with-discount">
        <span class="original-price">${this.formatPrice(discountInfo.originalPrice, currencyCode)}</span>
        <span class="discounted-price">${this.formatPrice(discountInfo.discountedPrice, currencyCode)}</span>
        <span class="savings-amount">Save ${this.formatPrice(discountInfo.discountAmount, currencyCode)} (${Math.round(discountInfo.discountPercentage)}%)</span>
      </div>
    `;
  }

  // Apply discounts to product cards on the page
  async applyDiscountsToPage() {
    try {
      // First, fetch all active discounts
      const discountData = await this.fetchActiveDiscounts();
      
      if (!discountData.discounts || discountData.discounts.length === 0) {
        console.log('ℹ️ No active discounts found');
        return;
      }

      // Find all product cards
      const productCards = document.querySelectorAll('.product-card, .product-item');
      let updatedCount = 0;

      for (const card of productCards) {
        try {
          // Get product data from card
          const productDataAttr = card.dataset.product;
          if (!productDataAttr) continue;

          const productData = JSON.parse(productDataAttr);
          const price = productData.priceRange?.minVariantPrice?.amount || productData.price || 0;
          const currencyCode = productData.priceRange?.minVariantPrice?.currencyCode || 'USD';

          // Find best discount for this product
          const bestDiscount = this.findBestDiscount(price, discountData.discounts);

          if (bestDiscount) {
            // Add discount badge
            const existingBadge = card.querySelector('.discount-badge');
            if (!existingBadge) {
              const badge = document.createElement('div');
              badge.innerHTML = this.generateDiscountBadge(bestDiscount);
              card.appendChild(badge.firstElementChild);
            }

            // Update price display
            const priceElement = card.querySelector('.price, .product-price, .price-display');
            if (priceElement) {
              priceElement.innerHTML = this.generatePriceDisplay(bestDiscount, currencyCode);
              priceElement.classList.add('has-discount');
            }

            // Add discount class to card
            card.classList.add('has-active-discount');
            updatedCount++;
          }
        } catch (error) {
          console.warn('⚠️ Error applying discount to product card:', error);
        }
      }

      console.log(`✅ Applied discounts to ${updatedCount} product cards`);
      return updatedCount;

    } catch (error) {
      console.error('❌ Error applying discounts to page:', error);
      return 0;
    }
  }

  // Initialize the discount system
  async initialize() {
    console.log('🚀 Initializing enhanced discount fetcher...');
    
    try {
      // Apply discounts to current page
      await this.applyDiscountsToPage();
      
      // Set up periodic refresh
      setInterval(() => {
        this.applyDiscountsToPage();
      }, this.cacheExpiry);
      
      console.log('✅ Enhanced discount fetcher initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize discount fetcher:', error);
    }
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.discountCache.clear();
    console.log('🗑️ Discount cache cleared');
  }

  // Get cache status
  getCacheStatus() {
    const cacheEntries = Array.from(this.discountCache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      expired: (Date.now() - value.timestamp) > this.cacheExpiry
    }));
    
    return {
      entries: cacheEntries.length,
      details: cacheEntries
    };
  }
}

// Create global instance
window.enhancedDiscountFetcher = new EnhancedDiscountFetcher();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.enhancedDiscountFetcher.initialize();
  });
} else {
  window.enhancedDiscountFetcher.initialize();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedDiscountFetcher;
}