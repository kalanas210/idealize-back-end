#!/usr/bin/env node

/**
 * BuyerDashboard Test Script
 * Tests all BuyerDashboard endpoints to ensure they're working correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/buyer/dashboard';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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
 * Test a single endpoint
 */
async function testEndpoint(name, url, params = {}) {
  try {
    log.info(`Testing ${name}...`);
    
    const response = await axios.get(url, { params });
    
    if (response.status === 200 && response.data.success) {
      log.success(`${name}: ✅ Success`);
      console.log(`   Response: ${JSON.stringify(response.data.data || response.data, null, 2).substring(0, 200)}...`);
      return { success: true, data: response.data };
    } else {
      log.error(`${name}: ❌ Failed - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    log.error(`${name}: ❌ Error - ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Test all BuyerDashboard endpoints
 */
async function testAllEndpoints() {
  log.header('🧪 Testing BuyerDashboard Endpoints');
  
  const results = [];
  
  // Test Overview endpoint
  results.push(await testEndpoint(
    'Buyer Overview',
    `${BASE_URL}/overview`,
    { dateRange: '30days' }
  ));
  
  // Test Orders endpoint
  results.push(await testEndpoint(
    'Buyer Orders',
    `${BASE_URL}/orders`,
    { status: 'all', page: 1, limit: 10 }
  ));
  
  // Test Saved Influencers endpoint
  results.push(await testEndpoint(
    'Saved Influencers',
    `${BASE_URL}/saved-influencers`,
    { page: 1, limit: 10 }
  ));
  
  // Test Saved Gigs endpoint
  results.push(await testEndpoint(
    'Saved Gigs',
    `${BASE_URL}/saved-gigs`,
    { page: 1, limit: 10 }
  ));
  
  // Test Saved Items endpoint (combined)
  results.push(await testEndpoint(
    'Saved Items (All)',
    `${BASE_URL}/saved`,
    { filter: 'all', page: 1, limit: 10 }
  ));
  
  // Test Saved Items endpoint (influencers only)
  results.push(await testEndpoint(
    'Saved Items (Influencers)',
    `${BASE_URL}/saved`,
    { filter: 'influencers', page: 1, limit: 10 }
  ));
  
  // Test Saved Items endpoint (gigs only)
  results.push(await testEndpoint(
    'Saved Items (Gigs)',
    `${BASE_URL}/saved`,
    { filter: 'gigs', page: 1, limit: 10 }
  ));
  
  // Test Analytics endpoint
  results.push(await testEndpoint(
    'Buyer Analytics',
    `${BASE_URL}/analytics`,
    { dateRange: '30days' }
  ));
  
  // Test Billing endpoint
  results.push(await testEndpoint(
    'Buyer Billing',
    `${BASE_URL}/billing`,
    { page: 1, limit: 10 }
  ));
  
  // Test Activity endpoint
  results.push(await testEndpoint(
    'Recent Activity',
    `${BASE_URL}/activity`,
    { limit: 10 }
  ));
  
  // Test Performance endpoint
  results.push(await testEndpoint(
    'Performance Metrics',
    `${BASE_URL}/performance`
  ));
  
  // Test Toggle Saved Influencer endpoint
  try {
    log.info('Testing Toggle Saved Influencer...');
    const response = await axios.post(`${BASE_URL}/saved-influencers/test-influencer-id`);
    
    if (response.status === 200 && response.data.success) {
      log.success('Toggle Saved Influencer: ✅ Success');
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      results.push({ success: true, data: response.data });
    } else {
      log.error('Toggle Saved Influencer: ❌ Failed');
      results.push({ success: false, error: response.data });
    }
  } catch (error) {
    log.error(`Toggle Saved Influencer: ❌ Error - ${error.message}`);
    results.push({ success: false, error: error.message });
  }
  
  // Test Toggle Saved Gig endpoint
  try {
    log.info('Testing Toggle Saved Gig...');
    const response = await axios.post(`${BASE_URL}/saved-gigs/test-gig-id`);
    
    if (response.status === 200 && response.data.success) {
      log.success('Toggle Saved Gig: ✅ Success');
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      results.push({ success: true, data: response.data });
    } else {
      log.error('Toggle Saved Gig: ❌ Failed');
      results.push({ success: false, error: response.data });
    }
  } catch (error) {
    log.error(`Toggle Saved Gig: ❌ Error - ${error.message}`);
    results.push({ success: false, error: error.message });
  }
  
  return results;
}

/**
 * Test with different parameters
 */
async function testWithParams() {
  log.header('🔧 Testing with Different Parameters');
  
  // Test different date ranges
  await testEndpoint('Overview (7 days)', `${BASE_URL}/overview`, { dateRange: '7days' });
  await testEndpoint('Overview (90 days)', `${BASE_URL}/overview`, { dateRange: '90days' });
  
  // Test different order filters
  await testEndpoint('Orders (Completed)', `${BASE_URL}/orders`, { status: 'completed' });
  await testEndpoint('Orders (In Progress)', `${BASE_URL}/orders`, { status: 'in_progress' });
  await testEndpoint('Orders (Search)', `${BASE_URL}/orders`, { search: 'tech' });
  
  // Test different analytics periods
  await testEndpoint('Analytics (7 days)', `${BASE_URL}/analytics`, { dateRange: '7days' });
  await testEndpoint('Analytics (6 months)', `${BASE_URL}/analytics`, { dateRange: '6months' });
}

/**
 * Generate test summary
 */
function generateSummary(results) {
  log.header('📊 Test Summary');
  
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = totalTests - successfulTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Successful: ${successfulTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    log.warning('Some tests failed. Check the logs above for details.');
  } else {
    log.success('All BuyerDashboard endpoints are working correctly! 🎉');
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log.header('🚀 BuyerDashboard API Testing');
    
    // Test if server is running
    try {
      await axios.get('http://localhost:5000/health');
      log.success('Server is running');
    } catch (error) {
      log.error('Server is not running. Please start the server first: npm run dev');
      process.exit(1);
    }
    
    // Run all tests
    const results = await testAllEndpoints();
    
    // Test with different parameters
    await testWithParams();
    
    // Generate summary
    generateSummary(results);
    
    log.header('🎯 BuyerDashboard Testing Complete');
    log.info('You can now test the endpoints manually:');
    log.info('• Swagger UI: http://localhost:5000/api/docs');
    log.info('• Postman: Import the endpoints');
    log.info('• Frontend: Connect to these endpoints');
    
  } catch (error) {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { testAllEndpoints, testEndpoint }; 