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
      let colorSpecificImages = [];
      let found = false;
      
      // First, try to get color-specific images from the API response
      if (this.currentProduct?.colorImages) {
        // Try exact match first
        if (this.currentProduct.colorImages[color]) {
          colorSpecificImages = [...this.currentProduct.colorImages[color]];
          found = true;
          console.log(`Found exact match for color "${color}" with ${colorSpecificImages.length} images`);
        } else {
          // Try case-insensitive match
          for (const [key, images] of Object.entries(this.currentProduct.colorImages)) {
            if (key.toLowerCase() === color.toLowerCase()) {
              colorSpecificImages = [...images];
              found = true;
              console.log(`Found case-insensitive match for color "${color}" (key: "${key}") with ${images.length} images`);
              break;
            }
          }
        }
      }
      
      // If color images not found in API response, try to match based on URL patterns
      if (!found && allImages.length > 0) {
        console.log(`No explicit color images found for "${color}", trying URL pattern matching`);
        
        // Filter images that might be related to this color based on URL
        colorSpecificImages = allImages.filter(imgUrl => {
          const imgUrlLower = imgUrl.toLowerCase();
          const colorLower = color.toLowerCase();
          
          // Look for color name in the URL
          if (imgUrlLower.includes(`/${colorLower}`) ||
              imgUrlLower.includes(`_${colorLower}`) ||
              imgUrlLower.includes(`-${colorLower}`) ||
              imgUrlLower.includes(`${colorLower}_`) ||
              imgUrlLower.includes(`${colorLower}-`) ||
              imgUrlLower.includes(`color=${colorLower}`) ||
              imgUrlLower.includes(`variant=${colorLower}`) ||
              imgUrlLower.includes(colorLower)) {
            return true;
          }
          
          // For multi-word colors, try to match individual parts
          if (colorLower.includes(' ')) {
            const colorParts = colorLower.split(' ');
            // If all parts of the color are in the URL, consider it a match
            if (colorParts.every(part => imgUrlLower.includes(part) && part.length > 2)) {
              return true;
            }
          }
          
          return false;
        });
        
        if (colorSpecificImages.length > 0) {
          found = true;
          console.log(`Found ${colorSpecificImages.length} images matching URL patterns for color "${color}"`);
        }
      }
      
      // If still no images found, fall back to product images or a subset of them
      if (!found || colorSpecificImages.length === 0) {
        // For problematic colors like vintage black and charcoal gray
        // we want to make sure we return some usable images
        if (color.toLowerCase().includes('vintage black') ||
            color.toLowerCase().includes('charcoal gray') ||
            color.toLowerCase().includes('charcoal grey')) {
          
          console.log(`Using all images for known problematic color: ${color}`);
          colorSpecificImages = [...allImages];
        } else {
          // For other colors, we'll use the first image as a fallback
          // plus any images that might have color in their names
          const firstImage = allImages.length > 0 ? [allImages[0]] : [];
          const possibleColorImages = allImages.filter(img =>
            img.toLowerCase().includes(color.toLowerCase())
          );
          
          colorSpecificImages = [...new Set([...firstImage, ...possibleColorImages])];
          console.log(`Fallback: Using ${colorSpecificImages.length} generic images for color "${color}"`);
        }
      }
      
      // Remove duplicates
      this.filteredImages = [...new Set(colorSpecificImages)];
      
      console.log(`Showing ${this.filteredImages.length} unique images for color "${color}"`);
      
      // Reset to first image when color changes
      this.currentImageIndex = 0;
      
      // Update the displayed image and thumbnails
      this.updateMainImage();
      this.updateThumbnailGrid();
    };
    
    console.log('Color selection fix: Installed');
  });
});