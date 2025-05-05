/**
 * Utility functions for form validation
 */
const validation = {
  /**
   * Check if a string is a valid email
   * @param {string} email - The email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * Check if a password meets minimum requirements
   * @param {string} password - The password to validate
   * @returns {object} { isValid, message }
   */
  validatePassword: (password) => {
    if (!password || password.length < 8) {
      return { 
        isValid: false, 
        message: 'Password must be at least 8 characters long' 
      };
    }
    
    // Check for at least one number and one letter
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    if (!hasNumber || !hasLetter) {
      return { 
        isValid: false, 
        message: 'Password must contain at least one letter and one number' 
      };
    }
    
    return { isValid: true };
  },
  
  /**
   * Validate that two passwords match
   * @param {string} password - Main password
   * @param {string} confirmPassword - Confirmation password to match
   * @returns {object} { isValid, message }
   */
  passwordsMatch: (password, confirmPassword) => {
    if (password !== confirmPassword) {
      return {
        isValid: false,
        message: 'Passwords do not match'
      };
    }
    return { isValid: true };
  },
  
  /**
   * Validate that a required field has a value
   * @param {string} value - Field value
   * @param {string} fieldName - Name of the field for error message
   * @returns {object} { isValid, message }
   */
  required: (value, fieldName) => {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        message: `${fieldName} is required`
      };
    }
    return { isValid: true };
  },
  
  /**
   * Validate a phone number
   * @param {string} phone - Phone number to validate
   * @returns {object} { isValid, message }
   */
  validatePhone: (phone) => {
    // Allow formats like: (123) 456-7890, 123-456-7890, 1234567890
    const phoneRegex = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
    
    if (!phoneRegex.test(phone)) {
      return {
        isValid: false,
        message: 'Please enter a valid phone number'
      };
    }
    return { isValid: true };
  }
};

export default validation;