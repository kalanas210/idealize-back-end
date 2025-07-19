#!/usr/bin/env node

/**
 * AI Feature Setup Script
 * Helps configure the OpenAI API key and test the AI feature
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupAI() {
  try {
    log.header('🤖 AI Feature Setup');
    
    const envPath = path.join(__dirname, '.env');
    const envExamplePath = path.join(__dirname, 'env.example');
    
    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
      log.warning('.env file not found. Creating from template...');
      
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        log.success('.env file created from template');
      } else {
        log.error('env.example file not found. Please create a .env file manually.');
        return;
      }
    }
    
    // Read current .env content
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if OpenAI API key is already set
    if (envContent.includes('OPENAI_API_KEY=your_openai_api_key_here') || 
        !envContent.includes('OPENAI_API_KEY=')) {
      
      log.info('OpenAI API key not configured.');
      log.info('To use the full AI feature, you need an OpenAI API key.');
      log.info('Get one at: https://platform.openai.com/api-keys');
      
      const hasKey = await question('Do you have an OpenAI API key? (y/n): ');
      
      if (hasKey.toLowerCase() === 'y' || hasKey.toLowerCase() === 'yes') {
        const apiKey = await question('Enter your OpenAI API key: ');
        
        if (apiKey.trim()) {
          // Update .env file
          if (envContent.includes('OPENAI_API_KEY=your_openai_api_key_here')) {
            envContent = envContent.replace('OPENAI_API_KEY=your_openai_api_key_here', `OPENAI_API_KEY=${apiKey.trim()}`);
          } else {
            envContent += `\n# OpenAI Configuration\nOPENAI_API_KEY=${apiKey.trim()}\n`;
          }
          
          fs.writeFileSync(envPath, envContent);
          log.success('OpenAI API key configured successfully!');
        } else {
          log.warning('No API key provided. AI feature will use mock responses.');
        }
      } else {
        log.info('No problem! The AI feature will work with mock responses for testing.');
        log.info('You can always add your API key later to the .env file.');
      }
    } else {
      log.success('OpenAI API key is already configured!');
    }
    
    log.header('🎉 Setup Complete!');
    log.success('Your AI feature is ready to use.');
    log.info('Next steps:');
    log.info('1. Start the backend: npm run dev');
    log.info('2. Start the frontend: npm start (in frontend directory)');
    log.info('3. Test the AI feature on the homepage');
    log.info('4. Optional: Run tests with: npm run test:ai');
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupAI();
}

module.exports = { setupAI }; 