#!/bin/bash
# Development startup script for Docker Compose

echo "🚀 Starting Studio Deploy development environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your environment variables."
    echo "You can use .env.local as a template."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Build and start the services
echo "🏗️  Building and starting containers..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Development environment is ready!"
    echo ""
    echo "🌐 Application: http://localhost:3000"
    echo "🗄️  Database Admin: http://localhost:8080"
    echo "📊 Health Check: http://localhost:3000/api/health"
    echo ""
    echo "📝 To view logs: docker-compose logs -f app"
    echo "🛑 To stop: docker-compose down"
    echo ""
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
