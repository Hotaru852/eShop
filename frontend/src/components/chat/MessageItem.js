import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import './Chat.css';

/**
 * Reusable component for chat message items
 * Handles different message types (customer, support, system, handoff)
 */
const MessageItem = ({ message }) => {
  // Check for missing or invalid message object
  if (!message || typeof message !== 'object') {
    console.error('Invalid message object received:', message);
    return <div className="message error-message">Error: Invalid message data</div>;
  }
  
  const { isCustomer, isSystem, isHandoff, timestamp, username, message: messageText } = message;
  
  // Validate required message properties
  if (!messageText) {
    console.error('Message is missing text content:', message);
    return <div className="message error-message">Error: Message has no content</div>;
  }
  
  // In the admin view, we want to flip the alignment:
  // - Staff messages appear as "customer-message" (right aligned)
  // - Customer messages appear as "support-message" (left aligned)
  const isAdminView = window.location.pathname.includes('/admin');
  
  // Detect staff status change messages (join/leave)
  const isStaffStatusMessage = isSystem && 
    (messageText.includes("has joined the chat") || 
     messageText.includes("has left the chat") || 
     messageText.includes("has ended this support session"));
  
  // Detect handoff message more reliably
  const isHandoffMessage = 
    isHandoff || 
    (username === "AI Assistant" && messageText.includes("connecting you with a customer service representative")) ||
    (username === "AI Assistant" && messageText.includes("experiencing some frustration")) ||
    (messageText.includes("will be with you shortly"));
  
  // For admin view, invert the message classes
  const messageClass = isAdminView
    ? `message ${!isCustomer ? 'customer-message' : 'support-message'} ${isHandoffMessage ? 'handoff-message' : ''} ${isSystem ? 'system-message' : ''}`
    : `message ${isCustomer ? 'customer-message' : 'support-message'} ${isHandoffMessage ? 'handoff-message' : ''} ${isSystem ? 'system-message' : ''}`;
  
  // Determine display name
  const displayName = username || (isCustomer ? 'Customer' : isSystem ? 'System' : 'Support');
  
  // Format timestamp
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  
  return (
    <div className={`${messageClass} ${isStaffStatusMessage ? 'staff-status-message' : ''}`}>
      <div className="message-avatar">
        <FontAwesomeIcon icon={faUser} />
      </div>
      <div className="message-content">
        <div className="message-sender">{displayName}</div>
        <div className="message-text">{messageText}</div>
        <div className="message-time">
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
