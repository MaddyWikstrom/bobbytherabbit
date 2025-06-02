// Shopping Cart JavaScript for Bobby Streetwear

document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
});

function initializeCart() {
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const cartClose = document.getElementById('cart-close');
    const cartItems = document.getElementById('cart-items');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    // Open cart modal
    cartBtn.addEventListener('click', function() {
        cartModal.classList.remove('hidden');
        updateCartDisplay();
        
        // Add entrance animation
        setTimeout(() => {
            cartModal.style.opacity = '1';
            cartModal.querySelector('.cart-content').style.transform = 'scale(1)';
        }, 10);
    });
    
    // Close cart modal
    cartClose.addEventListener('click', closeCart);
    
    // Close cart when clicking outside
    cartModal.addEventListener('click', function(e) {
        if (e.target === cartModal) {
            closeCart();
        }
    });
    
    // Checkout functionality
    checkoutBtn.addEventListener('click', function() {
        const cart = getCart();
        if (cart.length === 0) {
            showNotification('Your cart is empty!');
            return;
        }
        
        initiateCheckout();
    });
    
    function closeCart() {
        cartModal.style.opacity = '0';
        cartModal.querySelector('.cart-content').style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            cartModal.classList.add('hidden');
        }, 300);
    }
    
    function updateCartDisplay() {
        const cart = getCart();
        const totalAmount = document.querySelector('.total-amount');
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty</p>
                    <p class="terminal-text">> ADD_ITEMS_TO_CART</p>
                </div>
            `;
            totalAmount.textContent = '$0.00';
            return;
        }
        
        // Generate cart items HTML
        let cartHTML = '';
        let total = 0;
        
        cart.forEach((item, index) => {
            const itemPrice = parseFloat(item.price.replace('$', ''));
            const itemTotal = itemPrice * item.quantity;
            total += itemTotal;
            
            cartHTML += `
                <div class="cart-item" data-index="${index}">
                    <div class="item-info">
                        <h4 class="item-name">${item.name}</h4>
                        <p class="item-details">Size: ${item.size} | ${item.price}</p>
                    </div>
                    <div class="item-controls">
                        <div class="quantity-controls">
                            <button class="qty-btn minus" data-index="${index}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="qty-btn plus" data-index="${index}">+</button>
                        </div>
                        <button class="remove-item" data-index="${index}">×</button>
                    </div>
                    <div class="item-total">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
        
        cartItems.innerHTML = cartHTML;
        totalAmount.textContent = `$${total.toFixed(2)}`;
        
        // Add event listeners to cart controls
        addCartControlListeners();
    }
    
    function addCartControlListeners() {
        // Quantity controls
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const isPlus = this.classList.contains('plus');
                
                updateQuantity(index, isPlus);
            });
        });
        
        // Remove item buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                removeFromCart(index);
            });
        });
    }
    
    function updateQuantity(index, increase) {
        const cart = getCart();
        
        if (increase) {
            cart[index].quantity += 1;
        } else {
            cart[index].quantity -= 1;
            
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
        }
        
        saveCart(cart);
        updateCartDisplay();
        updateCartCount();
        
        // Add animation to the updated item
        const cartItem = document.querySelector(`[data-index="${index}"]`);
        if (cartItem) {
            cartItem.style.transform = 'scale(1.05)';
            setTimeout(() => {
                cartItem.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    function removeFromCart(index) {
        const cart = getCart();
        const removedItem = cart[index];
        
        cart.splice(index, 1);
        saveCart(cart);
        updateCartDisplay();
        updateCartCount();
        
        showNotification(`${removedItem.name} removed from cart`);
        
        // Add removal animation
        const cartItem = document.querySelector(`[data-index="${index}"]`);
        if (cartItem) {
            cartItem.style.animation = 'slideOut 0.3s ease forwards';
        }
    }
    
    function initiateCheckout() {
        const cart = getCart();
        const total = cart.reduce((sum, item) => {
            return sum + (parseFloat(item.price.replace('$', '')) * item.quantity);
        }, 0);
        
        // Create checkout interface
        const checkoutModal = createCheckoutModal(cart, total);
        document.body.appendChild(checkoutModal);
        
        // Close cart modal
        closeCart();
        
        // Show checkout modal
        setTimeout(() => {
            checkoutModal.style.opacity = '1';
            checkoutModal.querySelector('.checkout-content').style.transform = 'scale(1)';
        }, 10);
    }
    
    function createCheckoutModal(cart, total) {
        const modal = document.createElement('div');
        modal.className = 'checkout-modal';
        modal.innerHTML = `
            <div class="checkout-content">
                <div class="checkout-header">
                    <h2 class="glitch-text" data-text="CHECKOUT">CHECKOUT</h2>
                    <button class="checkout-close">×</button>
                </div>
                <div class="checkout-body">
                    <div class="terminal-interface">
                        <div class="terminal-header">
                            <span class="terminal-title">BOBBY_PAYMENT_SYSTEM_v2.1</span>
                        </div>
                        <div class="terminal-content">
                            <div class="order-summary">
                                <p class="terminal-line">> ORDER_SUMMARY:</p>
                                ${cart.map(item => `
                                    <p class="terminal-line">   ${item.name} (${item.size}) x${item.quantity} - $${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</p>
                                `).join('')}
                                <p class="terminal-line">   ────────────────────────</p>
                                <p class="terminal-line">   TOTAL: $${total.toFixed(2)}</p>
                                <p class="terminal-line">> PROCESSING_PAYMENT...</p>
                            </div>
                            <div class="payment-form">
                                <div class="form-group">
                                    <label class="terminal-label">> ENTER_EMAIL:</label>
                                    <input type="email" class="terminal-input" placeholder="user@cybernet.com" required>
                                </div>
                                <div class="form-group">
                                    <label class="terminal-label">> CARD_NUMBER:</label>
                                    <input type="text" class="terminal-input" placeholder="**** **** **** ****" maxlength="19" required>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="terminal-label">> EXP_DATE:</label>
                                        <input type="text" class="terminal-input" placeholder="MM/YY" maxlength="5" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="terminal-label">> CVV:</label>
                                        <input type="text" class="terminal-input" placeholder="***" maxlength="3" required>
                                    </div>
                                </div>
                                <button class="process-payment-btn glitch-btn" data-text="PROCESS_PAYMENT">
                                    PROCESS_PAYMENT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        const closeBtn = modal.querySelector('.checkout-close');
        const processBtn = modal.querySelector('.process-payment-btn');
        const cardInput = modal.querySelector('input[placeholder="**** **** **** ****"]');
        const expInput = modal.querySelector('input[placeholder="MM/YY"]');
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Format card number input
        cardInput.addEventListener('input', function() {
            let value = this.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            this.value = formattedValue;
        });
        
        // Format expiry date input
        expInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            this.value = value;
        });
        
        processBtn.addEventListener('click', function() {
            processPayment(modal, cart, total);
        });
        
        return modal;
    }
    
    function processPayment(modal, cart, total) {
        const processBtn = modal.querySelector('.process-payment-btn');
        const terminalContent = modal.querySelector('.terminal-content');
        
        // Validate form
        const inputs = modal.querySelectorAll('.terminal-input');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = 'var(--accent-yellow)';
                input.style.boxShadow = '0 0 10px var(--glow-yellow)';
            } else {
                input.style.borderColor = 'var(--border-color)';
                input.style.boxShadow = 'none';
            }
        });
        
        if (!isValid) {
            showNotification('Please fill in all fields');
            return;
        }
        
        // Start payment processing animation
        processBtn.textContent = 'PROCESSING...';
        processBtn.disabled = true;
        
        // Simulate payment processing
        const processingSteps = [
            'VALIDATING_CARD...',
            'CONNECTING_TO_BANK...',
            'AUTHORIZING_PAYMENT...',
            'PROCESSING_TRANSACTION...',
            'PAYMENT_SUCCESSFUL!'
        ];
        
        let stepIndex = 0;
        const processingInterval = setInterval(() => {
            if (stepIndex < processingSteps.length) {
                const stepElement = document.createElement('p');
                stepElement.className = 'terminal-line processing-step';
                stepElement.textContent = `> ${processingSteps[stepIndex]}`;
                terminalContent.appendChild(stepElement);
                
                // Scroll to bottom
                terminalContent.scrollTop = terminalContent.scrollHeight;
                
                stepIndex++;
            } else {
                clearInterval(processingInterval);
                completePayment(modal, cart, total);
            }
        }, 800);
    }
    
    function completePayment(modal, cart, total) {
        // Clear cart
        localStorage.removeItem('bobbyCart');
        updateCartCount();
        
        // Show success message
        const terminalContent = modal.querySelector('.terminal-content');
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <p class="terminal-line success">✓ PAYMENT_COMPLETED</p>
            <p class="terminal-line">ORDER_ID: #BOBBY${Date.now()}</p>
            <p class="terminal-line">TOTAL_CHARGED: $${total.toFixed(2)}</p>
            <p class="terminal-line">SHIPPING_TO: CYBERNET_ADDRESS</p>
            <p class="terminal-line">> THANK_YOU_FOR_YOUR_ORDER!</p>
        `;
        
        terminalContent.appendChild(successMessage);
        terminalContent.scrollTop = terminalContent.scrollHeight;
        
        
        // Auto close after 3 seconds
        setTimeout(() => {
            document.body.removeChild(modal);
            showNotification('Order placed successfully! Check your email for confirmation.');
        }, 3000);
    }
    
    function getCart() {
        return JSON.parse(localStorage.getItem('bobbyCart')) || [];
    }
    
    function saveCart(cart) {
        localStorage.setItem('bobbyCart', JSON.stringify(cart));
    }
    
    function updateCartCount() {
        const cart = getCart();
        const cartCount = document.querySelector('.cart-count');
        
        if (cartCount) {
            cartCount.textContent = cart.length;
        }
    }
    
    // Sound functions removed for better user experience
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-text">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add CSS for cart and checkout interfaces
const cartStyles = `
    .cart-item {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }
    
    .cart-item:hover {
        background: rgba(139, 92, 246, 0.05);
    }
    
    .item-info h4 {
        color: var(--text-primary);
        margin-bottom: 0.25rem;
        font-size: 1rem;
    }
    
    .item-details {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    
    .item-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--secondary-bg);
        border-radius: 4px;
        padding: 0.25rem;
    }
    
    .qty-btn {
        background: transparent;
        border: 1px solid var(--accent-purple);
        color: var(--text-primary);
        width: 24px;
        height: 24px;
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }
    
    .qty-btn:hover {
        background: var(--accent-purple);
        box-shadow: 0 0 10px var(--glow-purple);
    }
    
    .quantity {
        color: var(--text-primary);
        font-weight: 600;
        min-width: 20px;
        text-align: center;
    }
    
    .remove-item {
        background: transparent;
        border: 1px solid var(--accent-yellow);
        color: var(--accent-yellow);
        width: 24px;
        height: 24px;
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }
    
    .remove-item:hover {
        background: var(--accent-yellow);
        color: var(--primary-bg);
        box-shadow: 0 0 10px var(--glow-yellow);
    }
    
    .item-total {
        color: var(--accent-yellow);
        font-weight: 600;
        font-size: 1.1rem;
    }
    
    .checkout-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .checkout-content {
        background: var(--primary-bg);
        border: 2px solid var(--accent-purple);
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        transform: scale(0.8);
        transition: transform 0.3s ease;
        box-shadow: 0 0 30px var(--glow-purple);
    }
    
    .checkout-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-color);
    }
    
    .checkout-close {
        background: none;
        border: none;
        color: var(--text-primary);
        font-size: 2rem;
        cursor: pointer;
        transition: color 0.3s ease;
    }
    
    .checkout-close:hover {
        color: var(--accent-yellow);
    }
    
    .terminal-interface {
        background: var(--secondary-bg);
        border-radius: 4px;
        margin: 1.5rem;
        overflow: hidden;
    }
    
    .terminal-header {
        background: var(--primary-bg);
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--border-color);
    }
    
    .terminal-title {
        color: var(--accent-purple);
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
    }
    
    .terminal-content {
        padding: 1rem;
        max-height: 400px;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
    }
    
    .terminal-line {
        color: var(--text-primary);
        margin: 0.25rem 0;
        font-size: 0.9rem;
    }
    
    .terminal-line.success {
        color: var(--accent-yellow);
        text-shadow: 0 0 5px var(--glow-yellow);
    }
    
    .processing-step {
        animation: fadeInUp 0.3s ease;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .payment-form {
        margin-top: 1rem;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    
    .terminal-label {
        display: block;
        color: var(--accent-purple);
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
    }
    
    .terminal-input {
        width: 100%;
        background: var(--primary-bg);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 0.75rem;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        transition: all 0.3s ease;
    }
    
    .terminal-input:focus {
        outline: none;
        border-color: var(--accent-purple);
        box-shadow: 0 0 10px var(--glow-purple);
    }
    
    .process-payment-btn {
        width: 100%;
        margin-top: 1rem;
        padding: 1rem;
        font-size: 1rem;
    }
    
    .success-message {
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid var(--accent-purple);
        border-radius: 4px;
        padding: 1rem;
        margin-top: 1rem;
    }
    
    @keyframes slideOut {
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
    }
    
    @media (max-width: 768px) {
        .cart-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }
        
        .item-controls {
            justify-content: space-between;
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
    }
`;

// Inject cart styles
const cartStyleSheet = document.createElement('style');
cartStyleSheet.textContent = cartStyles;
document.head.appendChild(cartStyleSheet);