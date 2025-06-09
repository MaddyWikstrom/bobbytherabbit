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
      
      // Get color-specific images directly from API response without filtering
      if (this.currentProduct?.colorImages && this.currentProduct.colorImages[color]) {
        // Use the images directly from the API response for this color
        this.filteredImages = [...this.currentProduct.colorImages[color]];
        console.log(`Using ${this.filteredImages.length} images for color ${color} directly from API response`);
      }
      // Try case-insensitive match if direct match fails
      else if (this.currentProduct?.colorImages) {
        let found = false;
        
        // Check for case-insensitive match
        for (const [key, images] of Object.entries(this.currentProduct.colorImages)) {
          if (key.toLowerCase() === color.toLowerCase()) {
            this.filteredImages = [...images];
            found = true;
            console.log(`Found color ${color} using case-insensitive match with ${images.length} images`);
            break;
          }
        }
        
        // If still not found, use all product images
        if (!found) {
          this.filteredImages = [...allImages];
          console.log(`No specific images found for color ${color}, using all ${allImages.length} product images`);
        }
      }
      else {
        // If no color images map exists, use all product images
        this.filteredImages = [...allImages];
        console.log(`No color images map available, using all ${allImages.length} product images`);
      }
      
      // Reset to first image when color changes
      this.currentImageIndex = 0;
      
      // Update the displayed image and thumbnails
      this.updateMainImage();
      this.updateThumbnailGrid();
    };
    
    console.log('Color selection fix: Installed');
  });
});