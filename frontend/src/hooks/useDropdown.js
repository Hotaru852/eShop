import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook for managing dropdown menu state and click-outside behavior
 * @param {boolean} initialState - Initial open/closed state of the dropdown
 * @param {function} onClose - Optional callback to run when dropdown closes
 * @returns {Object} - { isOpen, setIsOpen, toggle, ref } 
 */
const useDropdown = (initialState = false, onClose = null) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const ref = useRef(null);
  
  const toggle = () => setIsOpen(prev => !prev);
  
  const handleClose = () => {
    setIsOpen(false);
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