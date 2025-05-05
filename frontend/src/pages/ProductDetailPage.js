import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import ProductDetail from '../components/product/ProductDetail';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  return (
    <div className="product-detail-page">
      <div className="back-to-products">
        <Link to="/products" className="back-link">
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Products
        </Link>
      </div>
      
      <ProductDetail />
    </div>
  );
};

export default ProductDetailPage; 