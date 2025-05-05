import React from 'react';
import { Link } from 'react-router-dom';
import ProductList from '../components/product/ProductList';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to eShop</h1>
          <p>Discover the best products for your needs.</p>
          <Link to="/products" className="shop-now-btn">
            Shop Now
          </Link>
        </div>
      </div>
      
      <div className="featured-products">
        <ProductList />
      </div>
    </div>
  );
};

export default HomePage; 