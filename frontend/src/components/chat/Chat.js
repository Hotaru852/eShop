import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faComments } from '@fortawesome/free-solid-svg-icons';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import MessageForm from './MessageForm';
import './Chat.css';

const Chat = () => {
  const { 
    messages, 
    sendMessage, 
    toggleChat, 
    isTyping, 
    waitingForHuman, 
    chatOpen,
    clearChat 
  } = useChat();
  const { isAuthenticated } = useAuth();
  const [isChatVisible, setIsChatVisible] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Reset chat visibility state when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      setIsChatVisible(false);
    }
  }, [isAuthenticated]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle chat button click
  const handleChatButtonClick = () => {
    if (isAuthenticated) {
      toggleChat();
    } else {
      // If not authenticated, show login prompt
      setIsChatVisible(true);
    }
  };
  
  // Close the chat notification for unauthenticated users
  const closeNotification = () => {
    setIsChatVisible(false);
  };
  
  return (
    <>
      {/* Chat button */}
      <button className="chat-button" onClick={handleChatButtonClick}>
        <FontAwesomeIcon icon={faComments} />
      </button>
      
      {/* Login notification for unauthenticated users */}
      {!isAuthenticated && isChatVisible && (
        <div className="chat-login-prompt">
          <button className="close-prompt" onClick={closeNotification}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <p>Please log in to use the chat feature</p>
          <Link to="/login" className="login-button">Login</Link>
        </div>
      )}
      
      {/* Main chat window - only shown when authenticated and open */}
      {isAuthenticated && chatOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <h3>Customer Support</h3>
            <button className="close-chat-btn" onClick={toggleChat}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 ? (
              null // No fallback welcome message
            ) : (
              messages.map((msg, index) => (
                <MessageItem key={index} message={msg} />
              ))
            )}
            
            {/* Typing indicator using the reusable component */}
            <TypingIndicator isTyping={isTyping} />
            
            <div ref={messagesEndRef} />
          </div>
          
          <MessageForm 
            onSendMessage={sendMessage}
            disabled={isTyping || waitingForHuman}
            placeholder={waitingForHuman ? "Waiting for representative..." : "Type your message here..."}
            autoFocus={true}
          />
        </div>
      )}
    </>
  );
};

export default Chat; 