/**
 * Emotion detection module for customer service chat
 * Helps identify when customers are upset and need human intervention
 */

/**
 * Analyzes a message for emotional content
 * Returns a score and emotion category for routing decisions
 * 
 * @param {string} message - The customer's message to analyze
 * @return {Object} Object containing emotion details
 */
function analyzeEmotion(message) {
  // TODO: Implement your custom emotion recognition algorithm here
  
  // This is a placeholder - replace with your implementation
  return {
    score: 0, // -1 to 1 scale where negative numbers indicate negative emotions
    emotion: 'neutral', // primary emotion detected: 'neutral', 'happy', 'sad', 'angry', 'frustrated', etc.
    needsHuman: false, // whether this emotion warrants human intervention
    confidence: 0.5, // confidence in the detection (0-1)
  };
}

/**
 * Determines if a message needs human attention based on emotional content
 * 
 * @param {string} message - The customer's message
 * @param {Array} conversationHistory - Previous messages for context
 * @return {boolean} Whether the message needs human attention
 */
function needsHumanIntervention(message, conversationHistory = []) {
  if (!message || typeof message !== 'string') {
    return false;
  }

  // Direct human intervention triggers - terms that always route to a human
  const criticalPhrases = [
    'terrible service',
    'worst experience',
    'speak to manager',
    'speak to supervisor',
    'want to cancel',
    'cancel my order',
    'cancel my account',
    'file a complaint',
    'formal complaint',
    'refund immediately',
    'demand a refund',
    'absolutely unacceptable',
    'extremely disappointed',
    'ridiculous service'
  ];

  const lowercaseMessage = message.toLowerCase();
  
  // Check for explicit critical phrases
  if (criticalPhrases.some(phrase => lowercaseMessage.includes(phrase))) {
    return true;
  }
  
  // Analyze the emotion in the current message
  const emotionResult = analyzeEmotion(message);
  
  // Route to human if the emotion is significantly negative with sufficient confidence
  if (emotionResult.score < -0.4 && emotionResult.confidence > 0.7) {
    return true;
  }
  
  // Check for escalation patterns in conversation history
  if (conversationHistory && conversationHistory.length > 2) {
    // Get recent customer messages (up to last 5)
    const recentMessages = conversationHistory.slice(-5);
    const customerMessages = recentMessages.filter(msg => 
      typeof msg === 'object' && msg.isCustomer === true && msg.message
    );
    
    // Skip if not enough customer messages
    if (customerMessages.length >= 2) {
      // Analyze message emotions
      let totalNegativeScore = 0;
      let negativeMessages = 0;
      let repeatedQuestionsCount = 0;
      let lastSentiments = [];
      
      // Track similar questions/statements to detect frustration patterns
      const customerQuestions = customerMessages
        .filter(msg => msg.message.includes('?'))
        .map(msg => msg.message.toLowerCase());
      
      // Simple similarity detection for repeated questions
      if (customerQuestions.length > 1) {
        for (let i = 0; i < customerQuestions.length; i++) {
          for (let j = i + 1; j < customerQuestions.length; j++) {
            // Very simple similarity check - could be improved with better NLP
            const similarity = calculateSimilarity(customerQuestions[i], customerQuestions[j]);
            if (similarity > 0.6) {
              repeatedQuestionsCount++;
            }
          }
        }
      }
      
      // Analyze sentiment trend
      for (const msg of customerMessages) {
        const sentiment = analyzeEmotion(msg.message);
        lastSentiments.push(sentiment.score);
        
        if (sentiment.score < -0.2) {
          totalNegativeScore += sentiment.score;
          negativeMessages++;
        }
      }
      
      // Check for declining sentiment trend
      let sentimentDecline = false;
      if (lastSentiments.length >= 3) {
        // Check if sentiment is getting worse over time
        if (lastSentiments[lastSentiments.length-1] < lastSentiments[lastSentiments.length-3]) {
          sentimentDecline = true;
        }
      }
      
      // Route to human if:
      // 1. Multiple negative messages in the conversation
      // 2. Overall strong negative sentiment
      // 3. Sentiment is getting worse
      // 4. Customer is repeating similar questions (indicating frustration)
      if (
        (negativeMessages >= 2) || 
        (totalNegativeScore < -0.8) || 
        (sentimentDecline && lastSentiments[lastSentiments.length-1] < -0.2) ||
        (repeatedQuestionsCount >= 1)
      ) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Helper function to calculate simple text similarity
 * Uses a basic Jaccard similarity implementation
 * 
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @return {number} Similarity score 0-1
 */
function calculateSimilarity(str1, str2) {
  // Tokenize strings into word sets
  const words1 = new Set(str1.toLowerCase().split(/\W+/).filter(word => word.length > 2));
  const words2 = new Set(str2.toLowerCase().split(/\W+/).filter(word => word.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  // Find intersection
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  
  // Calculate Jaccard similarity
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

module.exports = {
  analyzeEmotion,
  needsHumanIntervention
}; 