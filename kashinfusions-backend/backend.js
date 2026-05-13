console.log("Backend file connected");

// ==================== GLOBAL STATE ====================
let allProducts = [];
let selectedProduct = null;
let cart = [];

// Pricing configuration for customizations
const pricingConfig = {
  sizeOptions: {
    "Select": 0,
    "8oz Tin (+ $7.00)": 7.00,
    "9oz Glass (+ $9.00)": 9.00,
    "10oz Glass (+ $10.00)": 10.00,
    "12oz Glass (+ $10.00)": 10.00
  },
  addonPrice: 0.50 // Color, Scent (except Unscented), Herb all cost $0.50
};

// ==================== PRODUCT INITIALIZATION ====================

// Fetch all products from the database when page loads
async function initializeProducts() {
  try {
    const apiUrl = typeof API_CONFIG !== 'undefined' 
      ? API_CONFIG.endpoint('/products')
      : '/products';
    
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch products");
    
    allProducts = await response.json();
    console.log("✅ Products loaded:", allProducts);
    
    // Auto-populate first product if available
    if (allProducts.length > 0) {
      loadProduct(allProducts[0].id);
    }
  } catch (error) {
    console.error("❌ Error loading products:", error);
  }
}

// Load a specific product and populate the page
function loadProduct(productId) {
  selectedProduct = allProducts.find(p => p.id === productId);
  
  if (!selectedProduct) {
    console.error("Product not found");
    return;
  }
  
  console.log("📦 Selected product:", selectedProduct);
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
  const selections = getCurrentSelections();
  let totalPrice = 0;
  
  // Add size/material price
  totalPrice += pricingConfig.sizeOptions[selections.size] || 0;
  
  // Add color price (if not "None")
  if (selections.color !== "none") {
    totalPrice += pricingConfig.addonPrice;
  }
  
  // Add scent price (all scents except "0" - Unscented cost $0.50)
  if (selections.scent !== "0") {
    totalPrice += pricingConfig.addonPrice;
  }
  
  // Add herb price (if not "None")
  if (selections.herb !== "none") {
    totalPrice += pricingConfig.addonPrice;
  }
  
  return totalPrice;
}

// Update the price display on the page
function updatePriceDisplay() {
  const price = calculatePrice();
  const priceDisplay = document.getElementById("product-price-display");
  
  if (priceDisplay) {
    if (price === 0) {
      priceDisplay.textContent = "Select options to see price";
    } else {
      priceDisplay.textContent = "$" + price.toFixed(2);
    }
  }
  
  console.log("💰 Price updated to: $" + price.toFixed(2));
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

// ==================== CART MANAGEMENT ====================

// Add item to cart
function addToCart() {
  if (!selectedProduct) {
    console.error("❌ No product selected");
    return;
  }
  
  const selections = getCurrentSelections();
  const quantity = parseInt(document.getElementById("quantity")?.value || 1);
  const finalPrice = calculatePrice();
  
  // Validate that user selected a size
  if (selections.size === "Select") {
    alert("Please select a size/material before adding to cart");
    console.warn("⚠️ Size not selected");
    return;
  }
  
  const cartItem = {
    id: selectedProduct.id,
    name: selectedProduct.name,
    quantity: quantity,
    pricePerUnit: finalPrice,
    totalPrice: finalPrice * quantity,
    selections: selections,
    timestamp: new Date().toISOString()
  };
  
  cart.push(cartItem);
  
  // Log final price and cart item
  console.log("✅ Item added to cart!");
  console.log("📦 Final Price: $" + finalPrice.toFixed(2));
  console.log("🛒 Cart Item:", cartItem);
  console.log("🛒 Total Cart Items:", cart.length);
  console.log("🛒 Cart Contents:", cart);
  
  // Visual feedback
  alert(`Added to cart!\n\nPrice: $${finalPrice.toFixed(2)} x ${quantity} = $${(finalPrice * quantity).toFixed(2)}`);
  
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
  initializeProducts();
  setupDropdownListeners();
  
  // Set up add to cart button
  const addToCartBtn = document.getElementById("add-to-cart");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", addToCart);
  }
  
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