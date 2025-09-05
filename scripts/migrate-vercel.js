#!/usr/bin/env node

const { execSync } = require('child_process');

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMigration(attempt = 1) {
  try {
    console.log(`🔄 Attempting migration (attempt ${attempt}/${MAX_RETRIES})`);
    
    execSync('prisma migrate deploy --skip-generate', {
      stdio: 'inherit',
      timeout: 30000, // 30 second timeout
      env: {
        ...process.env,
        // Add connection pool settings for better reliability
        DATABASE_URL: process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'connection_limit=5&pool_timeout=20&connect_timeout=30',
      }
    });
    
    console.log('✅ Migration completed successfully');
    return true;
    
  } catch (error) {
    console.error(`❌ Migration attempt ${attempt} failed:`, error.message);
    
    if (attempt < MAX_RETRIES) {
      console.log(`⏳ Waiting ${RETRY_DELAY/1000}s before retry...`);
      await sleep(RETRY_DELAY);
      return runMigration(attempt + 1);
    } else {
      console.error('💥 All migration attempts failed');
      throw error;
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting Vercel migration process...');
    
    // First generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('prisma generate', { stdio: 'inherit' });
    
    // Then run migration with retries
    await runMigration();
    
    console.log('🎉 Migration process completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Migration process failed:', error.message);
    process.exit(1);
  }
}

main();