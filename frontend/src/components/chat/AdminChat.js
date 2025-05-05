import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import useToast from '../../hooks/useToast';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import MessageForm from './MessageForm';
import AdminWelcome from './AdminWelcome';
import './AdminChat.css';

// Set up socket connection
const socket = io('http://localhost:5000', {
  autoConnect: false,
  withCredentials: true // Important for sending cookies
});

const AdminChat = () => {
  const [connected, setConnected] = useState(false);
  const [customerChats, setCustomerChats] = useState([]);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [agentName, setAgentName] = useState('Customer Support');
  const messagesEndRef = useRef(null);
  
  const { user, isAuthenticated, isStaff } = useAuth();
  const { showToast } = useToast();
  
  // Connect to socket on component mount if authenticated as staff
  useEffect(() => {
    if (isAuthenticated && isStaff && !connected) {
      // Set auth token for socket
      socket.auth = { token: document.cookie.replace('authToken=', '') };
      
      socket.connect();
      setConnected(true);
      
      // Set agent name from user data
      if (user && user.username) {
        setAgentName(user.username);
      }
      
      // Show welcome toast
      showToast(`Welcome, ${user?.username || 'Support Agent'}!`, 'success');
    }
    
    return () => {
      if (connected) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, isStaff, connected, user, showToast]);
  
  // Listen for incoming customer messages and escalation requests
  useEffect(() => {
    if (connected) {
      // Listen for regular messages
      socket.on('receive_message', (data) => {
        // Add to the list of customer chats if not already there
        setCustomerChats((prevChats) => {
          const existingChat = prevChats.find(chat => chat.userId === data.userId);
          
          if (!existingChat) {
            // Notify of new conversation
            showToast('New customer conversation started', 'info');
            
            return [...prevChats, { 
              userId: data.userId, 
              lastMessage: data.message,
              timestamp: data.timestamp,
              unread: true,
              needsAttention: false
            }];
          }
          
          // Update existing chat
          return prevChats.map(chat => 
            chat.userId === data.userId 
              ? { 
                  ...chat, 
                  lastMessage: data.message, 
                  timestamp: data.timestamp,
                  unread: activeCustomer !== data.userId
                } 
              : chat
          );
        });
        
        // Add to the active conversation if this customer is selected
        if (activeCustomer === data.userId) {
          setMessages(prevMessages => [...prevMessages, data]);
        }
      });
      
      // Listen for escalation requests
      socket.on('human_needed', (data) => {
        setCustomerChats((prevChats) => {
          const existingChat = prevChats.find(chat => chat.userId === data.userId);
          
          if (!existingChat) {
            // Notify of escalation
            showToast('Customer requested human support', 'warning');
            
            return [...prevChats, { 
              userId: data.userId, 
              lastMessage: data.message,
              timestamp: new Date().toISOString(),
              unread: true,
              needsAttention: true,
              reason: data.reason
            }];
          }
          
          // Update existing chat
          return prevChats.map(chat => 
            chat.userId === data.userId 
              ? { 
                  ...chat, 
                  lastMessage: data.message, 
                  timestamp: new Date().toISOString(),
                  unread: true,
                  needsAttention: true,
                  reason: data.reason
                } 
              : chat
          );
        });
      });
    }
    
    return () => {
      socket.off('receive_message');
      socket.off('human_needed');
    };
  }, [connected, activeCustomer, showToast, setMessages, setCustomerChats]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Get messages for specific customer
  const loadCustomerChat = (userId) => {
    // Mark as read
    setCustomerChats(prevChats => 
      prevChats.map(chat => 
        chat.userId === userId 
          ? { ...chat, unread: false, needsAttention: false } 
          : chat
      )
    );
    
    setActiveCustomer(userId);
    
    // Join the customer's chat room
    socket.emit('join_chat_as_agent', { 
      userId,
      agentName
    });
    
    // Notify that a human has joined
    socket.emit('human_joined', {
      userId,
      agentName
    });
    
    // Show toast notification
    showToast(`Connected to User #${userId}`, 'success');
    
    // TODO: Load previous messages from server/localStorage
    // For now, just clear messages
    setMessages([]);
  };
  
  // Sort customers by needs attention first, then unread, then by timestamp
  const sortedCustomers = [...customerChats].sort((a, b) => {
    // Needs attention first
    if (a.needsAttention && !b.needsAttention) return -1;
    if (!a.needsAttention && b.needsAttention) return 1;
    
    // Then unread
    if (a.unread && !b.unread) return -1;
    if (!a.unread && b.unread) return 1;
    
    // Then by time (newest first)
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  return (
    <div className="admin-chat-container">
      <div className="admin-sidebar">
        <div className="admin-header">
          <h2>Customer Support</h2>
          <div className="agent-info">
            <FontAwesomeIcon icon={faUser} />
            <span>{agentName}</span>
          </div>
        </div>
        
        <div className="customer-list">
          <h3>Active Conversations</h3>
          
          {sortedCustomers.length === 0 ? (
            <div className="no-customers">
              <p>No active customer conversations</p>
            </div>
          ) : (
            <ul>
              {sortedCustomers.map((customer) => (
                <li 
                  key={customer.userId} 
                  className={`
                    ${activeCustomer === customer.userId ? 'active' : ''}
                    ${customer.unread ? 'unread' : ''}
                    ${customer.needsAttention ? 'needs-attention' : ''}
                  `}
                  onClick={() => loadCustomerChat(customer.userId)}
                >
                  <div className="customer-info">
                    <div className="customer-name">
                      <FontAwesomeIcon icon={faUser} />
                      <span>User #{customer.userId}</span>
                    </div>
                    <div className="customer-last-message">
                      {customer.needsAttention && (
                        <span className="attention-icon">
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                        </span>
                      )}
                      <span className="message-preview">{customer.lastMessage}</span>
                    </div>
                    <div className="message-time">
                      {new Date(customer.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="admin-chat-area">
        {activeCustomer ? (
          <>
            <div className="active-customer-header">
              <div className="customer-details">
                <FontAwesomeIcon icon={faUser} />
                <h3>User #{activeCustomer}</h3>
              </div>
            </div>
            
            <div className="admin-messages">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <p>You are now connected with User #{activeCustomer}.</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <MessageItem key={index} message={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <MessageForm 
              onSendMessage={(message) => {
                if (activeCustomer) {
                  const messageData = {
                    userId: activeCustomer,
                    message,
                    isCustomer: false,
                    timestamp: new Date().toISOString()
                  };
                  
                  socket.emit('send_message', messageData);
                  
                  // Add to local messages
                  setMessages(prevMessages => [...prevMessages, messageData]);
                }
              }}
              placeholder="Type your reply here..."
            />
          </>
        ) : (
          <AdminWelcome />
        )}
      </div>
    </div>
  );
};

export default AdminChat; 