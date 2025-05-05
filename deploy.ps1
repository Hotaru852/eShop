# eCommerce App PowerShell Deployment Script

Write-Host "Starting eCommerce App deployment..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
}
catch {
    Write-Host "Error: Docker is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
}
catch {
    Write-Host "Error: Docker Compose is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Check if Docker Desktop is running
$dockerRunning = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerRunning) {
    Write-Host "Warning: Docker Desktop does not appear to be running." -ForegroundColor Yellow
    $response = Read-Host "Do you want to continue anyway? (y/n)"
    if ($response.ToLower() -ne "y") {
        exit 0
    }
}

# Build and start the containers
Write-Host "Building and starting containers..." -ForegroundColor Cyan
docker-compose up -d --build

# Wait for containers to start properly
Write-Host "Waiting for containers to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Check if containers are running
$backendRunning = docker ps -q -f name=ecommerce-backend
$frontendRunning = docker ps -q -f name=ecommerce-frontend

if (-not $backendRunning) {
    Write-Host "Error: Backend container failed to start properly." -ForegroundColor Red
    Write-Host "Check the logs with: docker-compose logs backend" -ForegroundColor Yellow
    exit 1
}

if (-not $frontendRunning) {
    Write-Host "Error: Frontend container failed to start properly." -ForegroundColor Red
    Write-Host "Check the logs with: docker-compose logs frontend" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nDeployment successful!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5000" -ForegroundColor Cyan

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 