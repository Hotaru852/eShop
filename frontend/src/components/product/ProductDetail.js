import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faStar } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';
import { productApi } from '../../services/api';
import CommentSection from './CommentSection';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productApi.getProduct(id);
        setProduct(data);
        setError(null);
      } catch (err) {
        setError('Failed to load product details. Please try again later.');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.stock || 0)) {
      setQuantity(value);
    }
  };
  
  const handleAddToCart = () => {
    if (product) {
      // Add to cart multiple times based on quantity
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
    }
  };
  
  if (loading) {
    return <div className="loading">Loading product details...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (!product) {
    return <div className="not-found">Product not found.</div>;
  }
  
  return (
    <div className="product-detail">
      <div className="product-detail-grid">
        <div className="product-image-large">
          <img src={product.imageUrl} alt={product.name} />
        </div>
        
        <div className="product-info-detailed">
          <h1 className="product-title">{product.name}</h1>
          <p className="product-price">${product.price.toFixed(2)}</p>
          
          <div className="product-stock">
            <span className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </span>
          </div>
          
          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
          
          <div className="product-actions">
            <div className="quantity-control">
              <label htmlFor="quantity">Quantity:</label>
              <input
                type="number"
                id="quantity"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={product.stock <= 0}
              />
            </div>
            
            <button 
              className="add-to-cart-btn-large" 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
      
      <div className="product-comments-section">
        <CommentSection productId={id} />
      </div>
    </div>
  );
};

export default ProductDetail; 