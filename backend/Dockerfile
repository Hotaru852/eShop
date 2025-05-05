FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Create a .env file with default values
RUN echo "PORT=5000\nJWT_SECRET=eShop-super-secret-key-change-in-production\nOPENAI_API_KEY=" > .env

# Make sure the database directory exists and is writable
RUN mkdir -p /app/data
RUN touch /app/ecommerce.db
RUN chmod 755 /app/ecommerce.db

# Command to run the application
CMD ["node", "server.js"] 