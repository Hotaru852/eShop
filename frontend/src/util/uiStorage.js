/**
 * Utility functions for UI-related localStorage operations
 */
const uiStorage = {
  /**
   * Save UI state to localStorage
   * @param {string} key - The key to save the state under
   * @param {any} value - The value to save
   */
  saveState: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving UI state for ${key}:`, error);
    }
  },
  
  /**
   * Load UI state from localStorage
   * @param {string} key - The key to load the state from
   * @param {any} defaultValue - Default value to return if nothing is stored
   * @returns {any} - The loaded state or default value
   */
  loadState: (key, defaultValue) => {
    try {
      const savedState = localStorage.getItem(key);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error(`Error loading UI state for ${key}:`, error);
    }
    return defaultValue;
  },
  
  /**
   * Clear a specific UI state from localStorage
   * @param {string} key - The key to clear
   */
  clearState: (key) => {
    localStorage.removeItem(key);
  },
  
  /**
   * Clear all UI-related states
   * @param {Array} keys - Array of keys to clear
   */
  clearAllState: (keys) => {
    keys.forEach(key => localStorage.removeItem(key));
  }
};

export default uiStorage; 