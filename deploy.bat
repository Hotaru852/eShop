@echo off
echo Starting eCommerce App deployment...

REM Check if Docker is installed
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker Compose is not installed.
    exit /b 1
)

REM Build and start the containers
echo Building and starting containers...
docker-compose up -d --build

REM Check if containers are running
docker ps -q -f name=ecommerce-backend > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Backend container failed to start properly.
    echo Please check the logs with: docker-compose logs backend
    exit /b 1
)

docker ps -q -f name=ecommerce-frontend > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Frontend container failed to start properly.
    echo Please check the logs with: docker-compose logs frontend
    exit /b 1
)

echo.
echo Deployment successful!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo Press any key to exit...
pause > nul 