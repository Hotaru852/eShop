import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import chatStorage from '../util/chatStorage';
import uiStorage from '../util/uiStorage';

const ChatContext = createContext();

// Set up socket connection
const socket = io('http://localhost:5000', {
  autoConnect: false,
  withCredentials: true // Important for sending cookies
});

// Make socket globally accessible for controlled disconnection during logout
window.socket = socket;

export const ChatProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [waitingForHuman, setWaitingForHuman] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  
  const { user, isAuthenticated } = useAuth();
  
  // Load chat open state from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const savedChatOpen = uiStorage.loadState('chatOpen', false);
      setChatOpen(savedChatOpen);
    }
  }, [isAuthenticated]);

  // Save chat open state to localStorage when it changes
  useEffect(() => {
    if (isAuthenticated) {
      uiStorage.saveState('chatOpen', chatOpen);
    }
  }, [chatOpen, isAuthenticated]);
  
  // Reset chat state when user changes (login/logout)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Set user ID
      setUserId(user.id.toString());
      
      // Clear previous messages when user logs in
      setMessages([]);
      setWaitingForHuman(false);
      setIsTyping(false);
      setUnreadCount(0);
      setIsFirstOpen(true);
      setChatOpen(false); // Ensure chat is closed on login
      
      // Clear saved messages from localStorage
      chatStorage.clearAllChats();
    } else {
      // Reset state on logout
      setUserId(null);
      setMessages([]);
      setConnected(false);
      setChatOpen(false); // Ensure chat is closed on logout
      setIsFirstOpen(true);
    }
  }, [isAuthenticated, user]);
  
  // Show welcome message when chat is opened for the first time
  useEffect(() => {
    if (chatOpen && isFirstOpen && isAuthenticated && userId) {
      // Add initial professional welcome message
      const welcomeMessage = {
        userId,
        username: "AI Assistant",
        message: "Hello! Thank you for contacting eShop customer support. How may I assist you today?",
        isCustomer: false,
        isSystem: false,
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      setIsFirstOpen(false);
      
      // Save to localStorage
      chatStorage.saveMessages(userId, [welcomeMessage]);
    }
  }, [chatOpen, isFirstOpen, isAuthenticated, userId, setMessages, setIsFirstOpen]);
  
  // Connect to socket when userId is available and user is authenticated
  useEffect(() => {
    if (userId && isAuthenticated && !connected) {
      // Set auth token for socket
      socket.auth = { token: document.cookie.replace('authToken=', '') };
      
      socket.connect();
      socket.emit('join_chat', userId);
      setConnected(true);
    }
    
    return () => {
      if (connected) {
        socket.disconnect();
      }
    };
  }, [userId, connected, isAuthenticated, setConnected]);
  
  // Listen for incoming messages
  useEffect(() => {
    if (connected) {
      socket.on('receive_message', (data) => {
        const newMessage = {
          ...data,
          id: data.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate ID if not provided
          timestamp: new Date().toISOString()
        };
        
        // Check if this is a handoff message
        if (data.isHandoff) {
          setWaitingForHuman(true);
        }
        
        setMessages((prevMessages) => {
          // Check for duplicates by comparing content and timestamps (within a small timeframe)
          const isDuplicate = prevMessages.some(msg => {
            // Check if the message content is the same
            const sameContent = msg.message === newMessage.message;
            
            // If the content is the same, check if it's within 2 seconds
            if (sameContent && msg.timestamp && newMessage.timestamp) {
              const timeDiff = Math.abs(
                new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()
              );
              return timeDiff < 2000; // Within 2 seconds
            }
            return false;
          });
          
          // Skip adding duplicate messages
          if (isDuplicate) {
            console.log('Skipping duplicate message:', newMessage.message);
            return prevMessages;
          }
          
          const updatedMessages = [...prevMessages, newMessage];
          // Save to localStorage
          chatStorage.saveMessages(userId, updatedMessages);
          return updatedMessages;
        });
        
        // Increment unread count if chat is not open
        if (!chatOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      });
      
      // Listen for typing indicator events
      socket.on('typing_indicator', (data) => {
        setIsTyping(data.isTyping);
      });
      
      // Listen for human support notifications
      socket.on('human_joined', (data) => {
        if (data.userId === userId) {
          setWaitingForHuman(false);
          
          // Add system message that human has joined
          const humanJoinedMessage = {
            message: `${data.agentName || 'A customer service representative'} has joined the chat.`,
            isCustomer: false,
            isSystem: true,
            timestamp: new Date().toISOString()
          };
          
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, humanJoinedMessage];
            chatStorage.saveMessages(userId, updatedMessages);
            return updatedMessages;
          });
        }
      });
      
      // Listen for staff left event (previously chat_ended)
      socket.on('staff_left', (data) => {
        console.log('Received staff_left event:', data);
        
        // We still have an active chat but the staff member left
        // Just reset waiting for human flag
        setWaitingForHuman(false);
        
        // No need to add a second notification - server already sends a system message
        // via receive_message that will be displayed to the user
        
        console.log('Staff member left the chat, continuing with LLM assistant');
      });
      
      // Also listen for errors
      socket.on('error', (error) => {
        console.error('[SOCKET ERROR]', error);
      });
    }
    
    return () => {
      socket.off('receive_message');
      socket.off('typing_indicator');
      socket.off('human_joined');
      socket.off('staff_left');
    };
  }, [connected, chatOpen, userId, setMessages, setWaitingForHuman, setIsTyping, setUnreadCount]);
  
  // Reset unread count when opening chat
  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
    }
  }, [chatOpen]);
  
  // Function to send a message
  const sendMessage = (message) => {
    if (connected && message.trim() !== '' && userId) {
      const messageData = {
        userId,
        username: user?.username || `User ${userId}`,
        message,
        isCustomer: true,
        timestamp: new Date().toISOString()
      };
      
      socket.emit('send_message', messageData);
      
      // Add message to local state
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, messageData];
        // Save to localStorage
        chatStorage.saveMessages(userId, updatedMessages);
        return updatedMessages;
      });
    } else if (!isAuthenticated) {
      // If not authenticated, prompt to login
      alert('Please login to use the chat feature.');
    }
  };
  
  // Function to toggle chat window
  const toggleChat = () => {
    setChatOpen((prev) => !prev);
  };
  
  // Function to clear chat history
  const clearChat = () => {
    setMessages([]);
    setIsFirstOpen(true);
    if (userId) {
      chatStorage.clearUserChat(userId);
    }
  };
  
  return (
    <ChatContext.Provider value={{
      connected,
      messages,
      setMessages,
      unreadCount,
      chatOpen,
      isTyping,
      waitingForHuman,
      sendMessage,
      toggleChat,
      clearChat,
      userId
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};

export default ChatContext; 