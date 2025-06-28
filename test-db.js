const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Log the connection string (with password masked)
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      const maskedString = connectionString.replace(/:([^:@]+)@/, ':****@');
      console.log('Using connection string:', maskedString);
    } else {
      console.log('No DATABASE_URL found in environment variables');
    }

    // Try to connect to the database
    await prisma.$connect();
    console.log('Successfully connected to the database!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Query test successful:', result);
    
  } catch (error) {
    console.error('Database connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 