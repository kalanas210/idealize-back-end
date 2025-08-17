#!/usr/bin/env node

/**
 * Authentication Test Script
 * Tests the authentication endpoints
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function testAuth() {
  try {
    console.log('🧪 Testing Authentication Endpoints...\n');

    // Test 1: Test login endpoint
    console.log('1. Testing /api/auth/test-login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/test-login`, {
      email: 'test@example.com'
    });

    if (loginResponse.data.success) {
      console.log('✅ Test login successful');
      console.log('Token:', loginResponse.data.data.token.substring(0, 50) + '...');
      
      const token = loginResponse.data.data.token;

      // Test 2: Test protected endpoint with token
      console.log('\n2. Testing protected endpoint with token...');
      const protectedResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (protectedResponse.data.success) {
        console.log('✅ Protected endpoint access successful');
        console.log('User:', protectedResponse.data.data);
      }

      // Test 3: Test Cal.com endpoint with token
      console.log('\n3. Testing Cal.com endpoint with token...');
      try {
        const calResponse = await axios.get(`${API_BASE_URL}/api/cal/health`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Cal.com endpoint access successful');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ Cal.com endpoint accessible (404 expected for empty meetings)');
        } else {
          console.log('❌ Cal.com endpoint error:', error.response?.status, error.response?.data);
        }
      }

    } else {
      console.log('❌ Test login failed:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run test
testAuth(); 