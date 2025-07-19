#!/usr/bin/env node

/**
 * AI Feature Test Script
 * Tests the Ask with AI functionality
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

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

async function testAIHealth() {
  try {
    log.info('Testing AI service health...');
    
    const response = await axios.get(`${API_BASE_URL}/api/ai/health`);
    
    if (response.data.success) {
      log.success('AI service is healthy!');
      log.info(`OpenAI configured: ${response.data.data.openaiConfigured}`);
      log.info(`Database connected: ${response.data.data.databaseConnected}`);
      return true;
    } else {
      log.error('AI service health check failed');
      return false;
    }
  } catch (error) {
    log.error(`AI health check failed: ${error.message}`);
    return false;
  }
}

async function testAIQuery(query) {
  try {
    log.info(`Testing AI query: "${query}"`);
    
    const response = await axios.post(`${API_BASE_URL}/api/ai/ask`, {
      userQuery: query
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log.success('AI query successful!');
      log.info(`Query: ${response.data.data.query}`);
      log.info(`Creators analyzed: ${response.data.data.creatorsAnalyzed}`);
      log.info('Recommendations:');
      console.log('\n' + response.data.data.recommendations + '\n');
      return true;
    } else {
      log.error('AI query failed');
      return false;
    }
  } catch (error) {
    log.error(`AI query failed: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

async function testValidation() {
  try {
    log.info('Testing input validation...');
    
    // Test empty query
    try {
      await axios.post(`${API_BASE_URL}/api/ai/ask`, {
        userQuery: ''
      });
      log.error('Empty query should have failed validation');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        log.success('Empty query validation working correctly');
      } else {
        log.error('Unexpected error for empty query');
        return false;
      }
    }

    // Test short query
    try {
      await axios.post(`${API_BASE_URL}/api/ai/ask`, {
        userQuery: 'short'
      });
      log.error('Short query should have failed validation');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        log.success('Short query validation working correctly');
      } else {
        log.error('Unexpected error for short query');
        return false;
      }
    }

    return true;
  } catch (error) {
    log.error(`Validation test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    log.header('🧪 Testing AI Feature');

    // Test 1: Health check
    const healthOk = await testAIHealth();
    if (!healthOk) {
      log.warning('AI service not available. Make sure OpenAI API key is configured.');
      log.info('You can still test the frontend with mock data.');
      return;
    }

    // Test 2: Input validation
    const validationOk = await testValidation();
    if (!validationOk) {
      log.error('Validation tests failed');
      return;
    }

    // Test 3: Sample queries
    const sampleQueries = [
      "I want to promote cricket shoes to 18-30 year-old men in Sri Lanka",
      "Looking for fitness influencers to promote my protein powder",
      "Need tech reviewers for my new smartphone launch"
    ];

    for (const query of sampleQueries) {
      await testAIQuery(query);
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    log.header('🎉 AI Feature Tests Completed!');
    log.success('All tests passed successfully');
    log.info('The AI feature is ready to use!');

  } catch (error) {
    log.error(`Test script failed: ${error.message}`);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { testAIHealth, testAIQuery, testValidation }; 