import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faExclamationTriangle, faTimes, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
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

// Make socket globally accessible for controlled disconnection during logout
window.adminSocket = socket;

const AdminChat = () => {
  const [connected, setConnected] = useState(false);
  const [customerChats, setCustomerChats] = useState([]);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [agentName, setAgentName] = useState('Customer Support');
  const messagesEndRef = useRef(null);
  
  const { user, isAuthenticated, isStaff } = useAuth();
  const { showToast } = useToast();
  
  // Helper function to remove invalid chats
  const cleanupInvalidChats = () => {
    setCustomerChats(prevChats => {
      // Filter out any chats with undefined or invalid userIds
      const validChats = prevChats.filter(chat => {
        if (!chat.userId || chat.userId === 'undefined') {
          console.log('Removing invalid chat:', chat);
          return false;
        }
        return true;
      });
      
      return validChats;
    });
  };
  
  // Connect to socket on component mount if authenticated as staff
  useEffect(() => {
    if (isAuthenticated && isStaff && !connected) {
      // Try to get staff user from localStorage for testing multi-user
      const storedStaffUser = localStorage.getItem('staffUser');
      const staffUserData = storedStaffUser ? JSON.parse(storedStaffUser) : null;
      
      // Use either the stored staff user or the current auth cookie
      if (staffUserData) {
        // Create a manual token for the staff user
        const mockToken = `staff_token_${staffUserData.id}_${Date.now()}`;
        socket.auth = { token: mockToken, staffUser: staffUserData };
      } else {
        // Set auth token for socket
        socket.auth = { token: document.cookie.replace('authToken=', '') };
      }
      
      console.log('Connecting to socket server as staff:', {
        user,
        auth: socket.auth
      });
      
      // Check if socket is already connected
      if (socket.connected) {
        console.log('Socket is already connected');
        setConnected(true);
      } else {
        // Add socket debugging
        socket.onAny((event, ...args) => {
          console.log(`Socket event: ${event}`, args);
        });
        
        socket.on('connect', () => {
          console.log('Socket connected successfully');
          setConnected(true);
          showToast('Connected to chat server', 'success');
        });
        
        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          showToast('Failed to connect to chat server', 'error');
        });
        
        socket.connect();
      }
      
      // Print current user information
      console.log('Current staff user:', {
        user,
        agentName: user?.username || staffUserData?.username,
        role: user?.role || staffUserData?.role
      });
      
      // Set agent name from user data
      if (user && user.username) {
        setAgentName(user.username);
      } else if (staffUserData) {
        setAgentName(staffUserData.username);
      }
      
      // Show welcome toast
      showToast(`Welcome, ${user?.username || staffUserData?.username || 'Support Agent'}!`, 'success');
      
      // Clean up any invalid chats on initial load
      cleanupInvalidChats();
    }
    
    return () => {
      if (connected) {
        console.log('Disconnecting socket');
        socket.disconnect();
      }
    };
  }, [isAuthenticated, isStaff, connected, user, showToast]);
  
  // Periodically clean up any invalid chats
  useEffect(() => {
    if (connected) {
      const cleanup = setInterval(cleanupInvalidChats, 5000);
      return () => clearInterval(cleanup);
    }
  }, [connected]);
  
  // Check for invalid chats whenever customer list changes
  useEffect(() => {
    // If we have an activeCustomer that's invalid, clear it
    if (activeCustomer && 
        (activeCustomer === 'undefined' || 
         !customerChats.some(chat => chat.userId === activeCustomer))) {
      console.log('Clearing invalid active customer:', activeCustomer);
      setActiveCustomer(null);
      setMessages([]);
    }
  }, [customerChats, activeCustomer]);
  
  // Listen for incoming customer messages and escalation requests
  useEffect(() => {
    if (connected) {
      // Listen for join confirmation
      socket.on('join_confirmation', (data) => {
        console.log('Join confirmation received:', data);
      });
      
      // Listen for errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        showToast(`Error: ${error.message}`, 'error');
      });
      
      // Listen for regular messages
      socket.on('receive_message', (data) => {
        // Skip messages with invalid userId
        if (!data.userId || data.userId === 'undefined') {
          console.log('Skipping message with invalid userId:', data);
          return;
        }
        
        // Ensure username is valid to prevent "undefined" from showing
        const username = data.username && data.username !== 'undefined'
          ? data.username 
          : `User #${data.userId}`;
        
        // Create a standardized message object
        const standardMessage = {
          ...data,
          id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          username: username,
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        console.log('Standardized message in receive_message:', standardMessage);
        
        // Add to the list of customer chats if not already there
        setCustomerChats((prevChats) => {
          const existingChat = prevChats.find(chat => chat.userId === data.userId);
          
          // Determine if this message is from staff
          const isStaffMessage = !data.isCustomer && data.username !== 'System' && data.username !== 'AI Assistant';
          
          if (!existingChat) {
            // Skip adding chats for undefined users
            if (!data.userId || data.userId === 'undefined') {
              return prevChats;
            }
            
            // Notify of new conversation
            showToast('New customer conversation started', 'info');
            
            return [...prevChats, { 
              userId: data.userId, 
              // Use the username from data only if this is a customer message
              // This ensures the label shows the customer's name
              username: data.isCustomer ? username : data.recipient || username,
              lastMessage: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
              unread: true,
              needsAttention: false,
              isStaffMessage: isStaffMessage
            }];
          }
          
          // Update existing chat - preserve username if it exists
          return prevChats.map(chat => 
            chat.userId === data.userId 
              ? { 
                  ...chat, 
                  // Keep existing username for the customer chat even when receiving staff messages
                  username: chat.username || (data.isCustomer ? username : data.recipient || username),
                  lastMessage: data.message, 
                  timestamp: data.timestamp || new Date().toISOString(),
                  unread: activeCustomer !== data.userId,
                  isStaffMessage: isStaffMessage
                } 
              : chat
          );
        });
        
        // Add to the active conversation if this customer is selected
        if (activeCustomer && activeCustomer === data.userId) {
          // Check for duplicates before adding to the messages
          setMessages(prevMessages => {
            // Check if this message already exists in our list
            const isDuplicate = prevMessages.some(msg => 
              // Check by ID if available
              (msg.id && msg.id === standardMessage.id) ||
              // Or by content + timestamp (within 2 seconds) + sender
              (msg.message === standardMessage.message &&
               msg.username === standardMessage.username &&
               Math.abs(new Date(msg.timestamp).getTime() - new Date(standardMessage.timestamp).getTime()) < 2000)
            );
            
            if (isDuplicate) {
              console.log('Skipping duplicate message:', standardMessage.message);
              return prevMessages;
            }
            
            return [...prevMessages, standardMessage];
          });
        }
      });
      
      // Listen for escalation requests
      socket.on('human_needed', (data) => {
        // Skip messages with invalid userId
        if (!data.userId || data.userId === 'undefined') {
          console.log('Skipping human_needed event with invalid userId:', data);
          return;
        }
        
        // Skip processing if this is a staff-originated message
        // Staff messages should never trigger human_needed events
        if (data.isStaff || data.username === agentName || data.username === 'support_staff') {
          console.log('Ignoring human_needed event from staff member:', data);
          return;
        }
        
        // Ensure username is valid to prevent "undefined" from showing
        const username = data.username && data.username !== 'undefined'
          ? data.username 
          : `User #${data.userId}`;
        
        setCustomerChats((prevChats) => {
          const existingChat = prevChats.find(chat => chat.userId === data.userId);
          
          if (!existingChat) {
            // Skip adding chats for undefined users
            if (!data.userId || data.userId === 'undefined') {
              return prevChats;
            }
            
            // Notify of escalation
            showToast('Customer requested human support', 'warning');
            
            return [...prevChats, { 
              userId: data.userId, 
              username: username, 
              lastMessage: data.message,
              timestamp: new Date().toISOString(),
              unread: true,
              needsAttention: true,
              reason: data.reason
            }];
          }
          
          // If this chat is already active, don't mark it as needing attention again
          if (activeCustomer === data.userId) {
            return prevChats;
          }
          
          // Update existing chat only if not currently active
          return prevChats.map(chat => 
            chat.userId === data.userId 
              ? { 
                  ...chat, 
                  username: username, 
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
      
      // Add handler for staff_left event
      socket.on('staff_left', (data) => {
        console.log('Received staff_left event:', data);
        
        // Get the userId from the event data
        const userId = data.userId;
        
        if (!userId) {
          console.error('Missing userId in staff_left event', data);
          return;
        }
        
        // If this is about the currently active customer, clear the selection
        if (activeCustomer && userId === activeCustomer) {
          setActiveCustomer(null);
          setMessages([]);
        }
        
        // Remove this customer from the active chats list 
        setCustomerChats(prevChats => 
          prevChats.filter(chat => chat.userId !== userId)
        );
      });
    }
    
    return () => {
      socket.off('receive_message');
      socket.off('human_needed');
      socket.off('join_confirmation');
      socket.off('staff_left');
      socket.off('error');
    };
  }, [connected, activeCustomer, showToast, setMessages, setCustomerChats]);
  
  // Get messages for specific customer
  const loadCustomerChat = (userId) => {
    // Validate userId to prevent 'undefined' issues
    if (!userId || userId === 'undefined') {
      console.error('Invalid userId in loadCustomerChat:', userId);
      showToast('Error: Invalid user ID', 'error');
      return;
    }
    
    // Convert userId to string format for consistency
    const userIdStr = String(userId);
    
    // Get customer data with more detailed logging
    const customer = customerChats.find(chat => chat.userId === userIdStr);
    console.log('Loading chat for customer:', customer);
    
    // Ensure we have a valid username
    const customerUsername = (customer?.username && customer.username !== 'undefined')
      ? customer.username
      : `User #${userIdStr}`;
    
    // Mark as read and remove needsAttention flag
    setCustomerChats(prevChats => 
      prevChats.map(chat => 
        chat.userId === userIdStr 
          ? { ...chat, unread: false, needsAttention: false } 
          : chat
      )
    );
    
    setActiveCustomer(userIdStr);
    
    // Join the customer's chat room
    socket.emit('join_chat_as_agent', { 
      userId: userIdStr,
      agentName
    });
    
    // Notify that a human has joined
    socket.emit('human_joined', {
      userId: userIdStr,
      agentName
    });
    
    // Show toast notification
    showToast(`Connected to ${customerUsername}`, 'success');
    
    // Initialize with an empty message array - no system message
    setMessages([]);
    
    // Add the last customer message if available
    if (customer && customer.lastMessage) {
      const initialMessage = {
        userId: userIdStr,
        username: customerUsername,
        message: customer.lastMessage,
        isCustomer: true,
        timestamp: customer.timestamp || new Date().toISOString()
      };
      
      console.log('Adding initial customer message:', initialMessage);
      
      // Add the customer's last message immediately
      setMessages([initialMessage]);
    }
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
  
  // Get the active customer data
  const activeCustomerData = customerChats.find(chat => chat.userId === activeCustomer) || {};
  
  // Update welcome message to show username
  const welcomeMessage = (username) => {
    // Always use a valid display name, never show "undefined"
    const displayName = username && username !== 'undefined' 
      ? username 
      : `User #${activeCustomer}`;
      
    return `You are now connected with ${displayName}.`;
  };
  
  // Debug logging for state changes
  useEffect(() => {
    console.log('ActiveCustomer changed:', activeCustomer);
  }, [activeCustomer]);

  useEffect(() => {
    console.log('CustomerChats updated:', customerChats);
  }, [customerChats]);

  useEffect(() => {
    console.log('Messages updated:', messages);
    
    // Auto-scroll to the bottom when messages change
    if (messagesEndRef.current) {
      // Use scrollIntoView with 'smooth' behavior but contain it within the parent container
      const messagesContainer = messagesEndRef.current.closest('.admin-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  // Add an endChatSession function
  const endChatSession = () => {
    if (!activeCustomer) return;
    
    console.log('Ending chat session for user:', activeCustomer);
    
    // Let the server handle the notification to the user
    socket.emit('end_session', {
      userId: activeCustomer,
      agentName
    });
    
    // Clear human agent status on server
    socket.emit('leave_chat', {
      userId: activeCustomer
    });
    
    // Update local chat data
    setCustomerChats(prevChats => 
      prevChats.filter(chat => chat.userId !== activeCustomer)
    );
    
    // Reset active customer and clear messages
    setActiveCustomer(null);
    setMessages([]);
    
    // Show toast
    showToast('Chat session ended', 'info');
  };
  
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
                      <span>{customer.username || `User #${customer.userId}`}</span>
                    </div>
                    <div className="customer-last-message">
                      {customer.needsAttention && (
                        <span className="attention-icon">
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                        </span>
                      )}
                      <span className="message-preview">
                        {customer.isStaffMessage ? "You: " : ""}
                        {customer.lastMessage && customer.lastMessage.length > 30 
                          ? `${customer.lastMessage.substring(0, 30)}...` 
                          : customer.lastMessage}
                      </span>
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
                <h3>{activeCustomerData.username || `User #${activeCustomer}`}</h3>
              </div>
            </div>
            
            <div className="admin-messages">
              {console.log('Rendering messages section. messages length:', messages.length, messages)}
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <p>{welcomeMessage(activeCustomerData.username || `User #${activeCustomer}`)}</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  console.log('Rendering message item:', index, msg);
                  // If this is a staff message, modify it to show "You:" instead of staff name
                  const modifiedMsg = {...msg};
                  if (!msg.isCustomer && msg.username === agentName) {
                    modifiedMsg.username = "You";
                  }
                  return <MessageItem key={index} message={modifiedMsg} />;
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="admin-chat-actions">
              <button className="end-chat-button" onClick={endChatSession} title="End this chat session">
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span>End Session</span>
              </button>
            </div>
            
            <MessageForm 
              onSendMessage={(message) => {
                if (activeCustomer) {
                  // Generate a unique message ID
                  const messageId = `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  
                  // Get the customer's username for tracking purposes
                  const customerUsername = activeCustomerData?.username || `User #${activeCustomer}`;
                  
                  const messageData = {
                    userId: activeCustomer,
                    username: agentName, // Include staff username
                    recipient: customerUsername, // Include customer username as recipient
                    message,
                    isCustomer: false, // Explicitly mark as NOT customer message
                    timestamp: new Date().toISOString(),
                    id: messageId // Add unique ID
                  };
                  
                  console.log('Sending staff message:', messageData);
                  
                  // Check if we need to emit join chat again to ensure connection
                  if (!socket.connected) {
                    console.log('Socket disconnected, reconnecting...');
                    socket.connect();
                    
                    // Re-join the customer's chat
                    setTimeout(() => {
                      socket.emit('join_chat_as_agent', { 
                        userId: activeCustomer,
                        agentName
                      });
                    }, 500);
                  }
                  
                  // Add message to local state AFTER sending to ensure proper ordering
                  // and to prevent duplicate display
                  
                  // Send to server first
                  socket.emit('send_message', messageData);
                  
                  // Update the customer chat list to mark the last message as from staff
                  setCustomerChats(prevChats => 
                    prevChats.map(chat => 
                      chat.userId === activeCustomer 
                        ? { 
                            ...chat, 
                            lastMessage: message,
                            timestamp: new Date().toISOString(),
                            isStaffMessage: true,
                            username: chat.username
                          } 
                        : chat
                    )
                  );
                  
                  // Wait a tiny bit before updating local state to let the server process
                  setTimeout(() => {
                    // Add to local messages with the ID
                    setMessages(prevMessages => {
                      // Check if this exact message is already in the state (prevents duplicates)
                      const isDuplicate = prevMessages.some(msg => 
                        msg.id === messageId || 
                        (msg.message === message && 
                         msg.username === agentName &&
                         Date.now() - new Date(msg.timestamp).getTime() < 2000)
                      );
                      
                      if (isDuplicate) {
                        console.log('Skipping duplicate message in state');
                        return prevMessages;
                      }
                      
                      return [...prevMessages, messageData];
                    });
                  }, 10);
                } else {
                  console.error('Cannot send message - no active customer selected');
                  showToast('Cannot send message - no active customer selected', 'error');
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