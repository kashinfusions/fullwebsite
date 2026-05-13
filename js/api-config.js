// Client-side API configuration
// This dynamically determines the API base URL based on the current environment

const API_CONFIG = {
  // Auto-detect API base URL
  getBaseUrl: function() {
    // If on localhost, use localhost:3000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // If API_BASE_URL is injected by backend, use it
    if (typeof API_BASE_URL !== 'undefined') {
      return API_BASE_URL;
    }
    
    // Otherwise use current domain
    return window.location.origin;
  },

  // Get the API endpoint URL
  endpoint: function(path) {
    return this.getBaseUrl() + path;
  }
};

// Log the configured API base URL
console.log('🔗 API Base URL:', API_CONFIG.getBaseUrl());
