import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset, faComments, faUsers, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import './AdminWelcome.css';

/**
 * Welcome component for the admin support dashboard
 * Displays when no active chat is selected
 */
const AdminWelcome = () => {
  return (
    <div className="admin-welcome">
      <div className="welcome-icon">
        <FontAwesomeIcon icon={faHeadset} />
      </div>
      
      <h2>Welcome to the Support Dashboard</h2>
      <p>Select a customer conversation from the sidebar to provide support</p>
      
      <div className="support-tips">
        <h3>Support Tips</h3>
        
        <div className="tip-grid">
          <div className="tip-card">
            <FontAwesomeIcon icon={faComments} />
            <h4>Clear Communication</h4>
            <p>Use simple language and avoid technical jargon when assisting customers.</p>
          </div>
          
          <div className="tip-card">
            <FontAwesomeIcon icon={faUsers} />
            <h4>Customer Experience</h4>
            <p>Focus on making the customer feel valued and heard throughout the interaction.</p>
          </div>
          
          <div className="tip-card">
            <FontAwesomeIcon icon={faLightbulb} />
            <h4>Problem Solving</h4>
            <p>Identify the root cause of issues to provide effective and lasting solutions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWelcome; 