#!/usr/bin/env node

/**
 * Environment Variables Check Script
 * Helps debug environment variable issues
 */

require('dotenv').config();

console.log('🔍 Environment Variables Check');
console.log('==============================');

// Check if .env file is being loaded
console.log('\n📁 .env File Check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');

// Check OpenAI configuration
console.log('\n🤖 OpenAI Configuration:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY?.substring(0, 7) || 'not set');

// Check database configuration
console.log('\n🗄️ Database Configuration:');
console.log('DB_HOST:', process.env.DB_HOST || 'not set');
console.log('DB_NAME:', process.env.DB_NAME || 'not set');
console.log('DB_USER:', process.env.DB_USER || 'not set');

// Check other important variables
console.log('\n🔧 Other Configuration:');
console.log('JWT_ACCESS_SECRET exists:', !!process.env.JWT_ACCESS_SECRET);
console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);

// List all environment variables that contain 'OPENAI'
console.log('\n🔍 All OpenAI-related env vars:');
const openaiVars = Object.keys(process.env).filter(key => key.includes('OPENAI'));
if (openaiVars.length > 0) {
  openaiVars.forEach(key => {
    console.log(`${key}: ${process.env[key] ? 'set' : 'not set'}`);
  });
} else {
  console.log('No OpenAI-related environment variables found');
}

console.log('\n✅ Check complete!'); 