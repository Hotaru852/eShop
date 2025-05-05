/**
 * Authentication module for user management
 * Handles login, signup and session management
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Secret key for JWT token
const JWT_SECRET = process.env.JWT_SECRET || 'eShop-super-secret-key-change-in-production';

// Store password reset tokens
const resetTokens = new Map();

/**
 * Register a new user
 * 
 * @param {Object} db - SQLite database connection
 * @param {Object} userData - User information for registration
 * @return {Promise} Promise resolving to user data (without password)
 */
async function registerUser(db, userData) {
  const { username, email, password, role = 'customer' } = userData;
  
  // Validate input
  if (!username || !email || !password) {
    throw new Error('Username, email and password are required');
  }
  
  // Only allow 'customer' or 'staff' roles
  if (role !== 'customer' && role !== 'staff') {
    throw new Error('Invalid role specified');
  }
  
  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  return new Promise((resolve, reject) => {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
      if (err) {
        return reject(err);
      }
      
      if (row) {
        return reject(new Error('Username or email already in use'));
      }
      
      // Insert new user
      db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, role],
        function(err) {
          if (err) {
            return reject(err);
          }
          
          // Return user data without password
          resolve({
            id: this.lastID,
            username,
            email,
            role
          });
        }
      );
    });
  });
}

/**
 * Log in a user
 * 
 * @param {Object} db - SQLite database connection
 * @param {string} usernameOrEmail - Username or email for login
 * @param {string} password - User password
 * @param {boolean} rememberMe - Whether to extend token expiration
 * @return {Promise} Promise resolving to user data and JWT token
 */
async function loginUser(db, usernameOrEmail, password, rememberMe = false) {
  return new Promise((resolve, reject) => {
    // Find user by username or email
    db.get(
      'SELECT id, username, email, password, role FROM users WHERE username = ? OR email = ?',
      [usernameOrEmail, usernameOrEmail],
      async (err, user) => {
        if (err) {
          return reject(err);
        }
        
        if (!user) {
          return reject(new Error('User not found'));
        }
        
        // Compare password with stored hash
        try {
          const passwordMatch = await bcrypt.compare(password, user.password);
          
          if (!passwordMatch) {
            return reject(new Error('Invalid password'));
          }
          
          // Set token expiration based on rememberMe
          const expiresIn = rememberMe ? '7d' : '24h';
          
          // Generate JWT token
          const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn }
          );
          
          // Return user data without password and token
          resolve({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
            },
            token,
            expiresIn
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Generate a password reset token
 * 
 * @param {Object} db - SQLite database connection
 * @param {string} email - User email
 * @return {Promise} Promise resolving to the reset token
 */
async function generateResetToken(db, email) {
  return new Promise((resolve, reject) => {
    // Find user by email
    db.get('SELECT id, username FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return reject(err);
      }
      
      if (!user) {
        return reject(new Error('No account found with that email'));
      }
      
      // Generate a random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Store the token with an expiration time (1 hour)
      resetTokens.set(resetToken, {
        userId: user.id,
        expires: Date.now() + 3600000, // 1 hour in milliseconds
      });
      
      resolve({ resetToken, username: user.username });
    });
  });
}

/**
 * Reset user password using a token
 * 
 * @param {Object} db - SQLite database connection
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @return {Promise} Promise resolving when password is reset
 */
async function resetPassword(db, token, newPassword) {
  return new Promise(async (resolve, reject) => {
    // Check if token exists and is valid
    const tokenData = resetTokens.get(token);
    
    if (!tokenData || tokenData.expires < Date.now()) {
      resetTokens.delete(token);
      return reject(new Error('Invalid or expired reset token'));
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password
    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, tokenData.userId],
      (err) => {
        if (err) {
          return reject(err);
        }
        
        // Remove the used token
        resetTokens.delete(token);
        resolve({ success: true });
      }
    );
  });
}

/**
 * Middleware to authenticate JWT token
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function authenticateToken(req, res, next) {
  // Get token from Authorization header or cookie
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.cookies?.authToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
}

/**
 * Middleware to check if user has staff role
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requireStaffRole(req, res, next) {
  if (!req.user || req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Access denied. Staff role required.' });
  }
  
  next();
}

module.exports = {
  registerUser,
  loginUser,
  authenticateToken,
  requireStaffRole,
  generateResetToken,
  resetPassword
}; 