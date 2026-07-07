console.log("Backend file connected");

// ==================== PRODUCT PRICING CONFIGURATIONS ====================

// Define pricing for each product type
const productPricingConfigs = {
  classic_candles: {
    productName: "Classic Candles",
    productImage: "images/classic_candles.jpg",
    basePrice: 0, // Size is required, so no base
    sizeOptions: {
      "Select": 0,
      "8oz Tin (+ $7.00)": 7.00,
      "9oz Glass (+ $9.00)": 9.00,
      "10oz Glass (+ $10.00)": 10.00,
      "12oz Glass (+ $10.00)": 10.00
    },
    addonPrice: 0.50,
    requiresSize: true
  },
  artistic_candles: {
    productName: "Artistic Candles",
    productImage: "images/artistic_candles.jpg",
    basePrice: 15.00,
    sizeOptions: {}, // No size option
    addonPrice: 0.50,
    requiresSize: false
  },
  wax_melts: {
    productName: "Wax Melts",
    productImage: "images/wax_melts.jpg",
    basePrice: 0,
    sizeOptions: {
      "Select": 0,
      "Sampler (+ $4.00)": 4.00,
      "Single Melt (+ $4.50)": 4.50,
      "Pack of 6 (+ $5.50)": 5.50
    },
    addonPrice: 0.50,
    requiresSize: true
  },
  essential_oils: {
    productName: "Essential Oils",
    productImage: "images/essential_oils.jpg",
    basePrice: 12.00,
    sizeOptions: {
      "5ml (+ $12.00)": 12.00,
      "10ml (+ $18.00)": 18.00
    },
    addonPrice: 0, // Only scent, no color/herb add-ons
    requiresSize: true
  }
};

// Determine current product from page filename
function getCurrentProduct() {
  const filename = window.location.pathname.split('/').pop().replace('.html', '');
  return filename || 'classic_candles';
}

// Get the pricing config for the current page
function getPricingConfig() {
  const product = getCurrentProduct();
  return productPricingConfigs[product] || productPricingConfigs.classic_candles;
}

// Pricing configuration for customizations
const pricingConfig = getPricingConfig();

// Create a local fallback product object when API loading fails
function getFallbackProduct() {
  const slug = getCurrentProduct();
  const config = getPricingConfig();

  return {
    id: slug,
    name: config.productName,
    price: config.basePrice,
    description: `${config.productName} - custom order`,
    image_url: config.productImage,
    stock: 999,
    slug
  };
}

function applyFallbackProduct() {
  const fallback = getFallbackProduct();
  allProducts = [fallback];
  selectedProduct = fallback;
  console.warn("⚠️ Using local pricing fallback for this product page.");
  console.log("📦 Fallback product loaded:", selectedProduct);
  updatePriceDisplay();
  return fallback;
}

// ==================== GLOBAL STATE ====================
let allProducts = [];
let selectedProduct = null;
let cart = [];

// ==================== PRODUCT INITIALIZATION ====================

// Fetch all products from the database when page loads
async function initializeProducts() {
  try {
    const apiUrl = typeof API_CONFIG !== 'undefined' 
      ? API_CONFIG.endpoint('/products')
      : '/products';
    
    const response = await fetch(apiUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Products endpoint returned ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No products returned");
    }

    allProducts = data;
    console.log("✅ Products loaded:", allProducts);

    // Auto-populate the current product if available, otherwise use first or fallback
    const currentSlug = getCurrentProduct();
    const matchedProduct = allProducts.find(p => p.slug === currentSlug || `${p.id}` === currentSlug || p.name?.toLowerCase().includes(currentSlug.replace(/_/g, ' ')));
    if (matchedProduct) {
      loadProduct(matchedProduct.id);
    } else {
      console.warn("⚠️ Current product not found in API response, using first available product.");
      loadProduct(allProducts[0].id);
    }
  } catch (error) {
    console.warn("⚠️ Products API unavailable, using local pricing fallback:", error.message || error);
    applyFallbackProduct();
  }
}

// Load a specific product and populate the page
function loadProduct(productId) {
  selectedProduct = allProducts.find(p => p.id === productId);
  
  if (!selectedProduct) {
    console.warn("⚠️ Product not found; using fallback product.");
    selectedProduct = getFallbackProduct();
    if (!allProducts.some(p => p.id === selectedProduct.id)) {
      allProducts.push(selectedProduct);
    }
  }
  
  console.log("📦 Selected product:", selectedProduct);
  updatePriceDisplay();
}

// ==================== DYNAMIC PRICING ====================

// Get current selections from all dropdowns
function getCurrentSelections() {
  const sizeDropdown = document.getElementById("size-select-dropdown");
  const colorDropdown = document.getElementById("color-select");
  const scentDropdown = document.getElementById("scent-select");
  const herbDropdown = document.getElementById("herb-select");
  
  return {
    size: sizeDropdown ? sizeDropdown.value : "Select",
    color: colorDropdown ? colorDropdown.value : "none",
    scent: scentDropdown ? scentDropdown.value : "Unscented",
    herb: herbDropdown ? herbDropdown.value : "none"
  };
}

// Calculate total price based on selections
function calculatePrice() {
  const config = getPricingConfig();
  const selections = getCurrentSelections();
  let totalPrice = 0;
  
  // Add base price
  totalPrice += config.basePrice;
  
  // Add size/material price (if applicable)
  if (Object.keys(config.sizeOptions).length > 0) {
    totalPrice += config.sizeOptions[selections.size] || 0;
  }
  
  // Add color price (if not "None" and addon price applies)
  if (config.addonPrice > 0 && selections.color !== "none") {
    totalPrice += config.addonPrice;
  }
  
  // Add scent price (all scents except "0" - Unscented cost addon price)
  if (config.addonPrice > 0 && selections.scent !== "0") {
    totalPrice += config.addonPrice;
  }
  
  // Add herb price (if not "None" and addon price applies)
  if (config.addonPrice > 0 && selections.herb !== "none") {
    totalPrice += config.addonPrice;
  }
  
  return totalPrice;
}

// Update the price display on the page
function updatePriceDisplay() {
  const config = getPricingConfig();
  const price = calculatePrice();
  const priceDisplay = document.getElementById("product-price-display");
  
  if (priceDisplay) {
    // Check if required selections are missing
    const selections = getCurrentSelections();
    const missingSizeSelection = config.requiresSize && selections.size === "Select";
    
    if (price === 0 || missingSizeSelection) {
      priceDisplay.textContent = "Select options to see price";
    } else {
      priceDisplay.textContent = "$" + price.toFixed(2);
    }
  }
  
  console.log("💰 Current config:", config.productName, "| Price: $" + price.toFixed(2));
}

// Set up event listeners for all dropdowns
function setupDropdownListeners() {
  const dropdowns = [
    document.getElementById("size-select-dropdown"),
    document.getElementById("color-select"),
    document.getElementById("scent-select"),
    document.getElementById("herb-select")
  ];
  
  dropdowns.forEach(dropdown => {
    if (dropdown) {
      dropdown.addEventListener("change", updatePriceDisplay);
    }
  });
  
  console.log("✅ Dropdown listeners set up");
}

// ==================== CART PERSISTENCE ====================

// Save cart to localStorage
function saveCartToStorage() {
  localStorage.setItem('kashinfusions_cart', JSON.stringify(cart));
  console.log("💾 Cart saved to storage");
}

// Load cart from localStorage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('kashinfusions_cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
      console.log("📂 Cart loaded from storage:", cart);
    } catch (error) {
      console.error("❌ Error loading cart from storage:", error);
      cart = [];
    }
  }
}

// Clear cart storage (used on checkout)
function clearCartStorage() {
  localStorage.removeItem('kashinfusions_cart');
  cart = [];
  console.log("🗑️ Cart cleared");
}

// ==================== CART DISPLAY ====================

// Render cart items in the offcanvas cart
function renderCart() {
  const cartBody = document.querySelector("#offcanvasCart .offcanvas-body");
  if (!cartBody) return;
  
  // Clear previous content
  cartBody.innerHTML = '';
  
  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="text-center py-5">
        <h5 class="text-muted">Your cart is empty</h5>
        <p class="text-body-secondary">Add items to get started!</p>
      </div>
    `;
    return;
  }
  
  const cartTotal = getCartTotal();
  
  let html = `
    <div class="order-md-last">
      <h2 class="mb-4">Your Cart</h2>
      <div class="cart-items-container" style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
  `;
  
  // Add each cart item
  cart.forEach((item, index) => {
    const selections = item.selections;
    let description = [];
    
    if (selections.size && selections.size !== "Select") {
      description.push(selections.size.split('(')[0].trim());
    }
    if (selections.color && selections.color !== "none") {
      description.push(selections.color);
    }
    if (selections.scent && selections.scent !== "0" && selections.scent !== "Unscented") {
      description.push('Scent: ' + selections.scent);
    }
    if (selections.herb && selections.herb !== "none") {
      description.push(selections.herb);
    }
    
    html += `
      <div class="card mb-3" style="border: 1px solid #ddd;">
        <div class="card-body p-3">
          <div class="row">
            <div class="col-md-4 col-sm-4">
              <img src="${item.productImage}" alt="${item.name}" class="img-fluid rounded" style="width: 100%; height: auto;">
            </div>
            <div class="col-md-8 col-sm-8">
              <h5 class="card-title mb-2">${item.name}</h5>
              <p class="text-body-secondary mb-2" style="font-size: 0.9em;">
                ${description.length > 0 ? description.join(' • ') : 'Standard options'}
              </p>
              <div class="d-flex justify-content-between mb-2">
                <span><strong>Price per unit:</strong> $${item.pricePerUnit.toFixed(2)}</span>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span><strong>Quantity:</strong> ${item.quantity}</span>
                <span><strong>Subtotal:</strong> $${item.totalPrice.toFixed(2)}</span>
              </div>
              <button type="button" class="btn btn-sm btn-outline-danger w-100" onclick="removeFromCart(${index})">
                Remove from Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      <hr class="my-3">
      <div class="cart-summary mb-4">
        <div class="d-flex justify-content-between mb-3">
          <h4>Cart Total</h4>
          <h4 class="text-primary">$${cartTotal.toFixed(2)}</h4>
        </div>
        <p class="text-body-secondary text-center mb-3">Items in cart: <strong>${cart.length}</strong></p>
      </div>
      <a href="checkout.html" class="w-100 btn btn-primary btn-lg">Continue to Checkout</a>
    </div>
  `;
  
  cartBody.innerHTML = html;
  console.log("🛒 Cart rendered with " + cart.length + " items");
}

// Remove item from cart
function removeFromCart(index) {
  const removedItem = cart[index];
  cart.splice(index, 1);
  saveCartToStorage();
  renderCart();
  updateCartBadge();
  console.log("🗑️ Removed item:", removedItem.name, "| Cart now has", cart.length, "items");
}

// Update cart badge count in navigation and offcanvas
function updateCartBadge() {
  // Get total number of items (accounting for quantities)
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  // Update navigation cart counter
  const cartCountSpan = document.getElementById("cart-count");
  if (cartCountSpan) {
    cartCountSpan.textContent = `(${cartItemCount})`;
  }
  
  // Update badges inside offcanvas
  const badges = document.querySelectorAll("#offcanvasCart .badge");
  badges.forEach(badge => {
    badge.textContent = cartItemCount;
  });
  
  console.log("📊 Cart badge updated: " + cartItemCount + " items");
}

// ==================== CART MANAGEMENT ====================

// Add item to cart
function addToCart() {
  const config = getPricingConfig();
  
  if (!selectedProduct) {
    console.error("❌ No product selected");
    return;
  }
  
  const selections = getCurrentSelections();
  const quantity = parseInt(document.getElementById("quantity")?.value || 1);
  const finalPrice = calculatePrice();
  
  // Validate that user selected a size if required
  if (config.requiresSize && selections.size === "Select") {
    alert("Please select a size before adding to cart");
    console.warn("⚠️ Size not selected");
    return;
  }
  
  const cartItem = {
    id: selectedProduct.id,
    name: config.productName,
    productImage: config.productImage,
    quantity: quantity,
    pricePerUnit: finalPrice,
    totalPrice: finalPrice * quantity,
    selections: selections,
    timestamp: new Date().toISOString()
  };
  
  cart.push(cartItem);
  
  // Save cart to localStorage
  saveCartToStorage();
  
  // Log final price and cart item
  console.log("✅ Item added to cart!");
  console.log("📦 Final Price: $" + finalPrice.toFixed(2));
  console.log("🛒 Cart Item:", cartItem);
  console.log("🛒 Total Cart Items:", cart.length);
  console.log("🛒 Cart Contents:", cart);
  
  // Update cart display
  renderCart();
  updateCartBadge();
  
  // Visual feedback
  alert(`✅ Added to cart!\n\n${config.productName}\nPrice: $${finalPrice.toFixed(2)} x ${quantity} = $${(finalPrice * quantity).toFixed(2)}`);
  
  // Reset quantity
  const quantityInput = document.getElementById("quantity");
  if (quantityInput) {
    quantityInput.value = 1;
  }
}

// Get cart contents
function getCart() {
  return cart;
}

// Get cart total
function getCartTotal() {
  return cart.reduce((total, item) => total + item.totalPrice, 0);
}

// ==================== DOM INITIALIZATION ====================

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Load cart from storage first
  loadCartFromStorage();
  
  initializeProducts();
  setupDropdownListeners();
  
  // Set up add to cart button
  const addToCartBtn = document.getElementById("add-to-cart");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", addToCart);
  }
  
  // Render initial cart state
  renderCart();
  updateCartBadge();
  
  console.log("✅ Backend initialized and ready");
});

// ==================== UTILITY FUNCTIONS ====================

// Get product data by ID
function getProductData(productId) {
  return allProducts.find(p => p.id === productId);
}

// Get all product prices for checkout
function getAllProductPrices() {
  return allProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price
  }));
}