// Subtle Hoodie Sale Display - Only for Hoodies, Sweatshirts, and Sweatpants
// Optimized for performance with minimal logging

class SubtleHoodieSale {
  constructor() {
    this.discountPercent = 12;
    this.saleTitle = "12% OFF";
    this.processedProducts = new Set();
    this.targetCategories = ['hoodie', 'sweatshirt', 'sweatpants', 'joggers'];
    this.priceSelectors = ['.price', '.product-price', '.price-display', '[class*="price"]'];
    this.titleSelectors = ['.product-title', '.product-name', 'h3', 'h2'];
  }

  // Optimized target product check
  isTargetProduct(productTitle) {
    if (!productTitle) return false;
    const title = productTitle.toLowerCase();
    return this.targetCategories.some(category => title.includes(category));
  }

  // Calculate discounted price from original price (12% off the API price)
  calculateDiscountedPrice(originalPrice) {
    return originalPrice * 0.88;
  }

  // Cached price formatter
  formatPrice(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Generate subtle discount badge (cached template)
  generateSubtleDiscountBadge() {
    return `<div class="subtle-sale-badge"><span class="subtle-sale-text">${this.saleTitle}</span></div>`;
  }

  // Generate subtle price display with 12% off
  generateSubtlePriceDisplay(originalPrice) {
    const original = parseFloat(originalPrice);
    const discounted = this.calculateDiscountedPrice(original);
    const savings = original - discounted;

    return `<div class="subtle-price-display"><span class="subtle-original-price">${this.formatPrice(original)}</span><span class="subtle-sale-price">${this.formatPrice(discounted)}</span><span class="subtle-savings">Save ${this.formatPrice(savings)}</span></div>`;
  }

  // Optimized product processing
  applyToTargetProducts() {
    const productCards = document.querySelectorAll('.product-card, .product-item, .product');
    let updatedCount = 0;

    for (const card of productCards) {
      const cardId = this.getCardId(card);
      
      if (this.processedProducts.has(cardId)) continue;

      const titleElement = card.querySelector(this.titleSelectors.join(', '));
      if (!titleElement) continue;

      const productTitle = titleElement.textContent || titleElement.innerText || '';
      if (!this.isTargetProduct(productTitle)) continue;

      let priceElement = null;
      let currentPrice = null;

      for (const selector of this.priceSelectors) {
        const element = card.querySelector(selector);
        if (element && !element.classList.contains('subtle-price-display')) {
          const priceMatch = (element.textContent || '').match(/\$?(\d+\.?\d*)/);
          if (priceMatch && parseFloat(priceMatch[1]) > 0) {
            priceElement = element;
            currentPrice = parseFloat(priceMatch[1]);
            break;
          }
        }
      }

      if (priceElement && currentPrice) {
        if (!card.querySelector('.subtle-sale-badge')) {
          card.style.position = 'relative';
          card.insertAdjacentHTML('beforeend', this.generateSubtleDiscountBadge());
        }

        priceElement.innerHTML = this.generateSubtlePriceDisplay(currentPrice);
        priceElement.classList.add('has-subtle-sale');
        card.classList.add('subtle-sale-item');
        
        this.processedProducts.add(cardId);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  // Optimized unique ID generation
  getCardId(card) {
    if (card.dataset.productId) return card.dataset.productId;
    if (card.id) return card.id;
    
    const titleElement = card.querySelector(this.titleSelectors.join(', '));
    const priceElement = card.querySelector(this.priceSelectors.join(', '));
    
    const title = titleElement ? titleElement.textContent.trim() : '';
    const price = priceElement ? priceElement.textContent.trim() : '';
    
    return `${title}-${price}`.replace(/\s+/g, '-');
  }

  // Initialize with optimized observer
  initialize() {
    this.applyToTargetProducts();
    this.setupDebouncedObserver();
  }

  // Optimized debounced observer
  setupDebouncedObserver() {
    let timeout = null;
    
    const observer = new MutationObserver((mutations) => {
      let hasNewProducts = false;
      
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && (
            node.classList?.contains('product-card') ||
            node.classList?.contains('product-item') ||
            node.querySelector?.('.product-card, .product-item')
          )) {
            hasNewProducts = true;
            break;
          }
        }
        if (hasNewProducts) break;
      }

      if (hasNewProducts) {
        clearTimeout(timeout);
        timeout = setTimeout(() => this.applyToTargetProducts(), 1000);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Testing methods (minimal logging)
  forceUpdate() {
    return this.applyToTargetProducts();
  }

  clearCache() {
    this.processedProducts.clear();
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