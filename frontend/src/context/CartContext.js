import React, { createContext, useContext, useReducer, useEffect } from 'react';
import cartStorage from '../util/cartStorage';

const CartContext = createContext();

// Initial state
const initialState = {
  items: [],
  total: 0
};

// Reducer function
const cartReducer = (state, action) => {
  let newState;
  
  switch (action.type) {
    case 'ADD_ITEM':
      // Check if the item already exists in the cart
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex !== -1) {
        // If item exists, update its quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        
        newState = {
          ...state,
          items: updatedItems,
          total: state.total + action.payload.price
        };
      } else {
        // If item doesn't exist, add it to cart with quantity 1
        newState = {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }],
          total: state.total + action.payload.price
        };
      }
      break;
      
    case 'REMOVE_ITEM':
      // Find the item to remove
      const itemToRemove = state.items.find(item => item.id === action.payload);
      
      // If item exists, update the state
      if (itemToRemove) {
        newState = {
          ...state,
          items: state.items.filter(item => item.id !== action.payload),
          total: state.total - (itemToRemove.price * itemToRemove.quantity)
        };
      } else {
        newState = state;
      }
      break;
      
    case 'UPDATE_QUANTITY':
      // Find the item to update
      const itemToUpdateIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (itemToUpdateIndex !== -1) {
        const item = state.items[itemToUpdateIndex];
        const quantityDiff = action.payload.quantity - item.quantity;
        
        const updatedItems = [...state.items];
        updatedItems[itemToUpdateIndex] = {
          ...item,
          quantity: action.payload.quantity
        };
        
        newState = {
          ...state,
          items: updatedItems,
          total: state.total + (quantityDiff * item.price)
        };
      } else {
        newState = state;
      }
      break;
      
    case 'CLEAR_CART':
      newState = initialState;
      break;
      
    default:
      newState = state;
  }
  
  // Save to localStorage using utility
  cartStorage.saveCart(newState);
  
  return newState;
};

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    cartReducer, 
    initialState, 
    () => cartStorage.loadCart(initialState)
  );
  
  // Calculate total whenever items change
  useEffect(() => {
    // This ensures the total is always correct, even if there was an issue with calculations
    const newTotal = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    if (newTotal !== state.total) {
      dispatch({
        type: 'SET_TOTAL',
        payload: newTotal
      });
    }
  }, [state.items, state.total]);
  
  // Function to add item to cart
  const addToCart = (product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: product
    });
  };
  
  // Function to remove item from cart
  const removeFromCart = (productId) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: productId
    });
  };
  
  // Function to update item quantity
  const updateQuantity = (productId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: {
        id: productId,
        quantity
      }
    });
  };
  
  // Function to clear cart
  const clearCart = () => {
    dispatch({
      type: 'CLEAR_CART'
    });
    
    // Also clear from localStorage
    cartStorage.clearCart();
  };
  
  return (
    <CartContext.Provider value={{
      items: state.items,
      total: state.total,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
};

export default CartContext; 