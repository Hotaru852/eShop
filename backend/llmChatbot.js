/**
 * LLM-based Chatbot for e-commerce customer support
 * Uses Google's Gemini API to generate more natural and context-aware responses
 * Falls back to basic responses if API service is not available
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const emotionDetector = require('./emotionDetector');
const escalationConfig = require('./config/escalationKeywords');

// Store conversation contexts for different users
const userContexts = new Map();

// Track which chats have human agents assigned
const humanAgentChats = new Map();

// Track if we're using LLM or fallback mode
let usingLLM = false;
let genAI = null;
let geminiModel = null;

// Default Gemini API key (will be overridden by .env if available)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDgC9wXLHOjkE-yrTiQxXX8twK3qIZt3Dw';

// Try to initialize Gemini client
try {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  usingLLM = true;
  console.log('Google Gemini AI client initialized successfully. LLM responses enabled.');
} catch (error) {
  console.error('Error initializing Gemini AI client:', error);
  console.log('Using fallback response system.');
}

// System prompt that guides the LLM behavior
const SYSTEM_PROMPT = `
You are a customer support assistant for eShop.
Only provide information related to eShop products, orders, shipping, returns, and related topics.
Be concise and accurate in your responses.

Here are the facts about eShop:
- We offer free shipping on orders over $50
- Our return policy allows returns within 30 days of purchase
- We accept all major credit cards, PayPal, and Apple Pay
- Standard shipping takes 3-5 business days
- Express shipping takes 1-2 business days
- New customers can use code "WELCOME10" for 10% off their first purchase
- Our customer service hours are Monday-Friday, 9am-6pm EST
`;

// Fallback responses database - used when no API key is available
const responseDatabase = [
  {
    keywords: ['hello', 'hi', 'hey', 'greetings'],
    response: 'Hello! Welcome to eShop customer support. How can I help you today?'
  },
  {
    keywords: ['shipping', 'delivery', 'ship', 'deliver', 'when', 'arrive'],
    response: 'We typically process and ship orders within 1-2 business days. Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days.'
  },
  {
    keywords: ['return', 'refund', 'exchange', 'money back', 'policy'],
    response: 'Our return policy allows returns within 30 days of purchase. Please ensure the item is in its original packaging. You can initiate a return from your order history page.'
  },
  {
    keywords: ['payment', 'pay', 'credit card', 'paypal', 'payment methods', 'visa', 'mastercard', 'debit'],
    response: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are securely processed.'
  },
  {
    keywords: ['discount', 'coupon', 'promo', 'code', 'sale', 'offer'],
    response: 'You can apply discount codes during checkout. Join our newsletter for exclusive offers and promotions! Use code "WELCOME10" for 10% off your first purchase.'
  },
  {
    keywords: ['thank', 'thanks', 'appreciate', 'helpful'],
    response: 'You\'re welcome! Is there anything else I can help you with today?'
  },
  {
    keywords: ['goodbye', 'bye', 'see you', 'talk later', 'end chat'],
    response: 'Thank you for chatting with us! Feel free to reach out anytime you need assistance. Have a great day!'
  }
];

// Fallback general responses
const fallbackResponses = [
  "I'm not sure I understand your question. Could you please provide more details?",
  "I'd like to help you with that. Could you please elaborate more on your inquiry?",
  "I apologize, but I didn't quite catch that. Could you rephrase your question?",
  "For this specific query, I'll need to connect you with one of our customer service representatives. They'll be with you shortly.",
  "Thank you for your patience. Let me look into this for you. In the meantime, can you provide more information about your question?"
];

/**
 * Generate a response using Google's Gemini AI or fallback to keyword matching
 * 
 * @param {string} message - The customer's message
 * @param {string} userId - Unique identifier for the user
 * @return {Promise<string>} The generated response
 */
async function generateLLMResponse(message, userId) {
  if (!message || typeof message !== 'string') {
    return "I'm here to help! Feel free to ask any questions about our products or services.";
  }
  
  // If Gemini is not available, use fallback
  if (!usingLLM || !geminiModel) {
    return generateFallbackResponse(message);
  }
  
  // Retrieve or initialize conversation history for this user
  if (!userContexts.has(userId)) {
    userContexts.set(userId, []);
  }
  
  const conversationHistory = userContexts.get(userId);
  
  // Add the new message to conversation history
  conversationHistory.push({
    role: 'user',
    content: message
  });
  
  // Format conversation history for Gemini
  const formattedHistory = conversationHistory.slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
  
  try {
    // Start a new chat session
    const chat = geminiModel.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7,
      },
    });
    
    // Get response from Gemini
    const result = await chat.sendMessage(message);
    const assistantMessage = result.response.text().trim();
    
    // Add the assistant's response to conversation history
    conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });
    
    // If history gets too long, trim it
    if (conversationHistory.length > 20) {
      userContexts.set(userId, conversationHistory.slice(-20));
    }
    
    return assistantMessage;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    // Fall back to basic responses
    return generateFallbackResponse(message);
  }
}

/**
 * Generate a response using the fallback keyword system
 * 
 * @param {string} message - The customer's message
 * @return {string} The generated response
 */
function generateFallbackResponse(message) {
  if (!message || typeof message !== 'string') {
    return "I'm here to help! Feel free to ask any questions about our products or services.";
  }
  
  // Convert message to lowercase for case-insensitive matching
  const lowercaseMessage = message.toLowerCase();
  
  // Check for matches in our response database
  for (const item of responseDatabase) {
    if (item.keywords.some(keyword => lowercaseMessage.includes(keyword))) {
      return item.response;
    }
  }
  
  // If no match is found, return a random fallback response
  const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
  return fallbackResponses[randomIndex];
}

/**
 * Determines if a message should be processed by the LLM or handled by a human
 * 
 * @param {string} message - The customer's message
 * @param {string} userId - Unique identifier for the user
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @param {boolean} isCustomer - Whether this is a customer message
 * @return {Promise<boolean>} Whether to use LLM response
 */
async function shouldUseLLM(message, userId, conversationHistory = [], isCustomer = true) {
  if (!message || typeof message !== 'string') {
    return true;
  }
  
  console.log(`[DEBUG] Checking if should use LLM for message: "${message}", isCustomer=${isCustomer}, userRole=${isCustomer ? 'customer' : 'staff'}`);
  
  // If this is a staff message, don't analyze it for emotional content
  if (!isCustomer) {
    console.log(`[DEBUG] Message is from staff, skipping emotion detection`);
    return true;
  }
  
  // If we're not using LLM mode at all, still return true to use the fallback system
  if (!usingLLM) {
    console.log(`[DEBUG] LLM not available, using fallback system`);
    return true;
  }
  
  // Check if this chat has a human agent assigned
  if (humanAgentChats.has(userId) && humanAgentChats.get(userId) === true) {
    console.log(`[DEBUG] Chat ${userId} has a human agent assigned, skipping LLM`);
    return false; // Don't use LLM if a human agent is assigned
  }
  
  // Get conversation history for this user if not provided
  if (!conversationHistory || !conversationHistory.length) {
    conversationHistory = userContexts.get(userId) || [];
    // Convert to the format expected by emotionDetector
    conversationHistory = conversationHistory.map(msg => ({
      message: msg.content,
      isCustomer: msg.role === 'user',
      timestamp: new Date().toISOString()
    }));
  }

  // Use the escalation keywords from configuration
  const { humanAssistancePatterns, escalationKeywords, financialPatterns } = escalationConfig;
  
  const lowercaseMessage = message.toLowerCase();
  
  // Check for financial amounts which might indicate refund requests
  const containsMoneyAmount = financialPatterns.moneyRegex.test(message);
  
  if (humanAssistancePatterns.some(pattern => lowercaseMessage.includes(pattern))) {
    console.log(`[DEBUG] Customer explicitly requested human support: "${message}"`);
    return false;
  }
  
  // Check if message contains any escalation keywords
  if (escalationKeywords.some(keyword => lowercaseMessage.includes(keyword))) {
    console.log(`[DEBUG] Message contains escalation keyword, routing to human: "${message}"`);
    return false;
  }
  
  // If message contains a money amount and mentions refund-related terms, route to human
  if (containsMoneyAmount && financialPatterns.refundTerms.test(lowercaseMessage)) {
    console.log(`[DEBUG] Message contains money amount and refund terminology, routing to human: "${message}"`);
    return false;
  }
  
  // Check for emotional content that needs human intervention
  console.log(`[DEBUG] Checking for emotional content in message "${message}"`);
  const needsHumanPromise = emotionDetector.needsHumanIntervention(message, conversationHistory);
  
  // We need to properly await the Promise result
  try {
    const needsHuman = await needsHumanPromise;
    console.log(`[DEBUG] Emotion detection result: needsHuman = ${needsHuman}`);
    
    if (needsHuman) {
      console.log(`[DEBUG] Emotional content detected, routing to human: "${message}"`);
      return false;
    }
  } catch (error) {
    console.error('[DEBUG] Error in emotion detection:', error);
    // On error, default to using LLM
  }
  
  // Check for complex support scenarios that typically need human help
  const complexSupportPatterns = [
    'order cancel',
    'cancellation',
    'refund',
    'not working',
    'broken',
    'damaged',
    'wrong item',
    'missing',
    'complaint',
    'issue with my order',
    'never arrived',
    'lost',
    'defective'
  ];
  
  // Only route to human if these patterns appear with certain intensity markers
  const intensityMarkers = [
    'very', 'extremely', 'urgent', 'immediately', 'serious', 'worst', 
    'terrible', 'horrible', 'awful', 'unacceptable'
  ];
  
  // Check if both a complex issue AND intensity marker are present
  const hasComplexIssue = complexSupportPatterns.some(pattern => lowercaseMessage.includes(pattern));
  const hasIntensityMarker = intensityMarkers.some(pattern => lowercaseMessage.includes(pattern));
  
  if (hasComplexIssue && hasIntensityMarker) {
    console.log(`Complex issue with high intensity detected: "${message}"`);
    return false;
  }
  
  // If conversation history is long and complex, suggest human assistance
  if (conversationHistory.length > 8) {
    const userMessages = conversationHistory.filter(msg => 
      typeof msg === 'object' && msg.isCustomer === true
    );
    
    // Check if there are multiple long messages (potentially complex issues)
    const longMessages = userMessages.filter(msg => 
      msg.message && msg.message.length > 100
    );
    
    if (longMessages.length >= 3 && message.length > 100) {
      console.log(`Long conversation with complex messages detected (${longMessages.length} long messages)`);
      return false;
    }
  }
  
  // Default to using the LLM for most cases
  return true;
}

/**
 * Mark a chat as having a human agent (to prevent bot responses)
 * 
 * @param {string} userId - Unique identifier for the user
 * @param {boolean} hasAgent - Whether a human agent is assigned
 */
function setHumanAgentStatus(userId, hasAgent = true) {
  humanAgentChats.set(userId, hasAgent);
}

/**
 * Check if a chat has a human agent assigned
 * 
 * @param {string} userId - Unique identifier for the user
 * @return {boolean} Whether a human agent is assigned
 */
function hasHumanAgent(userId) {
  return humanAgentChats.has(userId) && humanAgentChats.get(userId) === true;
}

/**
 * Clear conversation history for a user
 * 
 * @param {string} userId - Unique identifier for the user
 */
function clearUserContext(userId) {
  console.log(`Clearing context for user ${userId}`);
  
  // Remove conversation history
  if (userContexts.has(userId)) {
    userContexts.delete(userId);
  }
  
  // Clear human agent status when context is cleared
  if (humanAgentChats.has(userId)) {
    humanAgentChats.delete(userId);
  }
  
  // Clear any pending emotion analysis
  emotionDetector.resetUserState(userId);
  
  console.log(`Context cleared for user ${userId}`);
}

module.exports = {
  generateLLMResponse,
  shouldUseLLM,
  clearUserContext,
  setHumanAgentStatus,
  hasHumanAgent
}; 