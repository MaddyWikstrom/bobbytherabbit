// Size Guide Modal Handler
document.addEventListener('DOMContentLoaded', function() {
    // Size guide elements
    const sizeGuideModal = document.getElementById('size-guide-modal');
    const sizeGuideOverlay = document.getElementById('size-guide-overlay');
    const sizeGuideClose = document.getElementById('size-guide-close');
    const sizeGuideContent = document.getElementById('size-guide-content');
    
    // Function to close the size guide modal
    function closeSizeGuide() {
        if (sizeGuideModal) {
            sizeGuideModal.style.display = 'none';
        }
    }
    
    // Size guide toggle button - add listener to any button with 'size-guide-toggle' class
    document.querySelectorAll('.size-guide-toggle').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (sizeGuideModal) {
                // Load size guide content
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
            }
        });
    });
    
    // Close on click of close button
    if (sizeGuideClose) {
        sizeGuideClose.addEventListener('click', closeSizeGuide);
    }
    
    // Close on click of overlay
    if (sizeGuideOverlay) {
        sizeGuideOverlay.addEventListener('click', closeSizeGuide);
    }
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sizeGuideModal && sizeGuideModal.style.display === 'block') {
            closeSizeGuide();
        }
    });
    
    // Make sure the size guide is hidden on page load
    if (sizeGuideModal) {
        sizeGuideModal.style.display = 'none';
    }
});