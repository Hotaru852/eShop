import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart, 
  faSignOutAlt, 
  faHeadset, 
  faUserCircle,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import useDropdown from '../../hooks/useDropdown';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  
  // Use custom hook for dropdown management with persistence
  // Use a different key based on user role to ensure both regular users and staff have closed dropdowns on login
  const persistKey = isStaff ? 'staffDropdown' : 'userDropdown';
  const { isOpen: dropdownOpen, toggle: toggleDropdown, ref: dropdownRef } = useDropdown(false, null, persistKey);
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to={isStaff ? "/admin/chat" : "/"} className="logo">
            <h1>eShop</h1>
          </Link>
          
          <nav className="nav">
            <ul>
              {!isStaff && (
                <>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/products">Products</Link></li>
                  {isAuthenticated && (
                    <li><Link to="/cart">Cart</Link></li>
                  )}
                </>
              )}
              
              {isStaff && (
                <li>
                  <Link to="/admin/chat" className="staff-link">
                    <FontAwesomeIcon icon={faHeadset} /> Support Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          
          <div className="user-actions">
            {isAuthenticated ? (
              <div className="user-menu" ref={dropdownRef}>
                <button className="user-menu-button" onClick={toggleDropdown}>
                  <FontAwesomeIcon 
                    icon={isStaff ? faHeadset : faUserCircle} 
                    className={isStaff ? "staff-icon" : ""} 
                  /> 
                  <span>{user.username}</span>
                </button>
                
                {dropdownOpen && (
                  <div className="user-dropdown">
                    <button onClick={handleLogout} className="dropdown-item logout-item">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FontAwesomeIcon icon={faSignOutAlt} className="item-icon" />
                        <span>Log out</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="login-btn">Login</Link>
                <Link to="/signup" className="login-btn">Signup</Link>
              </div>
            )}
            
            {isAuthenticated && !isStaff && (
              <Link to="/cart" className="cart-btn">
                <FontAwesomeIcon icon={faShoppingCart} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 