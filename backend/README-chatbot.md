# LLM-Powered Customer Support Chatbot

This e-commerce application now includes an AI-powered customer support chatbot using OpenAI's GPT models.

## Setup Instructions

1. **Set up API Keys**:
   - You need an OpenAI API key to use the LLM functionality
   - Create a `.env` file in the `backend` directory with the following content:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   MODEL_NAME=gpt-3.5-turbo
   MAX_TOKENS=150
   TEMPERATURE=0.7
   ```
   - Replace `your_openai_api_key_here` with your actual OpenAI API key
   - Adjust other parameters as needed:
     - `MODEL_NAME`: The OpenAI model to use (e.g., gpt-3.5-turbo, gpt-4)
     - `MAX_TOKENS`: Maximum response length (longer = more expensive)
     - `TEMPERATURE`: Controls randomness (0.0-1.0, lower = more factual)

2. **Install Dependencies**:
   - Run `npm install openai dotenv` in the backend directory

## Features

- **Natural Language Understanding**: The chatbot can understand and respond to a wide variety of customer queries without predefined keywords
- **Context-Aware Responses**: Maintains conversation history to provide coherent follow-up responses
- **Failover Mechanism**: Falls back to human customer support for complex queries
- **Typing Indicators**: Shows a "typing" indicator when the AI is generating a response
- **Conversation Memory**: Stores conversation history per user for personalized support

## How It Works

1. The chatbot uses a system prompt that defines its behavior and provides information about the e-commerce store
2. When a customer sends a message, it:
   - Checks if the query requires human intervention
   - If not, sends the message to the LLM API with conversation context
   - Shows a typing indicator while waiting for a response
   - Displays the AI-generated response to the customer

## Customization

- Modify the system prompt in `llmChatbot.js` to change the chatbot's personality or add specific information about your store
- Adjust the triggering conditions in `shouldUseLLM()` to control when the bot should defer to human support

## Limitations

- Requires an active internet connection and OpenAI API key
- API usage incurs costs based on token usage
- May occasionally provide incorrect information if not properly guided by the system prompt 