import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

/**
 * Component that displays admin user info in the top right corner
 * For staff accounts only
 */
const AdminUserInfo = () => {
  const { user, isStaff } = useAuth();
  
  if (!isStaff || !user) return null;
  
  return (
    <div className="admin-user-info">
      <FontAwesomeIcon icon={faHeadset} />
      <span>{user.username}</span>
    </div>
  );
};

export default AdminUserInfo; 