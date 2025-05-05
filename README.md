# eShop - E-Commerce Application with Intelligent Customer Support

An e-commerce web application featuring an intelligent chat system with emotion detection for enhanced customer support.

## Features

- **Product Browsing**: Browse and search through various products with filtering options
- **User Authentication**: Register, login, and manage user profiles
- **Shopping Cart**: Add products to cart and manage orders
- **Customer Support Chat**: Real-time chat for customer assistance
- **Emotion Detection**: Automatically detects customer emotions and routes negative interactions to human support
- **Dockerized**: Easy deployment with Docker for both development and production

## Prerequisites

- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- WSL2 (Windows Subsystem for Linux 2) - Recommended for better performance
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Hotaru852/eShop.git
cd eShop
```

### 2. Environment Configuration

The application uses environment variables for configuration. You may want to customize:

#### For LLM-Powered Chatbot (Optional)
Create a `.env` file in the `backend` directory with the following content:
```
OPENAI_API_KEY=your_openai_api_key_here
MODEL_NAME=gpt-3.5-turbo
MAX_TOKENS=150
TEMPERATURE=0.7
```

### 3. Deployment

#### Windows Deployment

Run the deployment script:
```
deploy.bat
```

Or using PowerShell:
```
.\deploy.ps1
```

#### Manual Deployment
Or manually build and start the containers:
```
docker-compose up -d --build
```

### 4. Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:3000/admin (login with admin credentials)

### 5. Admin Login Credentials

- **Username**: support_staff
- **Email**: admin@eshop.com
- **Password**: staffpass123

## Architecture

The application consists of:

- **Frontend**: React.js application with Redux for state management
- **Backend**: Node.js Express server with Socket.IO for real-time chat
- **Database**: SQLite database stored in a Docker volume for persistence
- **Chat System**: Real-time chat with LLM integration and emotion detection
- **Docker**: Containerized deployment for easy sharing and deployment

## Development

### Project Structure

```
eShop/
├── frontend/               # React frontend application
├── backend/                # Node.js backend server
├── docker-compose.yml      # Docker configuration
├── Dockerfile.frontend     # Frontend container configuration
├── Dockerfile.backend      # Backend container configuration
├── nginx.conf              # Nginx configuration for the frontend
├── deploy.bat              # Windows batch script for deployment
└── deploy.ps1              # Windows PowerShell script for deployment
```

### Making Changes

After making changes to the code, rebuild the containers:
```
docker-compose up -d --build
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Just the backend
docker-compose logs -f backend

# Just the frontend
docker-compose logs -f frontend
```

## Intelligent Chat System

### Chat Features

- **Real-time Messaging**: Instant communication between customers and support
- **Emotion Detection**: Analyzes customer messages for emotional content
- **Automatic Routing**: Routes negative interactions to human support representatives
- **LLM Integration**: Uses language models for automated responses
- **Support Dashboard**: Admin interface for managing customer interactions

### Customizing Emotion Detection

The emotion detection algorithm is in `backend/emotionDetector.js`. You can implement your own algorithm by modifying the `analyzeEmotion` function.

## Stopping the Application

```bash
# Stop the containers
docker-compose down

# Stop and remove volumes (will delete database)
docker-compose down -v
```

## Troubleshooting

### Database Issues

The SQLite database is persisted through a Docker volume. If you encounter database issues:

1. Check that the Docker volume is properly created: `docker volume ls`
2. You can inspect the volume with: `docker volume inspect db-data`
3. If needed, recreate the volume:
   ```
   docker-compose down -v
   docker volume create db-data
   docker-compose up -d
   ```

### Connection Issues

If the frontend can't connect to the backend:

1. Check if the containers are running: `docker ps`
2. Try accessing the backend directly: http://localhost:5000/api/products
3. Verify Docker networking is working: `docker network inspect ecommerce-network`
4. Check Windows Defender Firewall settings

## License

This project is intended for educational purposes only. 