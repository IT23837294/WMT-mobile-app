/**
 * ===========================================
 * AuthContext.jsx - AUTHENTICATION STATE MANAGEMENT
 * ===========================================
 * 
 * PURPOSE: Provides global authentication state using React Context API.
 * This allows any component to access user data and auth functions without
 * prop drilling (passing props through multiple components).
 * 
 * KEY CONCEPTS:
 * - React Context API for global state
 * - localStorage for JWT token persistence
 * - Axios interceptors for automatic token attachment
 * - useEffect for checking auth status on app load
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// ===========================================
// CREATE AUTH CONTEXT
// This creates a context object that components can subscribe to
// ===========================================
const AuthContext = createContext();

const getRequestErrorMessage = (error, fallbackMessage) => {
  if (!error.response) {
    return 'Cannot connect to the server. Please make sure the backend and database are running.';
  }

  const serverMessage = error.response?.data?.message;

  if (serverMessage) {
    return serverMessage;
  }

  if (error.response.status >= 500) {
    return 'Server error. Please check the backend database connection and try again.';
  }

  return fallbackMessage;
};

// ===========================================
// useAuth HOOK
// Custom hook to easily access auth context in any component
// Usage: const { user, login, logout } = useAuth();
// ===========================================
export const useAuth = () => useContext(AuthContext);

// ===========================================
// AuthProvider COMPONENT
// Wraps the app and provides auth state to all children
// Used in main.jsx: <AuthProvider><App /></AuthProvider>
// ===========================================
export const AuthProvider = ({ children }) => {
  // ===========================================
  // STATE VARIABLES
  // ===========================================
  // user: stores logged in user data (name, email, role, etc.)
  const [user, setUser] = useState(null);
  
  // loading: true while checking if user is already logged in
  // Used to show loading spinner in App.jsx
  const [loading, setLoading] = useState(true);
  
  // isAuthenticated: boolean flag for auth status
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ===========================================
  // useEffect: CHECK AUTH STATUS ON APP LOAD
  // Runs once when app starts (empty dependency array [])
  // ===========================================
  useEffect(() => {
    // Check if token exists in localStorage (from previous session)
    const token = localStorage.getItem('token');
    if (token) {
      // Set default authorization header for all axios requests
      // This attaches JWT to every API call automatically
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user data using the token
      fetchUser();
    } else {
      // No token found, user is not logged in
      setLoading(false);
    }
  }, []);

  // ===========================================
  // FETCH USER DATA
  // Called on app load (if token exists) to get current user info
  // ===========================================
  const fetchUser = async () => {
    try {
      // GET request to /api/auth/me (protected route)
      // Server verifies JWT and returns user data
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user:', error);
      // Token is invalid or expired - clear everything
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      // Always set loading to false when done
      setLoading(false);
    }
  };

  // ===========================================
  // LOGIN FUNCTION
  // Authenticates user with email/password
  // Called from Login.jsx: login(email, password)
  // ===========================================
  const login = async (email, password, options = {}) => {
    try {
      // POST to /api/auth/login with credentials
      const response = await axios.post('/api/auth/login', { email, password, ...options });
      const { token, user } = response.data;
      
      // Store JWT token in localStorage (persists across page refreshes)
      localStorage.setItem('token', token);
      
      // Set token in axios headers for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state with user data
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getRequestErrorMessage(error, 'Login failed')
      };
    }
  };

  // ===========================================
  // REGISTER FUNCTION
  // Creates new user account
  // Similar to login but calls /api/auth/register
  // ===========================================
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      // Same process as login: store token, set headers, update state
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getRequestErrorMessage(error, 'Registration failed')
      };
    }
  };

  // ===========================================
  // LOGOUT FUNCTION
  // Clears all auth data and logs user out
  // Called from Layout.jsx when clicking logout button
  // ===========================================
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Remove authorization header from axios
    delete axios.defaults.headers.common['Authorization'];
    // Clear user state
    setUser(null);
    setIsAuthenticated(false);
  };

  // ===========================================
  // UPDATE PROFILE FUNCTION
  // Updates user profile information
  // Called from Profile.jsx when saving changes
  // ===========================================
  const updateProfile = async (userData) => {
    try {
      // PUT request to update profile
      const response = await axios.put('/api/auth/profile', userData);
      // Update user state with new data
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getRequestErrorMessage(error, 'Update failed')
      };
    }
  };

  // ===========================================
  // CONTEXT VALUE
  // Object containing all state and functions to be shared
  // Any component using useAuth() gets access to these
  // ===========================================
  const value = {
    // Current user data (e.g. name, email, role)
    user, 
    // Boolean flag indicating whether user is logged in
    isAuthenticated, 
    // Boolean flag indicating whether auth is being checked
    loading, 
    // Function to log in user with email/password
    login, 
    // Function to register new user
    register, 
    // Function to log out user
    logout, 
    // Function to update user profile information
    updateProfile, 
    // Function to manually refresh user data
    fetchUser 
  };

  // ===========================================
  // RENDER: Provide context to all children
  // ===========================================
  // This is where the magic happens - we're providing the AuthContext
  // to all components that are wrapped by AuthProvider.
  // This allows them to access the auth state and functions using the useAuth hook.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export AuthProvider for use in main.jsx
