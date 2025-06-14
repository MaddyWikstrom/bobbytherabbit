// Subtle Hoodie Sale Display - Only for Hoodies, Sweatshirts, and Sweatpants
// Optimized for performance with minimal logging
// Includes product detail pages and cart integration

class SubtleHoodieSale {
  constructor() {
    this.discountPercent = 12;
    this.saleTitle = "12% OFF";
    this.processedProducts = new Set();
    this.processedDetailPages = new Set();
    this.processedCartItems = new Set();
    this.targetCategories = ['hoodie', 'sweatshirt', 'sweatpants', 'joggers'];
    this.priceSelectors = ['.price', '.product-price', '.price-display', '[class*="price"]', 'h1', 'h2', 'h3'];
    this.titleSelectors = ['.product-title', '.product-name', 'h1', 'h2', 'h3', '.product-detail-title'];
    this.cartSelectors = ['.cart-item', '.cart-product', '[class*="cart"]'];
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

  // Apply to product detail pages - fixed approach
  applyToProductDetail() {
    // Check if already processed
    if (this.processedDetailPages.has('detail-page')) return 0;

    // Check if page contains target product keywords in MAIN title only (h1)
    const mainTitle = document.querySelector('h1');
    if (!mainTitle) return 0;
    
    const titleText = mainTitle.textContent || mainTitle.innerText || '';
    console.log('🔍 Checking main product title:', titleText);
    
    if (!this.isTargetProduct(titleText)) {
      console.log('❌ Not a target product:', titleText);
      return 0;
    }

    console.log('✅ Target product confirmed:', titleText);

    let updatedCount = 0;

    // Find price elements more carefully - only main prices, not duplicates
    const priceElements = document.querySelectorAll('.price, [class*="price"]:not(.subtle-price-display):not(.subtle-original-price):not(.subtle-sale-price):not(.subtle-savings)');
    const processedPrices = new Set();

    console.log(`📍 Found ${priceElements.length} price elements to check`);

    for (const element of priceElements) {
      // Skip if already processed or is our generated content
      if (element.classList.contains('subtle-price-display') ||
          element.classList.contains('has-subtle-sale') ||
          element.classList.contains('subtle-original-price') ||
          element.classList.contains('subtle-sale-price') ||
          element.classList.contains('subtle-savings')) {
        continue;
      }

      const text = (element.textContent || '').trim();
      const priceMatch = text.match(/^\$(\d+(?:\.\d{2})?)$/);
      
      if (priceMatch &&
          !element.querySelector('*') && // No child elements
          element.offsetParent !== null && // Visible
          !processedPrices.has(priceMatch[1])) { // Not already processed this price
        
        const currentPrice = parseFloat(priceMatch[1]);
        
        // Only process reasonable prices
        if (currentPrice >= 10 && currentPrice <= 1000) {
          // Add badge to body if not present
          if (!document.querySelector('.subtle-sale-badge')) {
            document.body.style.position = 'relative';
            document.body.insertAdjacentHTML('afterbegin', this.generateSubtleDiscountBadge());
          }

          // Replace the element's content
          element.innerHTML = this.generateSubtlePriceDisplay(currentPrice);
          element.classList.add('has-subtle-sale');
          processedPrices.add(priceMatch[1]);
          updatedCount++;
          
          console.log(`💰 Applied discount to price: $${currentPrice}`);
        }
      }
    }

    if (updatedCount > 0) {
      this.processedDetailPages.add('detail-page');
      console.log(`✅ Applied discounts to ${updatedCount} price elements`);
    }

    return updatedCount;
  }

  // Apply to cart items
  applyToCartItems() {
    const cartItems = document.querySelectorAll(this.cartSelectors.join(', '));
    let updatedCount = 0;

    for (const cartItem of cartItems) {
      const cartId = this.getCartItemId(cartItem);
      if (this.processedCartItems.has(cartId)) continue;

      const titleElement = cartItem.querySelector(this.titleSelectors.join(', '));
      if (!titleElement) continue;

      const productTitle = titleElement.textContent || titleElement.innerText || '';
      if (!this.isTargetProduct(productTitle)) continue;

      const priceElements = cartItem.querySelectorAll(this.priceSelectors.join(', '));
      for (const priceElement of priceElements) {
        if (priceElement.classList.contains('subtle-price-display')) continue;
        
        const priceMatch = (priceElement.textContent || '').match(/\$?(\d+\.?\d*)/);
        if (priceMatch && parseFloat(priceMatch[1]) > 0) {
          const currentPrice = parseFloat(priceMatch[1]);
          
          // For cart items, show more compact pricing
          const original = parseFloat(currentPrice);
          const discounted = this.calculateDiscountedPrice(original);
          
          priceElement.innerHTML = `<span class="cart-original-price">${this.formatPrice(original)}</span><span class="cart-sale-price">${this.formatPrice(discounted)}</span>`;
          priceElement.classList.add('has-cart-sale');
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        this.processedCartItems.add(cartId);
      }
    }

    return updatedCount;
  }

  // Get unique ID for detail page
  getDetailPageId(container) {
    const titleElement = container.querySelector(this.titleSelectors.join(', '));
    const title = titleElement ? titleElement.textContent.trim() : '';
    return `detail-${title}`.replace(/\s+/g, '-');
  }

  // Get unique ID for cart item
  getCartItemId(cartItem) {
    const titleElement = cartItem.querySelector(this.titleSelectors.join(', '));
    const priceElement = cartItem.querySelector(this.priceSelectors.join(', '));
    
    const title = titleElement ? titleElement.textContent.trim() : '';
    const price = priceElement ? priceElement.textContent.trim() : '';
    
    return `cart-${title}-${price}`.replace(/\s+/g, '-');
  }

  // Initialize with optimized observer
  initialize() {
    // Clear any previous processing to prevent duplicates
    this.clearCache();
    
    this.applyToTargetProducts();
    this.applyToProductDetail();
    this.applyToCartItems();
    this.setupDebouncedObserver();
  }

  // Optimized debounced observer
  setupDebouncedObserver() {
    let timeout = null;
    
    const observer = new MutationObserver((mutations) => {
      let hasNewContent = false;
      
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && (
            node.classList?.contains('product-card') ||
            node.classList?.contains('product-item') ||
            node.classList?.contains('cart-item') ||
            node.classList?.contains('product-detail') ||
            node.querySelector?.('.product-card, .product-item, .cart-item, .product-detail')
          )) {
            hasNewContent = true;
            break;
          }
        }
        if (hasNewContent) break;
      }

      if (hasNewContent) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.applyToTargetProducts();
          this.applyToProductDetail();
          this.applyToCartItems();
        }, 1000);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Testing methods (minimal logging)
  forceUpdate() {
    const productCount = this.applyToTargetProducts();
    const detailCount = this.applyToProductDetail();
    const cartCount = this.applyToCartItems();
    return productCount + detailCount + cartCount;
  }

  clearCache() {
    this.processedProducts.clear();
    this.processedDetailPages.clear();
    this.processedCartItems.clear();
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

// Also try to apply after a delay to catch dynamically loaded content
setTimeout(() => {
  if (window.subtleHoodieSale) {
    window.subtleHoodieSale.forceUpdate();
  }
}, 2000);

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SubtleHoodieSale;
}