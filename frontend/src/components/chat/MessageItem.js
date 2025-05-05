import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import './Chat.css';

/**
 * Reusable component for chat message items
 * Handles different message types (customer, support, system, handoff)
 */
const MessageItem = ({ message }) => {
  const { isCustomer, isSystem, isHandoff, timestamp } = message;
  
  // Create class string based on message properties
  const messageClass = `message ${isCustomer ? 'customer-message' : 'support-message'} ${isHandoff ? 'handoff-message' : ''} ${isSystem ? 'system-message' : ''}`;
  
  return (
    <div className={messageClass}>
      <div className="message-avatar">
        <FontAwesomeIcon icon={faUser} />
      </div>
      <div className="message-content">
        <div className="message-text">{message.message}</div>
        <div className="message-time">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
