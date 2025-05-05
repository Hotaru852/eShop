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
          timestamp: new Date().toISOString()
        };
        
        // Check if this is a handoff message
        if (data.isHandoff) {
          setWaitingForHuman(true);
        }
        
        setMessages((prevMessages) => {
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
    }
    
    return () => {
      socket.off('receive_message');
      socket.off('typing_indicator');
      socket.off('human_joined');
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
      unreadCount,
      chatOpen,
      isTyping,
      waitingForHuman,
      sendMessage,
      toggleChat,
      clearChat
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