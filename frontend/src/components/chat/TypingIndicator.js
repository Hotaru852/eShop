import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import './Chat.css';

/**
 * Reusable typing indicator component for chat interfaces
 * Shows animated dots to indicate the other party is typing
 */
const TypingIndicator = ({ isTyping, showAvatar = true }) => {
  if (!isTyping) return null;
  
  return (
    <div className="message support-message typing-indicator">
      {showAvatar && (
        <div className="message-avatar">
          <FontAwesomeIcon icon={faUser} />
        </div>
      )}
      <div className="message-content">
        <div className="message-text">
          <span className="dot dot-1"></span>
          <span className="dot dot-2"></span>
          <span className="dot dot-3"></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator; 