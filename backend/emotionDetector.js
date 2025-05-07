/**
 * Emotion detection module for customer service chat
 * Helps identify when customers are upset and need human intervention
 */

// Import the GoogleGenerativeAI to use the same model as the chatbot
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Default Gemini API key (will be overridden by .env if available)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDgC9wXLHOjkE-yrTiQxXX8twK3qIZt3Dw';

// Initialize Gemini client
let genAI = null;
let geminiModel = null;

try {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('Emotion detector initialized with Gemini.');
} catch (error) {
  console.error('Error initializing Gemini for emotion detection:', error);
}

/**
 * Analyzes a message for emotional content using Gemini AI
 * Returns a score and emotion category for routing decisions
 * 
 * @param {string} message - The customer's message to analyze
 * @return {Promise<Object>} Object containing emotion details
 */
async function analyzeEmotion(message) {
  // Default response in case of errors
  const defaultResponse = {
    score: 0, // -1 to 1 scale where negative numbers indicate negative emotions
    emotion: 'neutral', // primary emotion detected: 'neutral', 'happy', 'sad', 'angry', 'frustrated', etc.
    needsHuman: false, // whether this emotion warrants human intervention
    confidence: 0.5, // confidence in the detection (0-1),
  };
  
  // If message is empty or not a string, return neutral
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return defaultResponse;
  }
  
  // Explicitly handle common neutral greetings and simple inquiries
  const neutralPatterns = [
    // Greetings
    'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
    // Simple inquiries
    'how do i', 'where can i', 'when will', 'what is', 'can you help',
    // Questions about products/services
    'do you have', 'is there', 'how much', 'price', 'cost', 'shipping',
    // Polite phrases
    'thank you', 'thanks', 'appreciate it', 'please'
  ];
  
  // Check if message is a simple greeting or inquiry
  const lowercasedMessage = message.toLowerCase().trim();
  
  // If the message is just a simple greeting or starts with one of the neutral patterns
  if (neutralPatterns.some(pattern => lowercasedMessage === pattern) || 
      neutralPatterns.some(pattern => lowercasedMessage.startsWith(pattern))) {
    return {
      score: 0,
      emotion: 'neutral',
      needsHuman: false,
      confidence: 0.85
    };
  }
  
  // If Gemini is not available, return default neutral response
  if (!geminiModel) {
    return defaultResponse;
  }
  
  try {
    // Improved prompt for Gemini to analyze emotional content with more balance
    const prompt = `
    Analyze the emotional content of this customer service message for an e-commerce store.
    
    IMPORTANT: Be very conservative in labeling messages as negative. Do NOT overinterpret neutral messages as negative.
    
    These types of messages should almost ALWAYS be classified as neutral (score = 0) unless they contain CLEAR negative emotional language:
    - Simple greetings like "hello", "hi"
    - Basic questions about products, shipping, or returns
    - Inquiries about order status
    - Questions about how to use the website
    - Requests for information
    
    Return ONLY a JSON object with the following fields:
    - score: a number between -1 and 1, where:
      * -1 is extremely negative (clearly angry/upset)
      * -0.5 is moderately negative (frustrated)
      * 0 is neutral (most questions and normal inquiries)
      * 0.5 is moderately positive (pleased)
      * 1 is very positive (delighted)
    - emotion: a single word describing the primary emotion (e.g., 'happy', 'sad', 'angry', 'frustrated', 'neutral', etc.)
    - needsHuman: a boolean indicating if the emotional state requires human intervention (should be true ONLY for clearly negative emotions with explicit frustration/anger)
    - confidence: a number between 0 and 1 indicating confidence in the analysis

    Customer message: "${message}"
    
    JSON response:
    `;
    
    // Get response from Gemini
    const result = await geminiModel.generateContent(prompt);
    const textResult = result.response.text().trim();
    
    // Extract JSON from the response
    let jsonMatch = textResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const emotionData = JSON.parse(jsonMatch[0]);
        
        // Validate the returned data
        if (
          typeof emotionData.score === 'number' && 
          typeof emotionData.emotion === 'string' && 
          typeof emotionData.needsHuman === 'boolean' && 
          typeof emotionData.confidence === 'number'
        ) {
          // Ensure score is between -1 and 1
          emotionData.score = Math.max(-1, Math.min(1, emotionData.score));
          // Ensure confidence is between 0 and 1
          emotionData.confidence = Math.max(0, Math.min(1, emotionData.confidence));
          
          // Adjust the threshold - only for clearly negative emotions (threshold -0.6), set needsHuman to true
          if (emotionData.score < -0.6) {
            emotionData.needsHuman = true;
          } else {
            // For slightly negative or neutral/positive emotions, don't route to human
            emotionData.needsHuman = false;
          }
          
          return emotionData;
        }
      } catch (jsonError) {
        console.error('Error parsing emotion JSON:', jsonError);
      }
    }
    
    return defaultResponse;
    
  } catch (error) {
    console.error('Error analyzing emotion with Gemini:', error);
    return defaultResponse;
  }
}

/**
 * Determines if a message needs human attention based on emotional content
 * Uses ONLY the AI-based emotion analysis of the current message
 * 
 * @param {string} message - The customer's message
 * @param {Array} conversationHistory - Previous messages for context (unused)
 * @return {Promise<boolean>} Whether the message needs human attention
 */
async function needsHumanIntervention(message, conversationHistory = []) {
  if (!message || typeof message !== 'string') {
    return false;
  }

  console.log(`[DEBUG] emotionDetector.needsHumanIntervention analyzing: "${message}"`);

  // Analyze the emotion using Gemini
  try {
    const emotionResult = await analyzeEmotion(message);
    console.log(`[DEBUG] Emotion analysis result: ${JSON.stringify(emotionResult)}`);
    
    // Use a much more conservative threshold - only route clearly negative emotions
    // Only route to human for significantly negative emotions (score < -0.6)
    if (emotionResult.score < -0.6 || emotionResult.needsHuman) {
      const reason = emotionResult.score < -0.6 ? `negative score (${emotionResult.score})` : `needsHuman flag is true`;
      console.log(`[DEBUG] Message requires human attention: ${reason}`);
      console.log(`Message requires human attention: score=${emotionResult.score}, emotion=${emotionResult.emotion}`);
      return true;
    }
    
    console.log(`[DEBUG] No reason to route to human, handling with bot`);
    console.log(`Message handled by bot: score=${emotionResult.score}, emotion=${emotionResult.emotion}`);
  } catch (error) {
    console.error('Error in emotion analysis:', error);
    // In case of errors, don't route to human
  }
  
  console.log(`[DEBUG] Returning false from needsHumanIntervention`);
  return false;
}

/**
 * Reset any stored emotion state for a user
 * This is used when clearing user context to ensure clean slate
 * 
 * @param {string} userId - Unique identifier for the user
 */
function resetUserState(userId) {
  // Currently, we don't store any per-user emotion state
  // This is a hook for future expansion if needed
  console.log(`Emotion state reset for user ${userId}`);
  return true;
}

module.exports = {
  analyzeEmotion,
  needsHumanIntervention,
  resetUserState
}; 