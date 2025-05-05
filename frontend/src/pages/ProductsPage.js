import React from 'react';
import ProductList from '../components/product/ProductList';
import './ProductsPage.css';

const ProductsPage = () => {
  return (
    <div className="products-page">
      <div className="products-header">
        <h1>All Products</h1>
        <p>Browse our collection of high-quality products.</p>
      </div>
      
      <ProductList />
    </div>
  );
};

export default ProductsPage; 