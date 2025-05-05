# eCommerce App Docker Setup

This document explains how to run the eCommerce application using Docker, making it easy to share and deploy.

## Prerequisites

- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- WSL2 (Windows Subsystem for Linux 2) - Recommended for better performance

## Windows Configuration

### Docker Desktop Setup

1. Make sure Docker Desktop is installed and running
2. Ensure WSL2 integration is enabled in Docker Desktop settings
3. Make sure the required file sharing permissions are set up

### Important Windows Notes

- Use Docker volumes instead of file mounts for better performance and compatibility
- Use the provided `deploy.bat` script to deploy on Windows
- If you encounter CRLF/LF line ending issues, use `.gitattributes` to ensure consistent line endings

## Configuration

### Environment Variables

Before running the application, you may want to configure the following environment variables in the `docker-compose.yml` file:

#### Backend
- `PORT`: The port on which the backend server will run (default: 5000)
- `JWT_SECRET`: Secret key for JWT token generation (change this for production)
- `OPENAI_API_KEY`: API key for OpenAI if you want to use the chatbot features

## Running the Application on Windows

1. Clone the repository to your local machine:

```batch
git clone <repository-url>
cd ecommerce-app
```

2. Run the deployment script:

```batch
deploy.bat
```

Or manually build and start the containers:

```batch
docker-compose up -d --build
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Architecture

The application uses the following Docker architecture:

- **Frontend Container**: React application served by Nginx
- **Backend Container**: Node.js Express server with Socket.IO for real-time chat
- **Docker Network**: Both containers communicate on a shared network
- **Database**: SQLite database file is stored in a named Docker volume for persistence

The Nginx configuration in the frontend container proxies API and Socket.IO requests to the backend container, allowing everything to be accessed through a single origin (localhost:3000).

## Stopping the Application

To stop the running containers:

```batch
docker-compose down
```

To stop the containers and remove the network:

```batch
docker-compose down --remove-orphans
```

## Troubleshooting on Windows

### Connection Issues

If the frontend can't connect to the backend:

1. Check if the containers are running: `docker ps`
2. Try accessing the backend directly in a browser: http://localhost:5000/api/products
3. Verify Docker networking is working: `docker network inspect ecommerce-network`
4. Check Windows Defender Firewall settings - make sure the required ports are allowed

### Database Issues

The SQLite database is persisted through a Docker volume. If you encounter database issues:

1. Check that the Docker volume is properly created: `docker volume ls`
2. You can inspect the volume with: `docker volume inspect db-data`
3. If needed, recreate the volume: 
   ```batch
   docker-compose down -v
   docker volume create db-data
   docker-compose up -d
   ```

### WSL2 Issues

If you're having trouble with the WSL2 backend:

1. Make sure WSL2 is properly installed: `wsl --status`
2. Restart Docker Desktop
3. Try restarting the Docker service: `net stop com.docker.service` and `net start com.docker.service`

## Development Workflow

### Making Changes

When you make changes to the code:

1. Rebuild the containers:

```batch
docker-compose up -d --build
```

### Viewing Logs

To see logs from the containers:

```batch
REM All services
docker-compose logs -f

REM Just the backend
docker-compose logs -f backend

REM Just the frontend
docker-compose logs -f frontend
```

## For Team Members

When receiving this codebase:

1. Ensure Docker Desktop for Windows is installed and running with WSL2 enabled
2. Run `deploy.bat` to start the application
3. Access the frontend at http://localhost:3000

The staff login credentials are:
- Username: support_staff
- Email: admin@eshop.com
- Password: staffpass123

### Emotion Detection Development

The emotion detection algorithm is located in `backend/emotionDetector.js`. You can implement your own algorithm by editing the `analyzeEmotion` function. After making changes, rebuild the Docker containers to apply them. 