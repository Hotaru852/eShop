/**
 * Utility functions for cart localStorage operations
 */
const cartStorage = {
  /**
   * Save cart state to localStorage
   * @param {Object} cartState - The cart state to save
   */
  saveCart: (cartState) => {
    localStorage.setItem('cart', JSON.stringify(cartState));
  },
  
  /**
   * Load cart state from localStorage
   * @param {Object} initialState - Default state to return if nothing is stored
   * @returns {Object} - The cart state
   */
  loadCart: (initialState) => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    return initialState;
  },
  
  /**
   * Clear cart data from localStorage
   */
  clearCart: () => {
    localStorage.removeItem('cart');
  }
};

export default cartStorage; 