// Products Page Loading System
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the product manager directly without password or loading screens
    if (window.productManager) {
        window.productManager.renderProducts();
    }
});

// Add shake animation CSS
const shakeStyles = `
    .shake {
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;

const shakeStyleSheet = document.createElement('style');
shakeStyleSheet.textContent = shakeStyles;
document.head.appendChild(shakeStyleSheet);