const express = require('express');
const request = require('supertest');

// Simple test script to verify the How it Works API endpoints
async function testHowItWorksAPI() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:5000';
  
  console.log('🧪 Testing How it Works API endpoints...\n');

  const tests = [
    {
      name: 'GET /api/how-it-works',
      method: 'GET',
      path: '/api/how-it-works',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/steps/buyers',
      method: 'GET',
      path: '/api/how-it-works/steps/buyers',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/steps/sellers',
      method: 'GET',
      path: '/api/how-it-works/steps/sellers',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/features',
      method: 'GET',
      path: '/api/how-it-works/features',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/stats',
      method: 'GET',
      path: '/api/how-it-works/stats',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/faqs',
      method: 'GET',
      path: '/api/how-it-works/faqs',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/faqs with category filter',
      method: 'GET',
      path: '/api/how-it-works/faqs?category=pricing',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/faqs with search',
      method: 'GET',
      path: '/api/how-it-works/faqs?search=cost',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/faqs/1',
      method: 'GET',
      path: '/api/how-it-works/faqs/1',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/demo-videos',
      method: 'GET',
      path: '/api/how-it-works/demo-videos',
      expectedStatus: 200
    },
    {
      name: 'GET /api/how-it-works/demo-videos with category',
      method: 'GET',
      path: '/api/how-it-works/demo-videos?category=buyers',
      expectedStatus: 200
    },
    {
      name: 'POST /api/how-it-works/feedback',
      method: 'POST',
      path: '/api/how-it-works/feedback',
      body: {
        rating: 5,
        feedback: 'Test feedback for How it Works page',
        section: 'general',
        userType: 'buyer'
      },
      expectedStatus: 200
    },
    {
      name: 'POST /api/how-it-works/faqs/1/helpful',
      method: 'POST',
      path: '/api/how-it-works/faqs/1/helpful',
      expectedStatus: 200
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const url = `${baseURL}${test.path}`;
      let response;

      if (test.method === 'GET') {
        response = await fetch(url);
      } else if (test.method === 'POST') {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: test.body ? JSON.stringify(test.body) : undefined,
        });
      }

      const data = await response.json();
      
      if (response.status === test.expectedStatus && data.success) {
        console.log(`✅ PASSED: ${test.name}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${data.message}`);
        if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(`   Data: ${data.data.length} items returned`);
          } else if (typeof data.data === 'object') {
            console.log(`   Data: Object with keys: ${Object.keys(data.data).join(', ')}`);
          }
        }
        passedTests++;
      } else {
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`   Expected Status: ${test.expectedStatus}, Got: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        failedTests++;
      }
      
      console.log(''); // Empty line for readability
    } catch (error) {
      console.log(`❌ ERROR: ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failedTests++;
      console.log('');
    }
  }

  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! The How it Works API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the API server and try again.');
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  testHowItWorksAPI().catch(console.error);
}

module.exports = { testHowItWorksAPI };
