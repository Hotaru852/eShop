import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faArrowLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import './Cart.css';

const Cart = () => {
  const { items, total, clearCart } = useCart();
  
  // Check if cart is empty
  const isCartEmpty = items.length === 0;
  
  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1 className="cart-title">
          <FontAwesomeIcon icon={faShoppingCart} />
          Your Shopping Cart
        </h1>
        {!isCartEmpty && (
          <button className="clear-cart-btn" onClick={clearCart}>
            <FontAwesomeIcon icon={faTrash} />
            Clear Cart
          </button>
        )}
      </div>
      
      {isCartEmpty ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <Link to="/products" className="continue-shopping-btn">
            <FontAwesomeIcon icon={faArrowLeft} />
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            <div className="cart-items-header">
              <div className="header-item">Product</div>
              <div className="header-item">Details</div>
              <div className="header-item">Quantity</div>
              <div className="header-item">Subtotal</div>
              <div className="header-item"></div>
            </div>
            
            {items.map(item => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="cart-total">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <div className="cart-actions">
                <Link to="/checkout" className="checkout-btn">
                  Proceed to Checkout
                </Link>
                <Link to="/products" className="continue-shopping-btn">
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart; 