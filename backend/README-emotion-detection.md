# Emotion Detection for Customer Support

This system enhances the chat experience by automatically detecting customer emotions and routing negative interactions to human support representatives.

## How It Works

1. **Emotion Analysis**: When a customer sends a message, the system analyzes it for emotional content
2. **Automated Handling**: Positive or neutral emotions are handled by the LLM chatbot
3. **Human Intervention**: Negative emotions trigger automatic escalation to a human representative
4. **Seamless Transition**: Customers are notified when their conversation is being handed off to a human

## Implementing Your Custom Emotion Detection

The system provides a framework with placeholder functions for you to implement your own emotion detection algorithm:

### File Structure

- `emotionDetector.js`: Contains the core emotion detection logic
- `llmChatbot.js`: Integrates with the emotion detection system
- `server.js`: Handles routing and customer notifications

### Implementation Steps

1. **Open the `emotionDetector.js` file**
2. **Find the `analyzeEmotion` function**:
```javascript
function analyzeEmotion(message) {
  // This is a placeholder for the actual emotion detection algorithm
  // TODO: Implement your custom emotion recognition algorithm here
  
  // Default placeholder implementation (will be replaced)
  // Simply returns a neutral placeholder response
  return {
    score: 0, // -1 to 1 scale where negative numbers indicate negative emotions
    emotion: 'neutral', // primary emotion detected: 'neutral', 'happy', 'sad', 'angry', 'frustrated', etc.
    needsHuman: false, // whether this emotion warrants human intervention
    confidence: 0.5, // confidence in the detection (0-1)
  };
}
```

3. **Replace the placeholder with your implementation**:
   - You can use NLP libraries, sentiment analysis, or machine learning models
   - Return the expected object structure with score, emotion, needsHuman, and confidence values
   - The system will use these values to determine routing

## Approaches to Emotion Detection

Here are several approaches you might consider for implementing emotion detection:

1. **Rule-based Systems**:
   - Keyword matching with emotional terms
   - Pattern recognition for sentence structures that express emotion
   - Simple scoring based on positive/negative word counts

2. **Machine Learning Models**:
   - Train a classifier on labeled emotional text data
   - Use pre-trained sentiment analysis models
   - Implement transfer learning from existing emotion detection models

3. **External APIs**:
   - Integrate with sentiment analysis services like Google Cloud NLP, AWS Comprehend, or IBM Watson
   - Connect to specialized emotion detection APIs

4. **Hybrid Approaches**:
   - Combine rules with machine learning for better accuracy
   - Use multiple detection methods and aggregate results

## Testing Your Implementation

The system includes a basic testing mechanism through the chat interface:

1. Use negative or emotional language in the customer chat
2. Verify that the system correctly identifies the emotion
3. Check that appropriate handoffs to human support occur

## Admin Interface

Customer service representatives can access the admin panel at `/admin/chat` to:

1. See all ongoing conversations
2. View conversations flagged for human attention
3. Join conversations and provide personalized support
4. See the emotion detection reason for escalation

## Advanced Configuration

You can adjust the sensitivity of the emotion detection system by modifying thresholds in the `needsHumanIntervention` function:

- Adjust score thresholds for when a message should be escalated
- Modify the confidence level required for escalation
- Change the critical phrases that always trigger human intervention
- Adjust the conversation pattern detection parameters 