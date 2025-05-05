import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Product related API calls
export const productApi = {
  // Get all products
  getAllProducts: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  // Get a single product by ID
  getProduct: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  },
  
  // Get comments for a product
  getProductComments: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}/comments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for product ${productId}:`, error);
      throw error;
    }
  },
  
  // Add a comment to a product
  addComment: async (productId, username, comment) => {
    try {
      const response = await api.post(`/products/${productId}/comments`, {
        username,
        comment
      });
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to product ${productId}:`, error);
      throw error;
    }
  },
  
  // Add a reply to a comment
  addReply: async (commentId, reply, isSystem = false) => {
    try {
      const response = await api.post(`/comments/${commentId}/reply`, {
        reply,
        isSystem
      });
      return response.data;
    } catch (error) {
      console.error(`Error adding reply to comment ${commentId}:`, error);
      throw error;
    }
  }
};

// Order related API calls
export const orderApi = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
};

export default api; 