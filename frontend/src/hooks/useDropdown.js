import { useState, useRef, useEffect } from 'react';
import uiStorage from '../util/uiStorage';

/**
 * Custom hook for managing dropdown menu state and click-outside behavior
 * @param {boolean} initialState - Initial open/closed state of the dropdown
 * @param {function} onClose - Optional callback to run when dropdown closes
 * @param {string} persistKey - Optional key to persist dropdown state in localStorage
 * @returns {Object} - { isOpen, setIsOpen, toggle, ref } 
 */
const useDropdown = (initialState = false, onClose = null, persistKey = null) => {
  // When initializing, always start with closed dropdown regardless of saved state
  // This ensures dropdown is closed when user first logs in
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  const toggle = () => {
    setIsOpen(prev => {
      const newState = !prev;
      // If we have a persist key, save the state
      if (persistKey) {
        uiStorage.saveState(persistKey, newState);
      }
      return newState;
    });
  };
  
  const handleClose = () => {
    setIsOpen(false);
    // If we have a persist key, save the closed state
    if (persistKey) {
      uiStorage.saveState(persistKey, false);
    }
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handleClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onClose]);
  
  return { isOpen, setIsOpen, toggle, ref };
};

export default useDropdown; 