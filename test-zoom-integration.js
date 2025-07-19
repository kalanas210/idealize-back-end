#!/usr/bin/env node

/**
 * Zoom Integration Test Script
 * Tests all Zoom API endpoints and functionality
 */

const axios = require('axios');
require('dotenv').config();

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

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test data
const testMeetingData = {
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  duration: 30,
  topic: 'Test SocyAds Consultation',
  timezone: 'UTC',
  sellerId: '550e8400-e29b-41d4-a716-446655440000', // Test UUID
  gigId: '550e8400-e29b-41d4-a716-446655440001' // Test UUID
};

// Mock JWT token (in real scenario, this would come from authentication)
const mockJWTToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTcwMzE2MDAwMCwiZXhwIjoxNzAzMjQ2NDAwfQ.test';

/**
 * Test API endpoint
 */
async function testEndpoint(name, method, endpoint, data = null, expectedStatus = 200) {
  try {
    log.info(`Testing ${name}...`);
    
    const config = {
      method,
      url: `${API_BASE_URL}/api/zoom${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockJWTToken}`
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      log.success(`${name} - Status: ${response.status}`);
      return { success: true, data: response.data };
    } else {
      log.error(`${name} - Expected status ${expectedStatus}, got ${response.status}`);
      return { success: false, error: `Status mismatch: ${response.status}` };
    }
  } catch (error) {
    if (error.response) {
      log.error(`${name} - Error: ${error.response.status} - ${error.response.data?.message || error.message}`);
      return { success: false, error: error.response.data?.message || error.message };
    } else {
      log.error(`${name} - Network error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Test Zoom service functionality
 */
async function testZoomService() {
  log.header('🧪 Testing Zoom Service');

  // Test 1: Schedule a meeting
  log.info('Test 1: Schedule a meeting');
  const scheduleResult = await testEndpoint(
    'Schedule Meeting',
    'POST',
    '/meetings',
    testMeetingData,
    201
  );

  if (!scheduleResult.success) {
    log.error('Failed to schedule meeting. Stopping tests.');
    return;
  }

  const meetingId = scheduleResult.data?.data?.meetingId;
  const meetingRecordId = scheduleResult.data?.data?.id;

  log.success(`Meeting scheduled with ID: ${meetingId}`);

  // Test 2: Get user's meetings
  log.info('Test 2: Get user meetings');
  await testEndpoint(
    'Get User Meetings',
    'GET',
    '/meetings?role=buyer&page=1&limit=10',
    null,
    200
  );

  // Test 3: Get specific meeting details
  if (meetingId) {
    log.info('Test 3: Get meeting details');
    await testEndpoint(
      'Get Meeting Details',
      'GET',
      `/meetings/${meetingId}`,
      null,
      200
    );
  }

  // Test 4: Update meeting
  if (meetingId) {
    log.info('Test 4: Update meeting');
    const updateData = {
      topic: 'Updated Test Meeting Topic',
      duration: 45
    };
    await testEndpoint(
      'Update Meeting',
      'PATCH',
      `/meetings/${meetingId}`,
      updateData,
      200
    );
  }

  // Test 5: Join meeting
  if (meetingId) {
    log.info('Test 5: Join meeting');
    await testEndpoint(
      'Join Meeting',
      'POST',
      `/meetings/${meetingId}/join`,
      null,
      200
    );
  }

  // Test 6: Cancel meeting
  if (meetingId) {
    log.info('Test 6: Cancel meeting');
    await testEndpoint(
      'Cancel Meeting',
      'DELETE',
      `/meetings/${meetingId}`,
      null,
      200
    );
  }
}

/**
 * Test validation scenarios
 */
async function testValidationScenarios() {
  log.header('🔍 Testing Validation Scenarios');

  // Test 1: Missing required fields
  log.info('Test 1: Missing required fields');
  await testEndpoint(
    'Missing Fields',
    'POST',
    '/meetings',
    { topic: 'Test' }, // Missing startTime, sellerId, gigId
    null,
    400
  );

  // Test 2: Past start time
  log.info('Test 2: Past start time');
  const pastMeetingData = {
    ...testMeetingData,
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
  };
  await testEndpoint(
    'Past Start Time',
    'POST',
    '/meetings',
    pastMeetingData,
    null,
    400
  );

  // Test 3: Invalid duration
  log.info('Test 3: Invalid duration');
  const invalidDurationData = {
    ...testMeetingData,
    duration: 5 // Too short
  };
  await testEndpoint(
    'Invalid Duration',
    'POST',
    '/meetings',
    invalidDurationData,
    null,
    400
  );

  // Test 4: Invalid meeting ID
  log.info('Test 4: Invalid meeting ID');
  await testEndpoint(
    'Invalid Meeting ID',
    'GET',
    '/meetings/invalid-id',
    null,
    404
  );
}

/**
 * Test authentication scenarios
 */
async function testAuthenticationScenarios() {
  log.header('🔐 Testing Authentication Scenarios');

  // Test 1: No authentication token
  log.info('Test 1: No authentication token');
  try {
    await axios.post(`${API_BASE_URL}/api/zoom/meetings`, testMeetingData, {
      headers: { 'Content-Type': 'application/json' }
    });
    log.error('No auth test should have failed');
  } catch (error) {
    if (error.response?.status === 401) {
      log.success('No auth test - Correctly rejected');
    } else {
      log.error(`No auth test - Unexpected error: ${error.response?.status}`);
    }
  }

  // Test 2: Invalid authentication token
  log.info('Test 2: Invalid authentication token');
  try {
    await axios.post(`${API_BASE_URL}/api/zoom/meetings`, testMeetingData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });
    log.error('Invalid auth test should have failed');
  } catch (error) {
    if (error.response?.status === 401) {
      log.success('Invalid auth test - Correctly rejected');
    } else {
      log.error(`Invalid auth test - Unexpected error: ${error.response?.status}`);
    }
  }
}

/**
 * Test Zoom API connectivity
 */
async function testZoomAPIConnectivity() {
  log.header('🌐 Testing Zoom API Connectivity');

  // Check if Zoom credentials are configured
  const requiredEnvVars = ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    log.warning(`Missing Zoom environment variables: ${missingVars.join(', ')}`);
    log.info('Zoom API tests will be skipped. Please configure Zoom credentials in .env file');
    return false;
  }

  log.success('Zoom credentials found in environment variables');
  return true;
}

/**
 * Generate test summary
 */
function generateSummary(results) {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;

  log.header('📊 Test Summary');
  log.info(`Total tests: ${total}`);
  log.success(`Passed: ${passed}`);
  log.error(`Failed: ${failed}`);

  if (failed > 0) {
    log.warning('Some tests failed. Check the output above for details.');
  } else {
    log.success('All tests passed! 🎉');
  }
}

/**
 * Main test function
 */
async function main() {
  log.header('🚀 Zoom Integration Test Suite');

  try {
    // Check Zoom API connectivity
    const zoomConfigured = await testZoomAPIConnectivity();

    if (zoomConfigured) {
      // Test core functionality
      await testZoomService();
      
      // Test validation scenarios
      await testValidationScenarios();
    }

    // Test authentication scenarios (these don't require Zoom API)
    await testAuthenticationScenarios();

    log.header('🎉 Zoom Integration Tests Completed!');
    log.info('Next steps:');
    log.info('1. Configure Zoom credentials in .env file');
    log.info('2. Run the setup script: npm run setup');
    log.info('3. Test with real authentication tokens');
    log.info('4. Check the API documentation at: http://localhost:5000/api/docs');

  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { testZoomService, testValidationScenarios, testAuthenticationScenarios }; 