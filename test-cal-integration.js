#!/usr/bin/env node

/**
 * Cal.com Integration Test Script
 * Tests all Cal.com endpoints and functionality
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_SELLER_USERNAME = process.env.CAL_USERNAME || 'demo-seller';

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

/**
 * Test endpoint
 */
async function testEndpoint(name, method, url, data = null, expectedStatus = 200) {
  try {
    log.info(`Testing: ${name}`);
    
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      log.success(`${name}: PASSED (${response.status})`);
      return { success: true, data: response.data };
    } else {
      log.error(`${name}: FAILED - Expected ${expectedStatus}, got ${response.status}`);
      return { success: false, error: `Expected ${expectedStatus}, got ${response.status}` };
    }
  } catch (error) {
    if (error.response) {
      log.error(`${name}: FAILED - ${error.response.status}: ${error.response.data?.error || error.message}`);
      return { success: false, error: `${error.response.status}: ${error.response.data?.error || error.message}` };
    } else {
      log.error(`${name}: FAILED - ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Test Cal.com health endpoint
 */
async function testHealthEndpoint() {
  return await testEndpoint(
    'Cal.com Health Check',
    'GET',
    '/api/cal/health'
  );
}

/**
 * Test booking link generation
 */
async function testBookingLink() {
  return await testEndpoint(
    'Generate Booking Link',
    'GET',
    `/api/cal/booking-link/seller-1`
  );
}

/**
 * Test available slots endpoint
 */
async function testAvailableSlots() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  return await testEndpoint(
    'Get Available Slots',
    'GET',
    `/api/cal/available-slots?sellerUsername=${TEST_SELLER_USERNAME}&date=${dateStr}&duration=30`
  );
}

/**
 * Test event types endpoint
 */
async function testEventTypes() {
  return await testEndpoint(
    'Get Event Types',
    'GET',
    `/api/cal/event-types/${TEST_SELLER_USERNAME}`
  );
}

/**
 * Test embed code generation
 */
async function testEmbedCode() {
  return await testEndpoint(
    'Generate Embed Code',
    'GET',
    `/api/cal/embed/${TEST_SELLER_USERNAME}`
  );
}

/**
 * Test booking creation (requires authentication)
 */
async function testBookingCreation() {
  const bookingData = {
    eventTypeId: 'test-event-type',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // Tomorrow + 30 min
    buyerEmail: 'test@example.com',
    buyerName: 'Test Buyer',
    gigId: 'test-gig-1',
    sellerId: 'seller-1'
  };

  return await testEndpoint(
    'Create Booking (Unauthenticated)',
    'POST',
    '/api/cal/book',
    bookingData,
    401 // Should fail without authentication
  );
}

/**
 * Test all endpoints
 */
async function testAllEndpoints() {
  log.header('🧪 Testing Cal.com Integration');
  
  const results = [];
  
  // Test health endpoint
  results.push(await testHealthEndpoint());
  
  // Test booking link generation
  results.push(await testBookingLink());
  
  // Test available slots
  results.push(await testAvailableSlots());
  
  // Test event types
  results.push(await testEventTypes());
  
  // Test embed code generation
  results.push(await testEmbedCode());
  
  // Test booking creation (should fail without auth)
  results.push(await testBookingCreation());
  
  return results;
}

/**
 * Generate test summary
 */
function generateSummary(results) {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  
  log.header('📊 Test Results Summary');
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    log.warning('\nFailed Tests:');
    results.forEach((result, index) => {
      if (!result.success) {
        console.log(`${index + 1}. ${result.error}`);
      }
    });
  }
  
  if (passed === total) {
    log.success('\n🎉 All tests passed! Cal.com integration is working correctly.');
  } else {
    log.warning('\n⚠️  Some tests failed. Check the configuration and try again.');
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const results = await testAllEndpoints();
    generateSummary(results);
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { testAllEndpoints };
