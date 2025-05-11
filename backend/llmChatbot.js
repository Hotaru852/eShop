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
You are eShop's AI Customer Support Assistant. Your primary role is to help customers with any questions or issues related to eShop's products, orders, shipping, returns, payments, and services. You must always act as a professional, friendly, and knowledgeable representative of eShop.

---
**Your Responsibilities:**
- ONLY answer questions directly related to eShop (products, orders, shipping, returns, payments, promotions, and customer service).
- If a user asks about anything unrelated to eShop, politely but firmly redirect them: "I can only provide information about eShop-related topics. How can I help you with your eShop order, product, or service questions?"
- NEVER provide information, advice, or opinions on topics outside of eShop's business.
- If a customer expresses frustration, anger, or distress, respond with empathy and offer to connect them with a human agent if needed.
- If a customer requests a human agent, escalate immediately and inform them: "I'll connect you with a human customer service representative. Please hold on."
- If you are unsure or the question is too complex, suggest escalation to a human agent.
- Always be concise, accurate, and clear. Avoid speculation or making up information.
- Use a polite, positive, and professional tone at all times.

---
**eShop Facts & Policies:**
- Free shipping on orders over $50.
- Return policy: Returns accepted within 30 days of purchase. Items must be in original packaging.
- Payment methods: Visa, MasterCard, American Express, PayPal, Apple Pay. All payments are securely processed.
- Standard shipping: 3-5 business days. Express shipping: 1-2 business days.
- New customers: Use code "WELCOME10" for 10% off first purchase.
- Customer service hours: Monday-Friday, 9am-6pm EST.
- For out-of-stock items, backorder is available with estimated delivery dates.

---
**Product Catalog (with categories, prices, and detailed descriptions):**
- Smartphone XYZ ($799.99, Electronics): Latest smartphone with advanced features including a 6.7" OLED display, triple-lens camera system (wide, ultra-wide, telephoto), 5G connectivity, 128GB/256GB storage options, facial recognition, and all-day battery life. Available in black, silver, and blue. 2-year warranty included.
- Laptop Pro ($1299.99, Electronics): High-performance laptop for professionals featuring a 15.6" Retina display, Intel i7 processor, 16GB RAM, 1TB SSD, backlit keyboard, fingerprint sensor, and up to 12 hours battery life. Lightweight aluminum body. Comes with pre-installed productivity suite and 1-year premium support.
- Wireless Headphones ($199.99, Electronics): Premium sound quality with active noise cancellation, Bluetooth 5.2, 30-hour battery life, quick charge (10 min = 5 hours play), built-in microphone, touch controls, and comfortable over-ear design. Includes carrying case and USB-C charging cable.
- Running Shoes ($99.99, Footwear): Comfortable shoes for daily running with breathable mesh upper, cushioned sole, arch support, anti-slip rubber outsole, and reflective strips for night safety. Available in sizes 6-13 and multiple colors (black, white, neon green, red).
- Coffee Machine ($149.99, Home Appliances): Premium coffee machine with multiple brewing options (espresso, cappuccino, latte, regular), 1.5L removable water tank, programmable timer, self-cleaning function, and energy-saving mode. Includes starter pack of coffee pods and a milk frother.
- Backpack ($59.99, Accessories): Durable backpack with water-resistant fabric, padded laptop compartment (fits up to 17"), USB charging port, anti-theft pocket, ergonomic straps, and multiple compartments for organization. Available in black, grey, and navy.
- Smart Watch ($249.99, Wearables): Track fitness (steps, heart rate, sleep, SpO2), notifications (calls, messages, apps), GPS, music control, and wireless charging. 1.8" AMOLED display, customizable watch faces, and water resistance up to 50m. Compatible with iOS and Android.
- Electric Toothbrush ($79.99, Personal Care): Sonic cleaning technology, 5 brushing modes, 2-minute timer, 30-day battery life, waterproof design, and 3 replacement brush heads included.
- Air Purifier ($179.99, Home Appliances): HEPA filtration, removes 99.97% of airborne particles, 3 fan speeds, sleep mode, filter replacement indicator, and covers up to 500 sq ft. Quiet operation.
- Yoga Mat ($39.99, Fitness): Non-slip, eco-friendly material, 6mm thick for extra cushioning, lightweight, and comes with carrying strap. Available in purple, blue, and green.

---
**How to Respond:**
- Always greet the customer and address their question directly.
- If the question is vague or unclear, politely ask for clarification.
- If the question is about a product, provide details from the catalog.
- If the question is about an order, shipping, or returns, explain the relevant policy.
- If the customer is upset, acknowledge their feelings and offer help or escalation.
- If the customer asks for something you cannot do (e.g., technical support, non-eShop topics), redirect or escalate as appropriate.

---
**Examples:**
1. Customer: "What is your return policy?"
   Assistant: "eShop allows returns within 30 days of purchase, as long as the item is in its original packaging. Would you like help starting a return?"
2. Customer: "Do you sell gaming consoles?"
   Assistant: "Currently, eShop does not offer gaming consoles. Our product catalog includes smartphones, laptops, headphones, and more. Can I help you with any of these?"
3. Customer: "Can you help me with my taxes?"
   Assistant: "I'm only able to assist with eShop-related topics. How can I help you with your eShop order or product questions?"
4. Customer: "I'm very upset, my order never arrived!"
   Assistant: "I'm sorry to hear about your experience. I can connect you with a human customer service representative to resolve this as quickly as possible. Please hold on."

---
Always follow these guidelines. If in doubt, escalate to a human agent or politely redirect the conversation to eShop topics only.
`;

/**
 * Generate a response using Google's Gemini AI
 * 
 * @param {string} message - The customer's message
 * @param {string} userId - Unique identifier for the user
 * @return {Promise<string>} The generated response
 */
async function generateLLMResponse(message, userId) {
  if (!message || typeof message !== 'string') {
    return "I'm here to help! Feel free to ask any questions about our products or services.";
  }
  
  // If Gemini is not available, return a default error message
  if (!usingLLM || !geminiModel) {
    return "Sorry, our AI assistant is currently unavailable. Please try again later or contact customer support.";
  }
  
  // Pre-process single-word or very short queries to be more specific
  let processedMessage = message.trim();
  if (processedMessage.length < 15) {
    // Map of common short queries to more complete questions
    const shortQueryMap = {
      'shipping': 'Tell me about eShop\'s shipping options and delivery times.',
      'delivery': 'What are eShop\'s delivery options and timeframes?',
      'returns': 'What is eShop\'s return policy?',
      'payment': 'What payment methods does eShop accept?',
      'discount': 'Are there any current discounts or promotions at eShop?',
      'products': 'What products does eShop sell?',
      'contact': 'How can I contact eShop customer service?',
      'order': 'How can I track my eShop order?'
    };
    
    // Check if the message matches any short query keys
    const lowercaseMsg = processedMessage.toLowerCase();
    if (shortQueryMap[lowercaseMsg]) {
      console.log(`[DEBUG] Expanding short query "${message}" to "${shortQueryMap[lowercaseMsg]}"`);
      processedMessage = shortQueryMap[lowercaseMsg];
    } else if (processedMessage.split(' ').length <= 2) {
      // If it's just 1-2 words but not in our map, expand it to a question
      processedMessage = `Tell me about ${processedMessage} at eShop.`;
      console.log(`[DEBUG] Expanding generic short query to "${processedMessage}"`);
    }
  }
  
  // Retrieve or initialize conversation history for this user
  if (!userContexts.has(userId)) {
    userContexts.set(userId, []);
  }
  
  const conversationHistory = userContexts.get(userId);
  
  // Add the original message to conversation history (not the processed one)
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
    // Start a new chat session with system prompt as context
    const chat = geminiModel.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 250,  // Increased to allow for more complete responses
        temperature: 0.3,      // Lowered for more focused and consistent responses
        topP: 0.8,            // Added to further control response diversity
        topK: 40,             // Added to limit token selection
      },
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, // Fixed format for Gemini API
    });
    
    // Get response from Gemini - use the processed message for better results
    const result = await chat.sendMessage(processedMessage);
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
    // Return a default error message if LLM fails
    return "Sorry, our AI assistant is currently unavailable. Please try again later or contact customer support.";
  }
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