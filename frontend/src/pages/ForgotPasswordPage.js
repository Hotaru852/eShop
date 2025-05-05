import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  const { requestPasswordReset, loading } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      const result = await requestPasswordReset(email);
      setSuccess(true);
      setError('');
      
      // In a real app, we wouldn't show this token
      // It's only for demonstration purposes
      if (result.resetToken) {
        setResetToken(result.resetToken);
      }
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Reset Your Password</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        {success ? (
          <div className="auth-success">
            <p>If an account exists with email <strong>{email}</strong>, a password reset link has been sent.</p>
            <p>Please check your email and follow the instructions to reset your password.</p>
            
            {/* This section is only for demo purposes and would not be included in a real app */}
            {resetToken && (
              <div className="demo-reset-token">
                <p><strong>For Demo Purposes Only:</strong></p>
                <p>Use this token to reset your password:</p>
                <code>{resetToken}</code>
                <Link to={`/reset-password?token=${resetToken}`} className="auth-button">
                  Reset Password
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        
        <div className="auth-links">
          <p>
            Remember your password? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 