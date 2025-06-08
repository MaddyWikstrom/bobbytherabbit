/**
 * Color Name Handler - Dynamically maps color names to visual representations
 * This script ensures any named color gets an appropriate background color
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize color handling once DOM is loaded
    initializeColorOptions();
});

/**
 * Initialize color options by processing all color buttons
 */
function initializeColorOptions() {
    // Get all color option elements
    const colorOptions = document.querySelectorAll('.color-option');
    
    // Process each color option
    colorOptions.forEach(option => {
        const colorName = option.getAttribute('data-color');
        if (!colorName) return;
        
        // Check if the color already has a computed style (from CSS)
        const computedStyle = window.getComputedStyle(option);
        const currentBgColor = computedStyle.backgroundColor;
        
        // Only generate color if it doesn't already have one defined in CSS
        // RGB(128, 128, 128) is the default gray we set
        if (currentBgColor === 'rgb(128, 128, 128)') {
            const generatedColor = generateColorFromName(colorName);
            option.style.backgroundColor = generatedColor;
        }
        
        // Make sure the color name tooltip is set
        if (!option.querySelector('.color-name')) {
            const colorNameSpan = document.createElement('span');
            colorNameSpan.className = 'color-name';
            colorNameSpan.textContent = colorName;
            option.appendChild(colorNameSpan);
        }
    });
}

/**
 * Generate a color from a name string
 * @param {string} name - The color name to generate a color from
 * @returns {string} - A hex color code
 */
function generateColorFromName(name) {
    // Special case handling for common compound colors not in CSS
    const specialColors = {
        'navy blue': '#000080',
        'royal blue': '#4169e1',
        'sky blue': '#87ceeb',
        'forest green': '#228b22',
        'mint green': '#98fb98',
        'sage green': '#bcbfa3',
        'hunter green': '#355e3b',
        'olive green': '#556b2f',
        'charcoal gray': '#36454f',
        'charcoal grey': '#36454f',
        'light gray': '#d3d3d3',
        'light grey': '#d3d3d3',
        'dark gray': '#a9a9a9',
        'dark grey': '#a9a9a9',
        'navy blazer': '#001f3f',
        'vintage black': '#202020',
        'off white': '#f5f5f5',
        'deep purple': '#301934',
        'hot pink': '#ff69b4',
        'dark brown': '#5c4033',
        'light brown': '#b5651d',
        'olive drab': '#6b8e23'
    };

    // Check if we have a special mapping for this color name
    const normalizedName = name.toLowerCase();
    if (specialColors[normalizedName]) {
        return specialColors[normalizedName];
    }

    // For multi-word colors, try to interpret the main color
    const colorParts = normalizedName.split(' ');
    const lastWord = colorParts[colorParts.length - 1];
    
    // Check if the last word is a basic color
    if (specialColors[lastWord]) {
        return specialColors[lastWord];
    }
    
    // If no matches found, generate a hash-based color
    // This ensures the same color name always gets the same color
    return hashStringToColor(normalizedName);
}

/**
 * Convert a string to a color using a hash function
 * @param {string} str - String to convert to color
 * @returns {string} - Hex color code
 */
function hashStringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Create more pleasant colors by limiting the range and adding saturation
    const h = Math.abs(hash) % 360;  // Hue (0-360)
    const s = 50 + (Math.abs(hash) % 30);  // Saturation (50-80%)
    const l = 40 + (Math.abs(hash) % 20);  // Lightness (40-60%)
    
    return hslToHex(h, s, l);
}

/**
 * Convert HSL color values to hex code
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - Hex color code
 */
function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// When new colors are added dynamically (e.g., through AJAX)
function refreshColorOptions() {
    initializeColorOptions();
}