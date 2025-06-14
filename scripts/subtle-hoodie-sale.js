// Subtle Hoodie Sale Display - Only for Hoodies, Sweatshirts, and Sweatpants
// Prevents constant re-rendering and uses subtle styling

class SubtleHoodieSale {
  constructor() {
    this.discountPercent = 12;
    this.saleTitle = "12% OFF";
    this.processedProducts = new Set(); // Track processed products to prevent re-rendering
    this.targetCategories = ['hoodie', 'sweatshirt', 'sweatpants', 'joggers']; // Only these categories
  }

  // Check if product title indicates it's a hoodie, sweatshirt, or sweatpants
  isTargetProduct(productTitle) {
    if (!productTitle) return false;
    
    const title = productTitle.toLowerCase();
    return this.targetCategories.some(category => 
      title.includes(category) || 
      title.includes('hoodie') || 
      title.includes('sweat') ||
      title.includes('jogger')
    );
  }

  // Calculate discounted price from original price (12% off the API price)
  calculateDiscountedPrice(originalPrice) {
    return originalPrice * 0.88; // 12% off means discounted is 88% of original
  }

  // Format price for display
  formatPrice(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Generate subtle discount badge
  generateSubtleDiscountBadge() {
    return `
      <div class="subtle-sale-badge">
        <span class="subtle-sale-text">${this.saleTitle}</span>
      </div>
    `;
  }

  // Generate subtle price display with 12% off
  generateSubtlePriceDisplay(originalPrice) {
    const original = parseFloat(originalPrice);
    const discounted = this.calculateDiscountedPrice(original);
    const savings = original - discounted;

    return `
      <div class="subtle-price-display">
        <span class="subtle-original-price">${this.formatPrice(original)}</span>
        <span class="subtle-sale-price">${this.formatPrice(discounted)}</span>
        <span class="subtle-savings">Save ${this.formatPrice(savings)}</span>
      </div>
    `;
  }

  // Apply subtle sale styling to target products only
  applyToTargetProducts() {
    console.log('🎯 Applying subtle sale to hoodies, sweatshirts, and sweatpants...');
    
    const productCards = document.querySelectorAll('.product-card, .product-item, .product');
    let updatedCount = 0;

    productCards.forEach(card => {
      try {
        // Create unique identifier for this card
        const cardId = this.getCardId(card);
        
        // Skip if already processed
        if (this.processedProducts.has(cardId)) {
          return;
        }

        // Get product title
        let productTitle = '';
        const titleElement = card.querySelector('.product-title, .product-name, h3, h2');
        if (titleElement) {
          productTitle = titleElement.textContent || titleElement.innerText || '';
        }

        // Check if this is a target product
        if (!this.isTargetProduct(productTitle)) {
          return; // Skip non-target products
        }

        // Find price elements and update them
        const priceSelectors = [
          '.price',
          '.product-price', 
          '.price-display',
          '[class*="price"]'
        ];

        let priceElement = null;
        let currentPrice = null;

        // Try to find price element and extract price
        for (const selector of priceSelectors) {
          const element = card.querySelector(selector);
          if (element && !element.classList.contains('subtle-price-display')) {
            const priceText = element.textContent || element.innerText || '';
            const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
            
            if (priceMatch && parseFloat(priceMatch[1]) > 0) {
              priceElement = element;
              currentPrice = parseFloat(priceMatch[1]);
              break;
            }
          }
        }

        // If we found a price, update the display
        if (priceElement && currentPrice) {
          // Add subtle sale badge if not already present
          if (!card.querySelector('.subtle-sale-badge')) {
            const badge = document.createElement('div');
            badge.innerHTML = this.generateSubtleDiscountBadge();
            card.style.position = 'relative';
            card.appendChild(badge.firstElementChild);
          }

          // Update price display (currentPrice from API is the original, we show 12% off)
          priceElement.innerHTML = this.generateSubtlePriceDisplay(currentPrice);
          priceElement.classList.add('has-subtle-sale');
          card.classList.add('subtle-sale-item');
          
          // Mark as processed
          this.processedProducts.add(cardId);
          updatedCount++;
        }

      } catch (error) {
        console.warn('Error applying subtle sale to product card:', error);
      }
    });

    console.log(`✅ Applied subtle sale to ${updatedCount} target products`);
    return updatedCount;
  }

  // Generate unique ID for a card to prevent re-processing
  getCardId(card) {
    // Try to get a unique identifier
    if (card.dataset.productId) return card.dataset.productId;
    if (card.id) return card.id;
    
    // Fallback: use title + price as identifier
    const titleElement = card.querySelector('.product-title, .product-name, h3, h2');
    const priceElement = card.querySelector('.price, .product-price');
    
    const title = titleElement ? (titleElement.textContent || '').trim() : '';
    const price = priceElement ? (priceElement.textContent || '').trim() : '';
    
    return `${title}-${price}`.replace(/\s+/g, '-');
  }

  // Initialize with single run to prevent constant re-rendering
  initialize() {
    console.log('🚀 Initializing Subtle Hoodie Sale Display...');
    
    // Apply to current products
    this.applyToTargetProducts();
    
    // Set up observer for new content (but with debouncing)
    this.setupDebouncedObserver();
    
    console.log('✅ Subtle Hoodie Sale Display initialized');
  }

  // Set up debounced observer to prevent constant re-rendering
  setupDebouncedObserver() {
    let timeout = null;
    
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
        // Clear existing timeout
        if (timeout) clearTimeout(timeout);
        
        // Set new timeout to debounce the updates
        timeout = setTimeout(() => {
          this.applyToTargetProducts();
        }, 1000); // Wait 1 second before processing
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Manual trigger for testing (won't re-process already processed items)
  forceUpdate() {
    console.log('🔄 Force updating target products...');
    return this.applyToTargetProducts();
  }

  // Clear processed products cache (for testing)
  clearCache() {
    this.processedProducts.clear();
    console.log('🗑️ Cleared processed products cache');
  }
}

// Create global instance
window.subtleHoodieSale = new SubtleHoodieSale();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.subtleHoodieSale.initialize();
  });
} else {
  window.subtleHoodieSale.initialize();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SubtleHoodieSale;
}