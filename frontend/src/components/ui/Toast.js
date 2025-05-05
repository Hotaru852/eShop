import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faInfoCircle, faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import './Toast.css';

/**
 * Toast component for displaying notifications
 * Use the useToast hook to show toast messages from any component
 */
const Toast = forwardRef((props, ref) => {
  const [toasts, setToasts] = useState([]);
  
  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    showToast: (message, type = 'info', duration = 3000) => {
      const id = Date.now();
      const newToast = { id, message, type, duration };
      setToasts(prev => [...prev, newToast]);
      
      // Auto-remove toast after duration
      setTimeout(() => {
        removeToast(id);
      }, duration);
      
      return id;
    },
    removeToast
  }));
  
  // Remove a toast by ID
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Map of icons for different toast types
  const icons = {
    success: faCheck,
    info: faInfoCircle,
    warning: faExclamationTriangle,
    error: faExclamationTriangle
  };
  
  // Create portal to render toasts at the top level of the DOM
  return createPortal(
    <div className="toast-container">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`toast toast-${toast.type}`}
        >
          <div className="toast-icon">
            <FontAwesomeIcon icon={icons[toast.type] || icons.info} />
          </div>
          <div className="toast-content">{toast.message}</div>
          <button 
            className="toast-close" 
            onClick={() => removeToast(toast.id)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
});

Toast.displayName = 'Toast';

export default Toast; 