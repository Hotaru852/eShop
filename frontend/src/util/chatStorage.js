/**
 * Utility functions for chat localStorage operations
 */
const chatStorage = {
  saveMessages: (userId, messages) => {
    localStorage.setItem(`chatMessages_${userId}`, JSON.stringify(messages));
  },
  
  getMessages: (userId) => {
    const stored = localStorage.getItem(`chatMessages_${userId}`);
    return stored ? JSON.parse(stored) : null;
  },
  
  clearUserChat: (userId) => {
    localStorage.removeItem(`chatMessages_${userId}`);
  },
  
  clearAllChats: () => {
    const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('chatMessages_'));
    sessionKeys.forEach(key => localStorage.removeItem(key));
  }
};

export default chatStorage; 