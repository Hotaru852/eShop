import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import './Chat.css';

/**
 * Reusable component for message input form
 * @param {function} onSendMessage - Function to call when submitting message
 * @param {boolean} disabled - Whether the input should be disabled
 * @param {string} placeholder - Placeholder text for the input
 */
const MessageForm = ({ onSendMessage, disabled = false, placeholder = "Type your message here..." }) => {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() !== '') {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !message.trim()}>
        <FontAwesomeIcon icon={faPaperPlane} />
      </button>
    </form>
  );
};

export default MessageForm; 