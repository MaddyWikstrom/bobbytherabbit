// Color Strict Filter
// This script enhances the image filtering in product-detail.js to ensure
// only images matching the exact selected color are displayed

(function() {
    console.log("Enhanced color image selection installed");

    // Wait for the product detail manager to be initialized
    document.addEventListener('productDetailInitialized', function() {
        if (!window.productDetailManager) {
            console.warn("Product detail manager not found");
            return;
        }

        const originalSelectColor = window.productDetailManager.selectColor;

        // Override the selectColor method with improved filtering
        window.productDetailManager.selectColor = function(color) {
            try {
                if (!color) {
                    console.warn('No color provided to selectColor');
                    return;
                }

                console.log(`Selecting color: ${color}`);

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
                    console.log(`No matching color option found in DOM for: ${color}`);
                }

                // STRICT COLOR FILTERING LOGIC
                // This is the enhanced part that ensures strict color matching
                
                // Special handling for multi-word colors with spaces like "forest green" or "heather gray"
                const isMultiWordColor = color.includes(' ');
                console.log(`Color "${color}" is multi-word: ${isMultiWordColor}`);

                // Get product images
                const allImages = this.currentProduct.images || [];
                console.log(`Total product images: ${allImages.length}`);

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
                        blackExclusionCheck = (url) => !url.toLowerCase().includes('vintage-black');
                    } else if (normalizedColor === 'vintage black') {
                        // For "vintage black", only include images specifically with vintage black
                        blackExclusionCheck = (url) => {
                            const lowerUrl = url.toLowerCase();
                            return lowerUrl.includes('vintage-black') || lowerUrl.includes('vintage_black');
                        };
                    }
                }
                
                // Filter images based on strict color matching
                const strictlyFilteredImages = allImages.filter(imgUrl => {
                    const imgUrlLower = imgUrl.toLowerCase();
                    
                    // Special handling for black variants
                    if (blackExclusionCheck && !blackExclusionCheck(imgUrlLower)) {
                        return false;
                    }
                    
                    // Check against strict patterns
                    return strictPatterns.some(pattern => imgUrlLower.includes(pattern));
                });
                
                console.log(`Found ${strictlyFilteredImages.length} strictly matched images for color ${color}`);
                
                if (strictlyFilteredImages.length > 0) {
                    // Use strictly filtered images if available
                    this.filteredImages = strictlyFilteredImages;
                    this.currentImageIndex = 0;
                    this.updateMainImage();
                    this.updateThumbnailGrid();
                    return; // Exit early with strict matches
                }
                
                // If strict filtering found no images, fall back to original method for backward compatibility
                console.log(`No strict matches found for ${color}, falling back to original filtering method`);
                originalSelectColor.call(this, color);
                
            } catch (error) {
                console.error('Error in enhanced selectColor:', error);
                // Fallback to original method
                originalSelectColor.call(this, color);
            }
        };
        
        console.log("Color selection method enhanced with strict filtering");
    });
})();