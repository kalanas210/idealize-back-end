#!/usr/bin/env node

/**
 * SocyAds SellerDashboard Test Script
 * Tests all SellerDashboard endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/seller/dashboard';

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
 * Test endpoint
 */
async function testEndpoint(name, url, params = {}) {
  try {
    log.info(`Testing ${name}...`);
    
    const response = await axios.get(url, { params });
    
    if (response.status === 200) {
      log.success(`${name}: SUCCESS (${response.status})`);
      console.log(`   Data:`, JSON.stringify(response.data, null, 2));
      return true;
    } else {
      log.error(`${name}: FAILED (${response.status})`);
      return false;
    }
  } catch (error) {
    log.error(`${name}: ERROR - ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test all SellerDashboard endpoints
 */
async function testAllEndpoints() {
  log.header('🧪 Testing SocyAds SellerDashboard Endpoints');
  
  const tests = [
    {
      name: 'Overview',
      url: `${BASE_URL}/overview`,
      params: { dateRange: '30days' }
    },
    {
      name: 'Orders',
      url: `${BASE_URL}/orders`,
      params: { status: 'all', page: 1, limit: 10 }
    },
    {
      name: 'Gigs',
      url: `${BASE_URL}/gigs`
    },
    {
      name: 'Earnings',
      url: `${BASE_URL}/earnings`,
      params: { period: '6months' }
    },
    {
      name: 'Analytics',
      url: `${BASE_URL}/analytics`,
      params: { dateRange: '30days' }
    },
    {
      name: 'Reviews',
      url: `${BASE_URL}/reviews`
    },
    {
      name: 'Activity',
      url: `${BASE_URL}/activity`,
      params: { limit: 10 }
    },
    {
      name: 'Transactions',
      url: `${BASE_URL}/transactions`,
      params: { page: 1, limit: 10 }
    },
    {
      name: 'Performance',
      url: `${BASE_URL}/performance`
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, test.params);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Add spacing between tests
  }

  log.header('📊 Test Results Summary');
  log.success(`Passed: ${passed}`);
  if (failed > 0) {
    log.error(`Failed: ${failed}`);
  }
  log.info(`Total: ${passed + failed}`);

  if (failed === 0) {
    log.success('🎉 All SellerDashboard endpoints are working correctly!');
  } else {
    log.warning('⚠️  Some endpoints failed. Check the server logs for details.');
  }
}

/**
 * Test with authentication (if needed)
 */
async function testWithAuth() {
  log.header('🔐 Testing with Authentication (Future)');
  log.info('Note: These endpoints require authentication tokens');
  log.info('For now, they will return mock data');
  log.info('To test with real auth, add Authorization header with JWT token');
}

/**
 * Main function
 */
async function main() {
  try {
    // Test without authentication (mock data)
    await testAllEndpoints();
    
    // Show auth testing info
    await testWithAuth();
    
  } catch (error) {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { testAllEndpoints }; 