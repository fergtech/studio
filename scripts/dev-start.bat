@echo off
REM Development startup script for Docker Compose on Windows

echo 🚀 Starting Studio Deploy development environment...

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local file not found!
    echo Please create .env.local with your environment variables.
    echo You can use the created .env.local as a template.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Build and start the services
echo 🏗️  Building and starting containers...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    echo ❌ Some services failed to start. Check logs with: docker-compose logs
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Development environment is ready!
    echo.
    echo 🌐 Application: http://localhost:3000
    echo 🗄️  Database Admin: http://localhost:8080
    echo 📊 Health Check: http://localhost:3000/api/health
    echo.
    echo 📝 To view logs: docker-compose logs -f app
    echo 🛑 To stop: docker-compose down
    echo.
)

pause
