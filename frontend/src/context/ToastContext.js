import React, { createContext, useRef } from 'react';
import Toast from '../components/ui/Toast';

// Create context
const ToastContext = createContext(null);

/**
 * Provider component that wraps app and makes toast functions available to all children
 */
export const ToastProvider = ({ children }) => {
  const toastRef = useRef(null);
  
  /**
   * Show a toast notification
   * @param {string} message - Content of the toast
   * @param {string} type - Type of toast: 'success', 'info', 'warning', 'error'
   * @param {number} duration - Time in ms before toast auto-dismisses
   * @returns {number} Toast ID that can be used to dismiss it
   */
  const showToast = (message, type = 'info', duration = 3000) => {
    return toastRef.current?.showToast(message, type, duration);
  };
  
  /**
   * Manually remove a toast by ID
   * @param {number} id - Toast ID
   */
  const removeToast = (id) => {
    toastRef.current?.removeToast(id);
  };
  
  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <Toast ref={toastRef} />
    </ToastContext.Provider>
  );
};

export default ToastContext; 