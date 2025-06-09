// Size Guide Modal Handler
(function() {
    // Define the functions in the global scope so they can be called from product-detail.js
    window.SizeGuide = {
        init: initSizeGuide,
        open: openSizeGuide,
        close: closeSizeGuide
    };
    
    // Variables to store DOM element references
    let sizeGuideModal;
    let sizeGuideOverlay;
    let sizeGuideClose;
    let sizeGuideContent;
    
    // Initialize when DOM is ready
    function initSizeGuide() {
        console.log('Initializing size guide functionality');
        
        // Size guide elements - get fresh references
        sizeGuideModal = document.getElementById('size-guide-modal');
        sizeGuideOverlay = document.getElementById('size-guide-overlay');
        sizeGuideClose = document.getElementById('size-guide-close');
        sizeGuideContent = document.getElementById('size-guide-content');
        
        // Safety check - hide modal on initialization
        if (sizeGuideModal) {
            sizeGuideModal.style.display = 'none';
        } else {
            console.warn('Size guide modal element not found');
            return; // Exit if modal not found
        }
        
        // Set up event delegation for size guide toggle buttons - works for dynamically added elements
        document.body.addEventListener('click', function(e) {
            // Check if the clicked element or any of its parents has the class 'size-guide-toggle'
            let targetElement = e.target;
            
            while (targetElement != null) {
                if (targetElement.classList && targetElement.classList.contains('size-guide-toggle')) {
                    e.preventDefault();
                    e.stopPropagation();
                    openSizeGuide();
                    return;
                }
                targetElement = targetElement.parentElement;
            }
        });
        
        // Close on click of close button
        if (sizeGuideClose) {
            sizeGuideClose.addEventListener('click', function(e) {
                e.preventDefault();
                closeSizeGuide();
            });
        }
        
        // Close on click of overlay
        if (sizeGuideOverlay) {
            sizeGuideOverlay.addEventListener('click', function(e) {
                if (e.target === sizeGuideOverlay) {
                    closeSizeGuide();
                }
            });
        }
        
        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sizeGuideModal && sizeGuideModal.style.display === 'block') {
                closeSizeGuide();
            }
        });
        
        console.log('Size guide initialization complete');
    }
    
    // Function to close the size guide modal
    function closeSizeGuide() {
        if (sizeGuideModal) {
            sizeGuideModal.style.display = 'none';
        }
    }
    
    // Function to open the size guide modal
    function openSizeGuide() {
        try {
            // Get fresh references in case the DOM has changed
            if (!sizeGuideModal) sizeGuideModal = document.getElementById('size-guide-modal');
            if (!sizeGuideContent) sizeGuideContent = document.getElementById('size-guide-content');
            
            // Make sure modal and content elements exist
            if (!sizeGuideModal || !sizeGuideContent) {
                console.error('Size guide modal or content element not found');
                return;
            }
            
            // Set content
            sizeGuideContent.innerHTML = `
                <div class="size-table-container">
                    <h4>Clothing Size Chart (in inches)</h4>
                    <table class="size-table">
                        <thead>
                            <tr>
                                <th>Size</th>
                                <th>Chest</th>
                                <th>Waist</th>
                                <th>Hip</th>
                                <th>Length</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>S</td>
                                <td>36-38</td>
                                <td>28-30</td>
                                <td>35-37</td>
                                <td>27</td>
                            </tr>
                            <tr>
                                <td>M</td>
                                <td>39-41</td>
                                <td>31-33</td>
                                <td>38-40</td>
                                <td>28</td>
                            </tr>
                            <tr>
                                <td>L</td>
                                <td>42-44</td>
                                <td>34-36</td>
                                <td>41-43</td>
                                <td>29</td>
                            </tr>
                            <tr>
                                <td>XL</td>
                                <td>45-47</td>
                                <td>37-39</td>
                                <td>44-46</td>
                                <td>30</td>
                            </tr>
                            <tr>
                                <td>2XL</td>
                                <td>48-50</td>
                                <td>40-42</td>
                                <td>47-49</td>
                                <td>31</td>
                            </tr>
                        </tbody>
                    </table>
                    <p class="size-note">Note: Measurements may vary slightly between different styles and designs. For specific product measurements, please check the product description.</p>
                </div>
            `;
            
            // Show the modal
            sizeGuideModal.style.display = 'block';
            console.log('Size guide modal opened');
            
        } catch (error) {
            console.error('Error opening size guide:', error);
        }
    }
    
    // Run initialization when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSizeGuide);
    } else {
        // DOM already loaded, run now
        initSizeGuide();
    }
    
    // Also re-initialize on any dynamic content changes
    // This helps when elements are added to the DOM after initial load
    window.addEventListener('load', function() {
        setTimeout(initSizeGuide, 500); // Run again after a delay to catch late DOM changes
    });
    
    // Additional initialization for when product detail finishes rendering
    document.addEventListener('productDetailRendered', function() {
        console.log('Product detail rendered event detected, initializing size guide');
        initSizeGuide();
    });
})();