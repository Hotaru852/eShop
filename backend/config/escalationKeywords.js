/**
 * Escalation Keywords Configuration
 * 
 * This file contains keywords that will automatically route customer messages
 * to human support staff, bypassing the AI assistant.
 * 
 * Staff can edit this file to add or remove keywords without modifying core code.
 */

// Keywords that should automatically trigger human intervention
const escalationKeywords = [
  // Management/escalation terms
  'manager',
  'manag',      // Catch variations like "management", "managed", etc.
  'supervis',   // Catch "supervisor", "supervision" 
  'escalate',
  'escalation',
  'staff',
  'speak to',
  'talk to',
  
  // Urgency indicators
  'urgent',
  'immediate',
  'asap',
  'emergency',
  
  // Complaint indicators
  'complaint',
  'disappointed',
  'unhappy',
  'dissatisfied',
  'upset',
  'angry',
  
  // Transaction-related
  'refund',
  'money back',
  'cancel',
  'cancelation',
  'cancellation',
  'return policy',
  'charge',
  'overcharged',
  
  // Legal/escalation threats
  'demand',
  'lawsuit',
  'legal',
  'attorney',
  'lawyer',
  'sue',
  'court',
  
  // Review/rating threats
  'review',     // For "negative review"
  'rating',     // For threats to leave bad ratings
  'bbb',        // Better Business Bureau
  'report',     // For "I'll report you"
  'social media' // Threats to post on social media
];

// Human assistance explicit requests
const humanAssistancePatterns = [
  'speak to human',
  'talk to human', 
  'real person',
  'real representative',
  'speak to representative',
  'connect me with agent',
  'connect with support',
  'human support',
  'live agent',
  'human agent',
  'not a bot',
  'stop bot'
];

// Financial pattern for detecting money amounts
const financialPatterns = {
  moneyRegex: /\$\d+|\d+\s*dollars|\d+\s*usd|\d+\s*€|\d+\s*euro/i,
  refundTerms: /refund|return|money back|charge|credit|debit|payment|transaction/i
};

module.exports = {
  escalationKeywords,
  humanAssistancePatterns,
  financialPatterns
}; 