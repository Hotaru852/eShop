import { useContext } from 'react';
import ToastContext from '../context/ToastContext';

/**
 * Custom hook to use the Toast notification system
 * @returns {Object} Toast methods: { showToast, removeToast }
 */
const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

export default useToast; 