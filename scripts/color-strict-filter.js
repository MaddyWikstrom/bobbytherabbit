// Color Strict Filter
// This script enhances the image filtering in product-detail.js to ensure
// only images matching the exact selected color are displayed

(function() {
    // Enhanced color image selection installed

    // Function to strictly filter images for a specific color
    function strictColorFiltering(manager, color) {
        try {
            if (!color || !manager.currentProduct) {
                return false; // Can't filter without color or product
            }

            // Get product images
            const allImages = manager.currentProduct.images || [];

            // Create exact matching pattern for the selected color
            const normalizedColor = color.toLowerCase().trim();
            
            // Define more strict rules for pattern matching to avoid "Black" matching "Vintage Black"
            const getExactPatterns = (colorName) => {
                const patterns = [];
                
                // Convert spaces to different separators
                const colorWithDash = colorName.replace(/\s+/g, '-');
                const colorWithUnderscore = colorName.replace(/\s+/g, '_');
                
                // Generate strict boundary patterns
                patterns.push(
                    // Boundaries with slashes and separators
                    `/${colorName}/`,
                    `/${colorWithDash}/`,
                    `/${colorWithUnderscore}/`,
                    // With file extension boundaries
                    `-${colorName}.`,
                    `-${colorWithDash}.`,
                    `-${colorWithUnderscore}.`,
                    // Other common boundaries in image URLs
                    `-${colorName}-`,
                    `-${colorWithDash}-`,
                    `-${colorWithUnderscore}-`
                );
                
                return patterns;
            };
            
            // Get strict patterns for exact matching
            const strictPatterns = getExactPatterns(normalizedColor);
            
            // Special handling for black vs vintage black to ensure they don't mix
            const isBlackVariant = normalizedColor === 'black' || normalizedColor.includes('black');
            let blackExclusionCheck = null;
            
            if (isBlackVariant) {
                // If we're dealing with a variant of black, set up exclusion rules
                if (normalizedColor === 'black') {
                    // For plain "black", exclude images with "vintage-black"
                    blackExclusionCheck = (url) => {
                        const lowerUrl = url.toLowerCase();
                        // Make sure URL is valid and specifically for plain "black", not "vintage black"
                        if (lowerUrl.includes('product.html')) {
                            return false; // Skip invalid URLs that are actually product links
                        }
                        // Match only "black" but not "vintage black"
                        return (lowerUrl.includes('-black') || lowerUrl.includes('_black') || lowerUrl.includes('/black/')) &&
                               !lowerUrl.includes('vintage-black') &&
                               !lowerUrl.includes('vintage_black');
                    };
                } else if (normalizedColor === 'vintage black') {
                    // For "vintage black", only include images specifically with vintage black
                    blackExclusionCheck = (url) => {
                        const lowerUrl = url.toLowerCase();
                        if (lowerUrl.includes('product.html')) {
                            return false; // Skip invalid URLs that are actually product links
                        }
                        return lowerUrl.includes('vintage-black') || lowerUrl.includes('vintage_black');
                    };
                }
            }
            
            // Filter images based on strict color matching
            // Filter out invalid URLs first (e.g., product.html links incorrectly added as images)
            const validImages = allImages.filter(imgUrl => {
                return imgUrl && typeof imgUrl === 'string' && !imgUrl.includes('product.html');
            });
            
            // Then apply color filtering on valid images only
            const strictlyFilteredImages = validImages.filter(imgUrl => {
                const imgUrlLower = imgUrl.toLowerCase();
                
                // Special handling for black variants
                if (blackExclusionCheck && !blackExclusionCheck(imgUrlLower)) {
                    return false;
                }
                
                // Check against strict patterns
                return strictPatterns.some(pattern => imgUrlLower.includes(pattern));
            });
            
            // Limit to a reasonable number to prevent processing too many images
            const maxImages = 8;
            const limitedImages = strictlyFilteredImages.slice(0, maxImages);
            
            // Found matching images for color
            
            if (strictlyFilteredImages.length > 0) {
                // Use strictly filtered images if available, limit to prevent excessive processing
                manager.filteredImages = limitedImages;
                manager.currentImageIndex = 0;
                manager.updateMainImage();
                manager.updateThumbnailGrid();
                return true; // Indicate successful filtering
            }
            
            return false; // Indicate filtering didn't find any images
        } catch (error) {
            console.error('Error in strict color filtering:', error);
            return false;
        }
    }

    // Function to handle both initialization and color selection
    function enhanceProductManager() {
        if (!window.productDetailManager) {
            // Product detail manager not found, will retry
            setTimeout(enhanceProductManager, 100);
            return;
        }

        const manager = window.productDetailManager;
        // Found product detail manager, enhancing color selection

        // Store the original selectColor method
        const originalSelectColor = manager.selectColor;

        // Override the selectColor method with improved filtering
        manager.selectColor = function(color) {
            try {
                if (!color) {
                    // No color provided to selectColor
                    return;
                }

                // Enhanced selectColor called for color

                // Store the color name in selectedVariant
                this.selectedVariant.color = color;

                // Find matching color-option element and update active class
                let found = false;
                document.querySelectorAll('.color-option').forEach(option => {
                    if (option.dataset.color &&
                        option.dataset.color.toLowerCase() === color.toLowerCase()) {
                        option.classList.add('active');
                        found = true;
                    } else {
                        option.classList.remove('active');
                    }
                });

                if (!found) {
                    // No matching color option found in DOM
                }

                // Apply strict filtering first
                const filterSuccess = strictColorFiltering(this, color);
                
                // If strict filtering didn't work, fall back to original method
                if (!filterSuccess) {
                    // No strict matches found, falling back to original filtering method
                    originalSelectColor.call(this, color);
                }
            } catch (error) {
                console.error('Error in enhanced selectColor');
                // Fallback to original method
                originalSelectColor.call(this, color);
            }
        };
        
        // Fix for initial page load selection
        // If a color is already selected, re-apply selection with our enhanced method
        if (manager.selectedVariant && manager.selectedVariant.color) {
            const currentColor = manager.selectedVariant.color;
            // Reapplying color selection for initial color
            manager.selectColor(currentColor);
        } 
        // If no color is selected yet but product is loaded, handle the default selection
        else if (manager.currentProduct) {
            // Applying strict filtering for default color
            
            // Default to first variant color if available
            if (manager.currentProduct.variants && manager.currentProduct.variants.length > 0) {
                const firstVariant = manager.currentProduct.variants[0];
                if (firstVariant && firstVariant.color) {
                    // Selecting default color from first variant
                    manager.selectColor(firstVariant.color);
                }
            }
        }
        
        // Color selection method enhanced with strict filtering
    }

    // Apply enhancement immediately and also listen for product detail initialization
    enhanceProductManager();
    
    // Also listen for the initialization event in case our script runs before product detail manager
    document.addEventListener('productDetailInitialized', enhanceProductManager);
    
    // Additional handler for when product is rendered
    // Use a flag to prevent multiple rapid selections
    let selectionInProgress = false;
    
    document.addEventListener('productDetailRendered', function() {
        // Product detail rendered, checking color selection
        if (selectionInProgress) {
            // Selection already in progress, skipping
            return;
        }
        
        selectionInProgress = true;
        
        if (window.productDetailManager && window.productDetailManager.selectedVariant) {
            const currentColor = window.productDetailManager.selectedVariant.color;
            if (currentColor) {
                // Re-applying color selection after render
                window.productDetailManager.selectColor(currentColor);
                
                // Reset the flag after a delay
                setTimeout(() => {
                    selectionInProgress = false;
                }, 500);
            } else {
                selectionInProgress = false;
            }
        } else {
            selectionInProgress = false;
        }
    });
})();