/**
 * Image URL Include All - Ensures all color-specific images from the API response are displayed
 * This handles special cases like "unisex-premium-hoodie-vintage-black-back-683f9023ad2c6"
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for product detail manager to be initialized
  document.addEventListener('productDetailInitialized', function() {
    if (!window.productDetailManager) return;
    
    // Original selectColor method
    const originalSelectColor = window.productDetailManager.selectColor;
    
    // Override with enhanced version
    window.productDetailManager.selectColor = function(color) {
      console.log(`Enhanced image loading: Selecting color ${color}`);
      
      if (!color) {
        console.warn('No color provided to selectColor');
        return;
      }
      
      // Store the color
      this.selectedVariant.color = color;
      
      // Update UI
      document.querySelectorAll('.color-option').forEach(option => {
        if (option.dataset.color && 
            option.dataset.color.toLowerCase() === color.toLowerCase()) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });
      
      // Get all images
      const allProductImages = this.currentProduct?.images || [];
      console.log(`Total product images: ${allProductImages.length}`);
      
      // Get color name in different formats (for matching)
      const colorLower = color.toLowerCase();
      const colorNoDash = colorLower.replace(/-/g, ' ');
      const colorNoSpace = colorLower.replace(/\s+/g, '');
      const colorDashed = colorLower.replace(/\s+/g, '-');
      
      // Special handling for multi-word colors
      const isMultiWordColor = color.includes(' ');
      const colorParts = isMultiWordColor ? colorLower.split(/\s+/) : [colorLower];
      
      // DEBUG: Log all original product images to see what's actually coming from API
      console.log('DEBUG: All images in API response:');
      allProductImages.forEach((img, i) => {
        console.log(`Image ${i}: ${img}`);
      });
      
      // Look for all images that match this color
      const matchingImages = allProductImages.filter(imgUrl => {
        const imgLower = imgUrl.toLowerCase();
        
        // For problem colors like vintage black and charcoal gray/heather, 
        // we include all product images to ensure nothing is missed
        if (colorLower.includes('vintage black') || 
            colorLower.includes('charcoal gray') || 
            colorLower.includes('charcoal grey') ||
            colorLower.includes('charcoal heather')) {
          return true;
        }
        
        // Try to match using various color format variations
        if (imgLower.includes(colorLower) || 
            imgLower.includes(colorNoDash) || 
            imgLower.includes(colorNoSpace) ||
            imgLower.includes(colorDashed)) {
          return true;
        }
        
        // Check if all parts of multi-word color are in the URL
        if (isMultiWordColor && colorParts.every(part => imgLower.includes(part))) {
          return true;
        }
        
        // Standard pattern matching
        if (imgLower.includes(`/${colorLower}`) ||
            imgLower.includes(`_${colorLower}`) ||
            imgLower.includes(`-${colorLower}`) ||
            imgLower.includes(`${colorLower}_`) ||
            imgLower.includes(`${colorLower}-`)) {
          return true;
        }
        
        return false;
      });
      
      console.log(`Matching images for color ${color}: ${matchingImages.length}`);
      
      // If we found matching images, use them
      if (matchingImages.length > 0) {
        this.filteredImages = matchingImages;
      } 
      // Otherwise, fallback to all product images
      else {
        console.log(`No matching images found for ${color}, using all images`);
        this.filteredImages = [...allProductImages];
      }
      
      // Reset to first image and update the display
      this.currentImageIndex = 0;
      this.updateMainImage();
      this.updateThumbnailGrid();
    };
    
    console.log('Enhanced color image selection installed');
  });
});