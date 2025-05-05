import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const LoginPage = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loading } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!usernameOrEmail || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      // For staff demo purposes, check if using the demo credentials
      if (userType === 'staff' && 
          usernameOrEmail === 'support_staff' && 
          password === 'staffpass123') {
        // Use correct credentials format
        await login('support_staff', 'staffpass123', rememberMe);
      } else {
        await login(usernameOrEmail, password, rememberMe);
      }
      // Redirect happens in the auth context
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Login to eShop</h2>
        
        <div className="user-type-toggle">
          <button 
            className={userType === 'customer' ? 'active' : ''} 
            onClick={() => setUserType('customer')}
          >
            Customer
          </button>
          <button 
            className={userType === 'staff' ? 'active' : ''} 
            onClick={() => setUserType('staff')}
          >
            Support Staff
          </button>
        </div>
        
        {userType === 'staff' && (
          <div className="staff-info">
            <p>Staff credentials:</p>
            <p>Username: support_staff</p>
            <p>Password: staffpass123</p>
            <p className="staff-note">Note: Staff accounts are managed by the IT department. Contact them if you need assistance with your account.</p>
          </div>
        )}
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="usernameOrEmail">Username or Email</label>
            <input
              type="text"
              id="usernameOrEmail"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Enter your username or email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            {userType === 'customer' && (
              <Link to="/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
            )}
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {userType === 'customer' && (
          <div className="auth-links">
            <p>
              Don't have an account? <Link to="/signup">Signup</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage; 