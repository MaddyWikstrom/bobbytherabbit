/**
 * Quick View and Quick Add to Cart Functionality
 * Allows users to quickly view product details and add items to cart
 * without navigating to the full product page
 */

class QuickViewManager {
    constructor() {
        this.currentProduct = null;
        this.selectedVariant = {
            color: null,
            size: null,
            quantity: 1
        };
        this.isLoading = false;
        this.modalCreated = false;
        this.isColorFiltering = false;
        
        this.init();
    }
    
    init() {
        this.createQuickViewModal();
        this.addQuickViewStyles();
        this.setupEventListeners();
        // QuickView system initialized
    }

    // Extract category from product title
    extractCategory(title) {
        const titleLower = title.toLowerCase();
        
        // Check for common category keywords
        if (titleLower.includes('hoodie')) return 'Hoodie';
        if (titleLower.includes('tee') || titleLower.includes('t-shirt') || titleLower.includes('t shirt')) return 'T-Shirt';
        if (titleLower.includes('beanie')) return 'Beanie';
        if (titleLower.includes('hat') || titleLower.includes('cap')) return 'Hat';
        if (titleLower.includes('joggers') || titleLower.includes('pants')) return 'Joggers';
        if (titleLower.includes('shorts')) return 'Shorts';
        if (titleLower.includes('jacket')) return 'Jacket';
        if (titleLower.includes('socks')) return 'Socks';
        if (titleLower.includes('sweatshirt')) return 'Sweatshirt';
        
        // Default category if no keyword match
        return 'Streetwear';
    }

    // Method to simplify size display
    simplifySize(size) {
        if (!size) return '';
        
        // Handle common size abbreviations
        const sizeUpper = size.toUpperCase();
        if (sizeUpper === 'SMALL') return 'S';
        if (sizeUpper === 'MEDIUM') return 'M';
        if (sizeUpper === 'LARGE') return 'L';
        if (sizeUpper === 'EXTRA LARGE' || sizeUpper === 'XLARGE' || sizeUpper === 'X-LARGE') return 'XL';
        if (sizeUpper === 'EXTRA EXTRA LARGE' || sizeUpper === 'XXLARGE' || sizeUpper === 'XX-LARGE' || sizeUpper === '2XLARGE' || sizeUpper === '2X-LARGE') return '2XL';
        if (sizeUpper === '3XLARGE' || sizeUpper === 'XXXLARGE' || sizeUpper === '3X-LARGE' || sizeUpper === 'XXX-LARGE') return '3XL';
        
        // Return original if it's already simple
        if (['S', 'M', 'L', 'XL', '2XL', '3XL', 'OS', 'ONE SIZE'].includes(sizeUpper)) {
            return sizeUpper;
        }
        
        // Return as is for numeric sizes or other formats
        return size;
    }

    // Get color code for standard colors
    getColorCode(colorName) {
        if (!colorName) return '#000000';
        
        const colorMap = {
            'black': '#000000',
            'white': '#ffffff',
            'red': '#ff0000',
            'blue': '#0000ff',
            'green': '#00ff00',
            'yellow': '#ffff00',
            'purple': '#800080',
            'pink': '#ffc0cb',
            'orange': '#ffa500',
            'brown': '#a52a2a',
            'gray': '#808080',
            'grey': '#808080',
            'navy': '#000080',
            'beige': '#f5f5dc',
            'tan': '#d2b48c',
            'olive': '#808000',
            'maroon': '#800000',
            'cream': '#fffdd0',
            'teal': '#008080',
            'gold': '#ffd700',
            'silver': '#c0c0c0',
            'charcoal': '#36454f',
            'vintage black': '#222222',
        };
        
        // Look for any color word in the name
        const colorLower = colorName.toLowerCase();
        for (const [key, value] of Object.entries(colorMap)) {
            if (colorLower.includes(key)) {
                return value;
            }
        }
        
        // Default to black if no match
        return '#000000';
    }
    
    // Show loading spinner
    showLoading(show) {
        const loadingEl = document.getElementById('quick-view-loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'flex' : 'none';
        }
        this.isLoading = show;
    }
    
    // Open the modal
    openModal() {
        const modal = document.getElementById('quick-view-modal');
        const overlay = document.getElementById('quick-view-overlay');
        
        if (modal && overlay) {
            // Show overlay first, then modal with slight delay for animation
            overlay.classList.add('active');
            setTimeout(() => {
                modal.classList.add('active');
            }, 50);
        }
    }
    
    // Close the modal
    closeQuickView() {
        const modal = document.getElementById('quick-view-modal');
        const overlay = document.getElementById('quick-view-overlay');
        
        if (modal && overlay) {
            modal.classList.remove('active');
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 300);
        }
    }
    
    // Render the quick view contents
    renderQuickView() {
        if (!this.currentProduct) return;
        
        // Set basic product info
        document.getElementById('quick-view-title').textContent = this.currentProduct.title;
        document.getElementById('quick-view-category').textContent = this.currentProduct.category || 'Streetwear';
        document.getElementById('quick-view-description').innerHTML = this.currentProduct.description;
        
        // Set pricing info
        document.getElementById('quick-view-price-current').textContent = `$${this.currentProduct.price.toFixed(2)}`;
        
        // Display sale price if applicable
        if (this.currentProduct.comparePrice && this.currentProduct.comparePrice > this.currentProduct.price) {
            document.getElementById('quick-view-price-original').textContent = `$${this.currentProduct.comparePrice.toFixed(2)}`;
            
            // Calculate and show discount percentage
            const discountPercent = Math.round(((this.currentProduct.comparePrice - this.currentProduct.price) / this.currentProduct.comparePrice) * 100);
            document.getElementById('quick-view-price-discount').textContent = `${discountPercent}% OFF`;
            document.getElementById('quick-view-price-discount').style.display = 'block';
        } else {
            document.getElementById('quick-view-price-original').textContent = '';
            document.getElementById('quick-view-price-discount').style.display = 'none';
        }
        
        // Render images
        this.renderImages();
        
        // Render color options
        this.renderColorOptions();
        
        // Render size options
        this.renderSizeOptions();
        
        // Initialize the add to cart button state
        this.updateQuickViewState();
    }
    
    // Render product images
    renderImages() {
        if (!this.currentProduct || !this.currentProduct.images || this.currentProduct.images.length === 0) {
            // No images to display
            const mainImage = document.getElementById('quick-view-main-image');
            mainImage.src = 'https://via.placeholder.com/400x400?text=No+Image+Available';
            mainImage.alt = this.currentProduct?.title || 'Product Image';
            
            document.getElementById('quick-view-thumbnails').innerHTML = '';
            return;
        }
        
        // Set main image
        const mainImage = document.getElementById('quick-view-main-image');
        mainImage.src = this.currentProduct.images[0];
        mainImage.alt = this.currentProduct.title;
        
        // Generate thumbnails
        const thumbnailsContainer = document.getElementById('quick-view-thumbnails');
        thumbnailsContainer.innerHTML = '';
        
        this.currentProduct.images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.className = `quick-view-thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.src = imageUrl;
            thumbnail.alt = `${this.currentProduct.title} - Image ${index + 1}`;
            
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
    
    // Render color options
    renderColorOptions() {
        const colorOptions = document.getElementById('quick-view-color-options');
        const colorGroup = document.getElementById('quick-view-color-group');
        
        // Hide color section if no colors available
        if (!this.currentProduct.colors || this.currentProduct.colors.length === 0) {
            colorGroup.style.display = 'none';
            return;
        }
        
        colorGroup.style.display = 'block';
        colorOptions.innerHTML = '';
        
        // Create a color option for each available color
        this.currentProduct.colors.forEach(color => {
            const option = document.createElement('div');
            option.className = 'quick-view-color-option';
            option.setAttribute('data-color', color.name);
            option.style.color = color.code;
            
            const colorName = document.createElement('span');
            colorName.className = 'quick-view-color-name';
            colorName.textContent = color.name;
            
            option.appendChild(colorName);
            colorOptions.appendChild(option);
        });
    }
    
    // Render size options
    renderSizeOptions() {
        const sizeOptions = document.getElementById('quick-view-size-options');
        const sizeGroup = document.getElementById('quick-view-size-group');
        
        // Hide size section if no sizes available
        if (!this.currentProduct.sizes || this.currentProduct.sizes.length === 0) {
            sizeGroup.style.display = 'none';
            return;
        }
        
        sizeGroup.style.display = 'block';
        sizeOptions.innerHTML = '';
        
        // Create a size option for each available size
        this.currentProduct.sizes.forEach(size => {
            const option = document.createElement('div');
            option.className = 'quick-view-size-option';
            option.setAttribute('data-size', size);
            
            // Check if this size is available for the selected color
            let isAvailable = true;
            if (this.selectedVariant.color) {
                const inventoryKey = `${this.selectedVariant.color}-${size}`;
                const stockLevel = this.currentProduct.inventory[inventoryKey] || 0;
                isAvailable = stockLevel > 0;
                
                if (!isAvailable) {
                    option.classList.add('unavailable');
                }
            }
            
            // Use simplified size display
            option.textContent = this.simplifySize(size);
            
            sizeOptions.appendChild(option);
        });
    }
    
    // Update button states based on selection
    updateQuickViewState() {
        const addBtn = document.getElementById('quick-view-add-btn');
        
        // Disable add button if color or size not selected
        const hasRequiredSelections = this.currentProduct.colors.length === 0 || this.selectedVariant.color;
        const hasSizeIfNeeded = this.currentProduct.sizes.length === 0 || this.selectedVariant.size;
        
        addBtn.disabled = !(hasRequiredSelections && hasSizeIfNeeded);
    }
    
    // Get available stock for selected variant
    getAvailableStock() {
        if (!this.currentProduct || !this.selectedVariant.color || !this.selectedVariant.size) {
            return 10; // Default max if no variant selected
        }
        
        // Get stock from inventory
        const inventoryKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        return this.currentProduct.inventory[inventoryKey] || 10;
    }
    
    // Add current product to cart
    addToCart() {
        if (!this.currentProduct || (this.currentProduct.colors.length > 0 && !this.selectedVariant.color) || (this.currentProduct.sizes.length > 0 && !this.selectedVariant.size)) {
            // Cannot add to cart if required options not selected
            return;
        }
        
        try {
            // Create cart item
            const cartItem = {
                ...this.currentProduct,
                selectedSize: this.selectedVariant.size,
                selectedColor: this.selectedVariant.color,
                quantity: this.selectedVariant.quantity,
                variants: {
                    size: this.selectedVariant.size,
                    color: this.selectedVariant.color
                },
                variant: {
                    size: this.selectedVariant.size,
                    color: this.selectedVariant.color
                },
                size: this.selectedVariant.size,
                color: this.selectedVariant.color
            };
            
            // Find the correct image for the selected color
            if (this.selectedVariant.color && this.currentProduct.images.length > 1) {
                // Select the current main image as the cart image
                const mainImage = document.getElementById('quick-view-main-image');
                cartItem.image = mainImage.src;
                cartItem.mainImage = mainImage.src;
            } else if (this.currentProduct.images.length > 0) {
                cartItem.image = this.currentProduct.images[0];
                cartItem.mainImage = this.currentProduct.images[0];
            }
            
            // Add to cart using available cart system
            let cartAddSuccess = false;
            
            if (window.BobbyCart) {
                window.BobbyCart.addItem(cartItem);
                cartAddSuccess = true;
                
                // Open cart after a delay
                setTimeout(() => {
                    if (typeof window.BobbyCart.openCart === 'function') {
                        window.BobbyCart.openCart();
                    }
                }, 500);
            } else if (window.BobbyCarts) {
                window.BobbyCarts.addToCart(cartItem);
                cartAddSuccess = true;
                
                setTimeout(() => {
                    if (typeof window.BobbyCarts.openCart === 'function') {
                        window.BobbyCarts.openCart();
                    }
                }, 500);
            } else if (window.cartManager) {
                window.cartManager.addItem(cartItem);
                cartAddSuccess = true;
                
                setTimeout(() => {
                    if (typeof window.cartManager.openCart === 'function') {
                        window.cartManager.openCart();
                    }
                }, 500);
            } else {
                this.showNotification('Cart system not available', 'error');
                return;
            }
            
            if (cartAddSuccess) {
                // Close quick view modal
                this.closeQuickView();
                
                // Show confirmation notification
                const sizeText = this.selectedVariant.size ? ` (${this.simplifySize(this.selectedVariant.size)})` : '';
                this.showNotification(`Added ${this.currentProduct.title}${sizeText} to cart`, 'success');
            }
            
        } catch (error) {
            // Error adding to cart
            this.showNotification('Error adding to cart', 'error');
        }
    }
    
    // Filter images by color
    filterImagesByColor(colorName) {
        if (this.isColorFiltering) return; // Prevent multiple simultaneous filters
        
        this.isColorFiltering = true;
        const MAX_IMAGES = 5; // Limit to avoid endless loops
        
        try {
            // If no color or no images, do nothing
            if (!colorName || !this.currentProduct || !this.currentProduct.images || this.currentProduct.images.length <= 1) {
                this.isColorFiltering = false;
                return;
            }
            
            // Get color name in lowercase for matching
            const colorLower = colorName.toLowerCase();
            
            // Find matching images - first, try exact color name in the URL
            let matchedImages = this.currentProduct.images.filter(url => {
                const urlLower = url.toLowerCase();
                return urlLower.includes(colorLower) || 
                       // Special case for vintage black and charcoal gray
                       (colorLower === 'vintage black' && urlLower.includes('vintage')) ||
                       (colorLower === 'charcoal gray' && urlLower.includes('charcoal'));
            });
            
            // Cap the number of images to avoid processing too many
            if (matchedImages.length > MAX_IMAGES) {
                matchedImages = matchedImages.slice(0, MAX_IMAGES);
            }
            
            // If we found at least one matching image, update the gallery
            if (matchedImages.length > 0) {
                // Update main image to first matching image
                const mainImage = document.getElementById('quick-view-main-image');
                mainImage.src = matchedImages[0];
                
                // Update thumbnails
                const thumbnailsContainer = document.getElementById('quick-view-thumbnails');
                thumbnailsContainer.innerHTML = '';
                
                matchedImages.forEach((imageUrl, index) => {
                    const thumbnail = document.createElement('img');
                    thumbnail.className = `quick-view-thumbnail ${index === 0 ? 'active' : ''}`;
                    thumbnail.src = imageUrl;
                    thumbnail.alt = `${this.currentProduct.title} - ${colorName} - Image ${index + 1}`;
                    
                    thumbnailsContainer.appendChild(thumbnail);
                });
            }
        } catch (error) {
            // Error in filtering - silently fail
        } finally {
            // Always clear the filtering flag
            this.isColorFiltering = false;
        }
    }
    
    // Update product card image when color is selected
    updateProductCardImage(colorName, card) {
        if (!card || !colorName || !this.currentProduct) return;
        
        try {
            // Find an image that matches this color
            const colorLower = colorName.toLowerCase();
            const matchingImage = this.currentProduct.images.find(url => {
                const urlLower = url.toLowerCase();
                return urlLower.includes(colorLower) || 
                       // Special cases
                       (colorLower === 'vintage black' && urlLower.includes('vintage')) ||
                       (colorLower === 'charcoal gray' && urlLower.includes('charcoal'));
            });
            
            // If we found a matching image, update the card image
            if (matchingImage) {
                const cardImage = card.querySelector('img');
                if (cardImage) {
                    cardImage.src = matchingImage;
                }
            }
        } catch (error) {
            // Error updating image - silently fail
        }
    }
}

// Initialize the quick view manager
const quickViewManager = new QuickViewManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { quickViewManager };
}