/**
 * Image Zoom Functionality for Product Detail Page
 * Allows users to open a modal with the product image, zoom in/out, and pan around
 */
class ImageZoom {
    constructor() {
        // Modal elements
        this.modal = document.getElementById('image-zoom-modal');
        this.image = document.getElementById('zoom-image');
        this.closeBtn = document.getElementById('close-zoom');
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomOutBtn = document.getElementById('zoom-out');
        this.resetBtn = document.getElementById('zoom-reset');
        this.zoomLevel = document.querySelector('.zoom-level');
        this.instructions = document.querySelector('.zoom-instructions');
        
        // Create boundary indicators
        this.createBoundaryIndicators();
        
        // State variables
        this.currentZoom = 1;
        this.minZoom = 1;
        this.maxZoom = 4;
        this.zoomStep = 0.5;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.dragThreshold = 5; // Pixels to move before a click becomes a drag
        this.hasMoved = false; // Track if user has moved during mousedown
        
        this.init();
    }
    
    init() {
        // Initialize the main product image click handler
        this.setupProductImageClick();
        
        // Setup modal controls
        this.setupModalControls();
        
        // Setup touch support
        this.setupTouchSupport();
        
        // Add keyboard navigation support
        this.setupKeyboardNavigation();
    }
    
    createBoundaryIndicators() {
        // Create boundary indicators for better user feedback
        const indicators = ['left', 'right', 'top', 'bottom'];
        
        indicators.forEach(position => {
            const indicator = document.createElement('div');
            indicator.className = `boundary-indicator ${position}`;
            this.modal.appendChild(indicator);
        });
        
        // Store references to the indicators
        this.boundaryIndicators = {
            left: this.modal.querySelector('.boundary-indicator.left'),
            right: this.modal.querySelector('.boundary-indicator.right'),
            top: this.modal.querySelector('.boundary-indicator.top'),
            bottom: this.modal.querySelector('.boundary-indicator.bottom')
        };
    }
    
    setupProductImageClick() {
        // Find the main product image container
        const mainImageContainer = document.querySelector('.main-image');
        
        if (mainImageContainer) {
            // Remove any existing click events (from product-detail.js)
            mainImageContainer.replaceWith(mainImageContainer.cloneNode(true));
            
            // Get the fresh reference after cloning
            const freshMainImageContainer = document.querySelector('.main-image');
            
            // Add our click event to open the zoom modal
            freshMainImageContainer.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Get the image src from the clicked image
                const imgElement = freshMainImageContainer.querySelector('img');
                if (imgElement) {
                    this.openZoomModal(imgElement.src, imgElement.alt);
                }
            });
            
            // Add visual indicator that the image is zoomable
            freshMainImageContainer.style.cursor = 'zoom-in';
            
            // Optional: Add a small zoom icon or tooltip
            const zoomIndicator = document.createElement('div');
            zoomIndicator.style.position = 'absolute';
            zoomIndicator.style.bottom = '10px';
            zoomIndicator.style.right = '10px';
            zoomIndicator.style.background = 'rgba(0,0,0,0.5)';
            zoomIndicator.style.color = 'white';
            zoomIndicator.style.padding = '4px 8px';
            zoomIndicator.style.borderRadius = '4px';
            zoomIndicator.style.fontSize = '12px';
            zoomIndicator.innerHTML = '🔍 Click to zoom';
            zoomIndicator.style.opacity = '0.8';
            
            freshMainImageContainer.style.position = 'relative';
            freshMainImageContainer.appendChild(zoomIndicator);
        }
    }
    
    setupModalControls() {
        // Close button
        this.closeBtn.addEventListener('click', () => {
            this.closeZoomModal();
        });
        
        // Close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeZoomModal();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeZoomModal();
            }
        });
        
        // Zoom in button
        this.zoomInBtn.addEventListener('click', () => {
            this.zoomIn();
        });
        
        // Zoom out button
        this.zoomOutBtn.addEventListener('click', () => {
            this.zoomOut();
        });
        
        // Reset zoom button
        this.resetBtn.addEventListener('click', () => {
            this.resetZoom();
        });
        
        // Mouse wheel zoom
        this.image.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            if (e.deltaY < 0) {
                this.zoomIn(0.25); // Smaller zoom step for wheel
            } else {
                this.zoomOut(0.25); // Smaller zoom step for wheel
            }
        });
        
        // Click to zoom in only when at minimum zoom level
        this.image.addEventListener('click', (e) => {
            // Only zoom in on click if we're at the initial zoom level
            if (this.currentZoom === this.minZoom) {
                // Calculate where to zoom based on click position
                this.zoomToPoint(e.clientX, e.clientY);
            } else if (this.currentZoom === this.maxZoom) {
                // If at max zoom, clicking resets
                this.resetZoom();
            }
            // If already zoomed in but not at max, do nothing on click (let dragging work)
        });
        
        // Dragging functionality with improved click detection
        this.image.addEventListener('mousedown', (e) => {
            // Store initial position to detect if this is a click or drag
            this.hasMoved = false;
            this.initialClickX = e.clientX;
            this.initialClickY = e.clientY;
            
            if (this.currentZoom > 1) {
                this.startDrag(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            // Determine if user has moved enough to consider it a drag
            if (this.isDragging) {
                const deltaX = Math.abs(e.clientX - this.initialClickX);
                const deltaY = Math.abs(e.clientY - this.initialClickY);
                
                if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                    this.hasMoved = true;
                }
                
                this.drag(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            const wasClick = !this.hasMoved;
            this.stopDrag();
            
            // If it was a click (not a drag) and at minimum zoom, perform zoom in
            if (wasClick && this.currentZoom === this.minZoom) {
                this.zoomToPoint(e.clientX, e.clientY);
            } else if (wasClick && this.currentZoom === this.maxZoom) {
                this.resetZoom();
            }
        });
        
        // Hide instructions after 3 seconds
        setTimeout(() => {
            if (this.instructions) {
                this.instructions.classList.add('fade');
            }
        }, 3000);
    }
    
    setupTouchSupport() {
        // Variables to track touch interactions
        let lastTouchDistance = 0;
        
        // Touch start - for dragging and pinch zoom
        this.image.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                // Single touch - prepare for dragging
                if (this.currentZoom > 1) {
                    e.preventDefault();
                    const touch = e.touches[0];
                    this.startDrag(touch.clientX, touch.clientY);
                }
            } else if (e.touches.length === 2) {
                // Double touch - prepare for pinch zoom
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            }
        });
        
        // Touch move - for dragging and pinch zoom
        this.image.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isDragging) {
                // Single touch - drag
                e.preventDefault();
                const touch = e.touches[0];
                this.drag(touch.clientX, touch.clientY);
            } else if (e.touches.length === 2) {
                // Double touch - pinch zoom
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const newDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                // Calculate how much the distance has changed
                const deltaDistance = newDistance - lastTouchDistance;
                
                // Apply zoom based on pinch
                if (Math.abs(deltaDistance) > 5) { // Threshold to avoid small movements
                    if (deltaDistance > 0) {
                        // Pinch out - zoom in
                        this.zoomIn(0.05);
                    } else {
                        // Pinch in - zoom out
                        this.zoomOut(0.05);
                    }
                    lastTouchDistance = newDistance;
                }
            }
        });
        
        // Touch end - stop dragging
        this.image.addEventListener('touchend', () => {
            this.stopDrag();
        });
        
        // Touch cancel - stop dragging
        this.image.addEventListener('touchcancel', () => {
            this.stopDrag();
        });
        
        // Prevent default touch behavior like page scrolling when in zoom mode
        this.image.addEventListener('touchmove', (e) => {
            if (this.currentZoom > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    setupKeyboardNavigation() {
        // Add keyboard shortcuts for zoom and navigation
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('active')) return;
            
            switch (e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    this.resetZoom();
                    break;
                case 'ArrowLeft':
                    if (this.currentZoom > 1) {
                        e.preventDefault();
                        this.translateX += 20;
                        this.updatePosition();
                    }
                    break;
                case 'ArrowRight':
                    if (this.currentZoom > 1) {
                        e.preventDefault();
                        this.translateX -= 20;
                        this.updatePosition();
                    }
                    break;
                case 'ArrowUp':
                    if (this.currentZoom > 1) {
                        e.preventDefault();
                        this.translateY += 20;
                        this.updatePosition();
                    }
                    break;
                case 'ArrowDown':
                    if (this.currentZoom > 1) {
                        e.preventDefault();
                        this.translateY -= 20;
                        this.updatePosition();
                    }
                    break;
            }
        });
    }
    
    openZoomModal(imageSrc, imageAlt) {
        // Set the image source
        this.image.src = imageSrc;
        this.image.alt = imageAlt || 'Zoomed product image';
        
        // Reset zoom state
        this.resetZoom();
        
        // Show the modal
        this.modal.classList.add('active');
        
        // Hide boundary indicators initially
        this.updateBoundaryIndicators();
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        // Show helpful instructions
        if (this.instructions) {
            this.instructions.textContent = 'Click to zoom in, drag to move when zoomed';
            this.instructions.classList.remove('fade');
            
            // Hide instructions after 3 seconds
            setTimeout(() => {
                this.instructions.classList.add('fade');
            }, 3000);
        }
    }
    
    closeZoomModal() {
        // Hide the modal
        this.modal.classList.remove('active');
        
        // Restore body scrolling
        document.body.style.overflow = '';
        
        // Reset zoom for next time
        this.resetZoom();
    }
    
    zoomIn(step = this.zoomStep) {
        if (this.currentZoom < this.maxZoom) {
            this.currentZoom = Math.min(this.currentZoom + step, this.maxZoom);
            this.updateZoom();
        }
    }
    
    zoomOut(step = this.zoomStep) {
        if (this.currentZoom > this.minZoom) {
            this.currentZoom = Math.max(this.currentZoom - step, this.minZoom);
            this.updateZoom();
            
            // If we're back to minimum zoom, reset position
            if (this.currentZoom === this.minZoom) {
                this.translateX = 0;
                this.translateY = 0;
                this.updatePosition();
            }
        }
    }
    
    resetZoom() {
        // Reset to initial state
        this.currentZoom = 1;
        this.translateX = 0;
        this.translateY = 0;
        
        // Update UI
        this.updateZoom();
        this.updatePosition();
        
        // Remove zoomed class if present
        this.image.classList.remove('zoomed');
    }
    
    zoomToPoint(clientX, clientY) {
        // Get image dimensions and position
        const rect = this.image.getBoundingClientRect();
        
        // Calculate relative position within the image (0-1)
        const relativeX = (clientX - rect.left) / rect.width;
        const relativeY = (clientY - rect.top) / rect.height;
        
        // Store original position
        const originalWidth = rect.width;
        const originalHeight = rect.height;
        
        // Apply zoom
        this.zoomIn();
        
        // If we're zoomed in, calculate new position
        if (this.currentZoom > 1) {
            // Calculate new dimensions after zoom
            const newWidth = originalWidth * this.currentZoom;
            const newHeight = originalHeight * this.currentZoom;
            
            // Calculate how much the image has grown
            const widthDifference = newWidth - originalWidth;
            const heightDifference = newHeight - originalHeight;
            
            // Calculate how much to translate to keep the clicked point fixed
            this.translateX = -widthDifference * relativeX;
            this.translateY = -heightDifference * relativeY;
            
            // Apply the new position
            this.updatePosition();
            
            // Add zoomed class for cursor change
            this.image.classList.add('zoomed');
        }
    }
    
    startDrag(clientX, clientY) {
        if (this.currentZoom <= this.minZoom) return; // Don't start dragging if not zoomed in
        
        this.isDragging = true;
        this.startX = clientX - this.translateX;
        this.startY = clientY - this.translateY;
        this.image.style.cursor = 'grabbing';
        
        // Add a dragging class to the modal for visual feedback
        this.modal.classList.add('dragging');
    }
    
    drag(clientX, clientY) {
        if (!this.isDragging) return;
        
        // Calculate new position with smoother movement
        let newTranslateX = clientX - this.startX;
        let newTranslateY = clientY - this.startY;
        
        // Get image and container dimensions
        const rect = this.image.getBoundingClientRect();
        const containerRect = this.modal.getBoundingClientRect();
        
        // Calculate the image center point
        const imageCenterX = rect.width / 2;
        const imageCenterY = rect.height / 2;
        
        // Calculate the container center point
        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;
        
        // Calculate bounds to keep image within view with improved edge behavior
        const scaledWidth = rect.width * this.currentZoom;
        const scaledHeight = rect.height * this.currentZoom;
        
        // Calculate how much the image can move in each direction
        // This creates a "rubber band" effect near the edges
        const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);
        
        // Apply bounds with slight elasticity for more natural feeling
        if (Math.abs(newTranslateX) > maxTranslateX) {
            // Apply elastic resistance when dragging beyond bounds
            const overflowX = Math.abs(newTranslateX) - maxTranslateX;
            const elasticX = overflowX * 0.2; // 20% elasticity
            newTranslateX = (newTranslateX > 0) ?
                maxTranslateX + elasticX :
                -maxTranslateX - elasticX;
        }
        
        if (Math.abs(newTranslateY) > maxTranslateY) {
            // Apply elastic resistance when dragging beyond bounds
            const overflowY = Math.abs(newTranslateY) - maxTranslateY;
            const elasticY = overflowY * 0.2; // 20% elasticity
            newTranslateY = (newTranslateY > 0) ?
                maxTranslateY + elasticY :
                -maxTranslateY - elasticY;
        }
        
        // Update position with smoother transition
        this.translateX = newTranslateX;
        this.translateY = newTranslateY;
        this.updatePosition();
    }
    
    stopDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.modal.classList.remove('dragging');
        
        // Snap back to bounds if we're outside with elastic effect
        const rect = this.image.getBoundingClientRect();
        const containerRect = this.modal.getBoundingClientRect();
        
        const scaledWidth = rect.width * this.currentZoom;
        const scaledHeight = rect.height * this.currentZoom;
        
        const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);
        
        // Apply bounds strictly when releasing drag
        this.translateX = Math.min(Math.max(this.translateX, -maxTranslateX), maxTranslateX);
        this.translateY = Math.min(Math.max(this.translateY, -maxTranslateY), maxTranslateY);
        
        // Apply the snapped position with a slight transition
        this.image.style.transition = 'transform 0.2s ease-out';
        this.updatePosition();
        
        // Remove the transition after it completes
        setTimeout(() => {
            this.image.style.transition = '';
        }, 200);
        
        // Update cursor based on zoom level
        this.image.style.cursor = this.currentZoom > 1 ? 'grab' : 'zoom-in';
    }
    
    updateZoom() {
        // Update image transform
        this.image.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.currentZoom})`;
        
        // Update zoom level text
        if (this.zoomLevel) {
            this.zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
        }
        
        // Update cursor based on zoom level
        if (this.currentZoom > 1) {
            this.image.classList.add('zoomed');
            this.image.style.cursor = this.isDragging ? 'grabbing' : 'grab';
        } else {
            this.image.classList.remove('zoomed');
            this.image.style.cursor = 'zoom-in';
        }
    }
    
    updatePosition() {
        // Update image position without changing zoom
        this.image.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.currentZoom})`;
        
        // Check if we need to update boundary indicators
        this.updateBoundaryIndicators();
    }
    
    updateBoundaryIndicators(checkBounds = true) {
        if (!this.boundaryIndicators) return;
        
        if (!checkBounds || this.currentZoom <= 1) {
            // Hide all indicators when not zoomed in
            Object.values(this.boundaryIndicators).forEach(indicator => {
                indicator.classList.remove('visible');
            });
            return;
        }
        
        // When zoomed, check if we're at boundaries
        const rect = this.image.getBoundingClientRect();
        const containerRect = this.modal.getBoundingClientRect();
        
        const scaledWidth = rect.width * this.currentZoom;
        const scaledHeight = rect.height * this.currentZoom;
        
        const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);
        
        // Show indicators when near bounds (within 5 pixels)
        const nearLeftBound = Math.abs(this.translateX - maxTranslateX) < 5;
        const nearRightBound = Math.abs(this.translateX - (-maxTranslateX)) < 5;
        const nearTopBound = Math.abs(this.translateY - maxTranslateY) < 5;
        const nearBottomBound = Math.abs(this.translateY - (-maxTranslateY)) < 5;
        
        this.boundaryIndicators.left.classList.toggle('visible', nearLeftBound);
        this.boundaryIndicators.right.classList.toggle('visible', nearRightBound);
        this.boundaryIndicators.top.classList.toggle('visible', nearTopBound);
        this.boundaryIndicators.bottom.classList.toggle('visible', nearBottomBound);
    }
}

// Initialize image zoom when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure product detail has loaded
    setTimeout(() => {
        window.imageZoom = new ImageZoom();
    }, 500);
});

// Additional event listener for when product detail rendering is complete
document.addEventListener('productDetailRendered', () => {
    // Initialize or reinitialize image zoom
    if (window.imageZoom) {
        // If already initialized, just update the image click handler
        window.imageZoom.setupProductImageClick();
    } else {
        // Otherwise create a new instance
        window.imageZoom = new ImageZoom();
    }
});