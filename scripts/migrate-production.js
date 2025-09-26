#!/usr/bin/env node

// Migration script to run Prisma db push in production
const { execSync } = require('child_process');

console.log('🚀 Running production database migration...');

try {
  // Run prisma db push to sync schema
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: process.env
  });

  console.log('✅ Database migration completed successfully!');
} catch (error) {
  console.error('❌ Database migration failed:', error.message);
  process.exit(1);
}