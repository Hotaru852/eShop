import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import chatStorage from '../util/chatStorage';
import uiStorage from '../util/uiStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check for staff user in localStorage first (for testing multiple users)
        const storedStaffUser = localStorage.getItem('staffUser');
        if (storedStaffUser) {
          try {
            const staffUserData = JSON.parse(storedStaffUser);
            // If this is a staff tab, use the stored staff user
            if (window.location.pathname.includes('/admin')) {
              setUser(staffUserData);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error parsing stored staff user:', err);
            // Clear invalid data
            localStorage.removeItem('staffUser');
          }
        }
        
        // Otherwise use normal cookie auth
        const response = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Include cookies
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Login function
  const login = async (usernameOrEmail, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);

      // Clear any chat-related sessions from localStorage
      chatStorage.clearAllChats();

      // Special handling for staff demo credentials
      if (usernameOrEmail === 'support_staff' && password === 'staffpass123') {
        // Create a mock successful response for demo purposes
        const staffUser = {
          id: 999,
          username: 'support_staff',
          role: 'staff'
        };
        
        // Store staff user in localStorage for testing multi-user
        localStorage.setItem('staffUser', JSON.stringify(staffUser));
        
        setUser(staffUser);
        navigate('/admin/chat');
        return { user: staffUser };
      }

      // Check if we're testing with a staff user in a different tab
      const storedStaffUser = localStorage.getItem('staffUser');
      if (storedStaffUser) {
        try {
          // If we have a stored staff user, we need to use normal cookie auth
          // to avoid conflicts
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify({ usernameOrEmail, password, rememberMe }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          setUser(data.user);
          
          // Redirect based on user role
          if (data.user.role === 'staff') {
            navigate('/admin/chat');
          } else {
            navigate('/');
          }

          return data;
        } catch (err) {
          setError(err.message);
          throw err;
        }
      } else {
        // Normal login flow
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies
          body: JSON.stringify({ usernameOrEmail, password, rememberMe }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        setUser(data.user);
        
        // Redirect based on user role
        if (data.user.role === 'staff') {
          navigate('/admin/chat');
        } else {
          navigate('/');
        }

        return data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Clear any chat-related sessions from localStorage using the utility
      chatStorage.clearAllChats();
      
      // Reset any UI state persisted in localStorage
      uiStorage.clearAllState(['chatOpen', 'dropdownOpen', 'userDropdown', 'staffDropdown']);
      
      // Check if we're logging out a staff user
      const isStaffUser = user?.role === 'staff';
      const storedStaffUser = localStorage.getItem('staffUser');
      
      // If we're on the admin page and have a stored staff user
      if (isStaffUser && storedStaffUser && window.location.pathname.includes('/admin')) {
        // Just clear the localStorage staff user
        localStorage.removeItem('staffUser');
        setUser(null);
        navigate('/login');
        return;
      }
      
      // Force disconnect any socket connections
      // This will close connections immediately rather than waiting for timeouts
      if (window.socket) {
        console.log('Disconnecting customer socket during logout');
        window.socket.disconnect();
      }
      
      // Also disconnect admin socket if it exists
      if (window.adminSocket) {
        console.log('Disconnecting admin socket during logout');
        window.adminSocket.disconnect();
      }
      
      // Normal logout via API
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        isAuthenticated: !!user,
        isStaff: user?.role === 'staff',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 