// Simple Image Loading - No Fallbacks
// This file has been rewritten to remove all fallback logic

document.addEventListener('DOMContentLoaded', function() {
    // Add basic error handling for images
    addImageErrorHandling();
});

// Basic image error handling without fallbacks
function addImageErrorHandling() {
    // Set default error handler on all images
    document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('onerror')) {
            img.onerror = function() {
                console.log('Image failed to load:', this.src);
                // Just hide the image if it fails to load
                this.style.display = 'none';
            };
        }
    });
    
    // Watch for new images being added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'IMG' && !node.hasAttribute('onerror')) {
                            node.onerror = function() {
                                console.log('Image failed to load:', this.src);
                                this.style.display = 'none';
                            };
                        }
                        
                        node.querySelectorAll('img').forEach(img => {
                            if (!img.hasAttribute('onerror')) {
                                img.onerror = function() {
                                    console.log('Image failed to load:', this.src);
                                    this.style.display = 'none';
                                };
                            }
                        });
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}