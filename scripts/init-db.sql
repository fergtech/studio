-- Database initialization script for local development
-- This script runs when the PostgreSQL container starts for the first time

-- The database 'studio_dev' is already created by the POSTGRES_DB environment variable
-- This script can be used for any additional setup if needed

-- Example: Create extensions if your app needs them
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- You can add any initial data or additional setup here
-- For now, we'll just add a comment to indicate the database is ready
SELECT 'Database studio_dev initialized successfully' as message;
