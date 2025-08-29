# Docker Development Setup

This document describes how to set up and run the application using Docker for local development.

## Prerequisites

- Docker Desktop installed and running
- Git (for cloning the repository)

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd studio-deploy
   ```

2. **Set up environment variables**:
   - Copy and edit `.env.local` with your actual values
   - At minimum, update the Azure Storage credentials if you're testing file uploads

3. **Start the development environment**:
   
   **On Windows:**
   ```cmd
   scripts\dev-start.bat
   ```
   
   **On macOS/Linux:**
   ```bash
   chmod +x scripts/dev-start.sh
   ./scripts/dev-start.sh
   ```
   
   **Or manually:**
   ```bash
   docker-compose up --build -d
   ```

4. **Access the application**:
   - **App**: http://localhost:3000
   - **Database Admin**: http://localhost:8080
   - **Health Check**: http://localhost:3000/api/health

## Environment Variables

The following environment variables need to be configured in `.env.local`:

### Required
- `DATABASE_URL`: PostgreSQL connection string (automatically set for Docker)
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js authentication

### Optional (for full functionality)
- `AZURE_STORAGE_CONNECTION_STRING`: Azure Blob Storage connection string
- `AZURE_STORAGE_CONTAINER_NAME`: Azure Blob Storage container name
- `GOOGLE_API_KEY`: Google AI API key (if using AI features)

## Docker Services

The development environment includes:

1. **app**: Next.js application container
2. **postgres**: PostgreSQL database container
3. **adminer**: Web-based database administration tool

## Common Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Access database directly
docker-compose exec postgres psql -U postgres -d studio_dev

# Access app container shell
docker-compose exec app sh
```

## Development Workflow

1. Make changes to your code
2. The application will automatically detect changes (hot reloading)
3. Database changes require running migrations:
   ```bash
   docker-compose exec app npx prisma migrate dev
   ```

## Troubleshooting

### Container won't start
- Check Docker is running: `docker info`
- Check logs: `docker-compose logs app`
- Ensure ports 3000, 5432, and 8080 are not in use

### Database connection issues
- Ensure PostgreSQL container is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`

### File upload issues
- Verify Azure Storage credentials in `.env.local`
- Check container has internet access for Azure uploads

### Permission issues (Linux/macOS)
- Ensure scripts are executable: `chmod +x scripts/*.sh`

## Production-like Testing

To test the production build locally:

1. Remove volume mounts from `docker-compose.yml` (comment out the volumes section under `app`)
2. Rebuild: `docker-compose up --build -d`
3. This will use the standalone build from the Dockerfile instead of mounted source files

## Cleanup

To remove all containers and volumes:
```bash
docker-compose down -v
docker system prune -f
```
