// Clear Duplicate Pricing - Run this once to clean up the page
function clearDuplicatePricing() {
  // Remove all existing sale badges
  const existingBadges = document.querySelectorAll('.subtle-sale-badge');
  existingBadges.forEach(badge => badge.remove());

  // Remove all existing sale pricing displays
  const existingSalePricing = document.querySelectorAll('.subtle-price-display, .has-subtle-sale');
  existingSalePricing.forEach(element => {
    // Try to restore original price if we can find it
    const originalPrice = element.querySelector('.subtle-original-price');
    if (originalPrice) {
      element.innerHTML = originalPrice.textContent;
      element.classList.remove('has-subtle-sale');
    }
  });

  // Clear the processed cache
  if (window.subtleHoodieSale) {
    window.subtleHoodieSale.clearCache();
  }

  console.log('Cleared duplicate pricing - page should be clean now');
}

// Auto-run to clean up
clearDuplicatePricing();

// Make available globally for manual use
window.clearDuplicatePricing = clearDuplicatePricing;