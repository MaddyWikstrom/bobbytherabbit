// DISABLED - Simple 12% Off Display
// This script has been disabled to prevent unwanted discounts on all products

class Simple12PercentOff {
  constructor() {
    this.discountPercent = 0; // DISABLED
    this.saleTitle = "DISABLED";
    console.log('🚫 Simple 12% Off Display DISABLED - use PreciseDiscountSystem instead');
  }

  // Calculate original price from current price (current = original * 0.88)
  calculateOriginalPrice(currentPrice) {
    return currentPrice / 0.88; // 12% off means current is 88% of original
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

  // Generate discount badge
  generateDiscountBadge() {
    return `
      <div class="sale-badge-12">
        <span class="sale-percentage">-12%</span>
        <span class="sale-title">${this.saleTitle}</span>
      </div>
    `;
  }

  // Generate price display with 12% off
  generatePriceDisplay(currentPrice) {
    const current = parseFloat(currentPrice);
    const original = this.calculateOriginalPrice(current);
    const savings = original - current;

    return `
      <div class="price-display-12 with-sale">
        <span class="original-price-12">${this.formatPrice(original)}</span>
        <span class="sale-price-12">${this.formatPrice(current)}</span>
        <span class="savings-amount-12">Save ${this.formatPrice(savings)} (12%)</span>
      </div>
    `;
  }

  // Apply 12% off styling to all product cards
  applyToAllProducts() {
    console.log('🔥 Applying 12% off to ALL products...');
    
    const productCards = document.querySelectorAll('.product-card, .product-item, .product');
    let updatedCount = 0;

    productCards.forEach(card => {
      try {
        // Add sale badge if not already present
        if (!card.querySelector('.sale-badge-12')) {
          const badge = document.createElement('div');
          badge.innerHTML = this.generateDiscountBadge();
          card.style.position = 'relative';
          card.appendChild(badge.firstElementChild);
        }

        // Find price elements and update them
        const priceSelectors = [
          '.price',
          '.product-price', 
          '.price-display',
          '[class*="price"]',
          '.cost',
          '.amount'
        ];

        let priceElement = null;
        let currentPrice = null;

        // Try to find price element and extract price
        for (const selector of priceSelectors) {
          const element = card.querySelector(selector);
          if (element) {
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
          priceElement.innerHTML = this.generatePriceDisplay(currentPrice);
          priceElement.classList.add('has-sale-12');
          card.classList.add('on-sale-12');
          updatedCount++;
        } else {
          // Fallback: try to find any element with $ and a number
          const allElements = card.querySelectorAll('*');
          for (const element of allElements) {
            const text = element.textContent || '';
            const priceMatch = text.match(/\$(\d+\.?\d*)/);
            
            if (priceMatch && parseFloat(priceMatch[1]) > 0 && !element.querySelector('*')) {
              const price = parseFloat(priceMatch[1]);
              element.innerHTML = this.generatePriceDisplay(price);
              element.classList.add('has-sale-12');
              card.classList.add('on-sale-12');
              updatedCount++;
              break;
            }
          }
        }

      } catch (error) {
        console.warn('Error applying 12% off to product card:', error);
      }
    });

    console.log(`✅ Applied 12% off styling to ${updatedCount} products`);
    return updatedCount;
  }

  // Apply to specific price elements by selector
  applyToPriceElements(selector = '.price, .product-price') {
    console.log(`🎯 Applying 12% off to elements: ${selector}`);
    
    const priceElements = document.querySelectorAll(selector);
    let updatedCount = 0;

    priceElements.forEach(element => {
      try {
        const priceText = element.textContent || element.innerText || '';
        const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
        
        if (priceMatch && parseFloat(priceMatch[1]) > 0) {
          const currentPrice = parseFloat(priceMatch[1]);
          element.innerHTML = this.generatePriceDisplay(currentPrice);
          element.classList.add('has-sale-12');
          
          // Add badge to parent if it's a product card
          const parentCard = element.closest('.product-card, .product-item, .product');
          if (parentCard && !parentCard.querySelector('.sale-badge-12')) {
            const badge = document.createElement('div');
            badge.innerHTML = this.generateDiscountBadge();
            parentCard.style.position = 'relative';
            parentCard.appendChild(badge.firstElementChild);
            parentCard.classList.add('on-sale-12');
          }
          
          updatedCount++;
        }
      } catch (error) {
        console.warn('Error applying 12% off to price element:', error);
      }
    });

    console.log(`✅ Applied 12% off to ${updatedCount} price elements`);
    return updatedCount;
  }

  // Initialize and apply to page
  initialize() {
    console.log('🚀 Initializing Simple 12% Off Display...');
    
    // Apply to all products immediately
    this.applyToAllProducts();
    
    // Set up observer for dynamically added content
    this.setupObserver();
    
    // Reapply every few seconds to catch any new content
    setInterval(() => {
      this.applyToAllProducts();
    }, 3000);
    
    console.log('✅ Simple 12% Off Display initialized');
  }

  // Set up mutation observer for new content
  setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let hasNewContent = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains('product-card') || 
                node.classList?.contains('product-item') ||
                node.querySelector?.('.product-card, .product-item, .price, .product-price')) {
              hasNewContent = true;
            }
          }
        });
      });

      if (hasNewContent) {
        setTimeout(() => this.applyToAllProducts(), 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Manual trigger for testing
  forceUpdate() {
    console.log('🔄 Force updating all products with 12% off...');
    return this.applyToAllProducts();
  }
}

// Create global instance
window.simple12PercentOff = new Simple12PercentOff();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.simple12PercentOff.initialize();
  });
} else {
  window.simple12PercentOff.initialize();
}

// Also initialize after a short delay to catch any late-loading content
setTimeout(() => {
  window.simple12PercentOff.initialize();
}, 1000);

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Simple12PercentOff;
}