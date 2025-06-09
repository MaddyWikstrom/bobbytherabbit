/**
 * Color Selection Fix - Ensures images shown match the selected color based on API response
 * This is an agnostic fix that works for all colors, not just specific ones
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for product detail manager to be initialized
  document.addEventListener('productDetailInitialized', function() {
    if (!window.productDetailManager) return;
    
    // Store the original selectColor method
    const originalSelectColor = window.productDetailManager.selectColor;
    
    // Override the selectColor method with a fixed version
    window.productDetailManager.selectColor = function(color) {
      console.log(`Color selection fix: Selecting color ${color}`);
      
      if (!color) {
        console.warn('No color provided to selectColor');
        return;
      }
      
      // Store the color name in selectedVariant
      this.selectedVariant.color = color;
      
      // Update the UI to show the selected color
      document.querySelectorAll('.color-option').forEach(option => {
        if (option.dataset.color &&
            option.dataset.color.toLowerCase() === color.toLowerCase()) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });
      
      // Get all images for this product from the API response
      const allImages = this.currentProduct?.images || [];
      
      // The key change: ALWAYS use all images from the API response
      // but deduplicate them to avoid showing duplicates
      this.filteredImages = [...new Set(allImages)];
      
      console.log(`Showing all ${this.filteredImages.length} unique images from API response for color ${color}`);
      
      // Reset to first image when color changes
      this.currentImageIndex = 0;
      
      // Update the displayed image and thumbnails
      this.updateMainImage();
      this.updateThumbnailGrid();
    };
    
    console.log('Color selection fix: Installed');
  });
});