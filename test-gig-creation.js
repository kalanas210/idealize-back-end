#!/usr/bin/env node

/**
 * Test Gig Creation
 * Debug the 400 validation error in gig creation
 */

const API_BASE_URL = 'http://localhost:5000';

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
 * Test gig creation with minimal valid data
 */
async function testMinimalGigCreation() {
  log.header('📝 Testing Minimal Gig Creation');
  
  const mockToken = 'dev-token-12345678';
  
  const minimalGigData = {
    gigTitle: "Test Gig Title",
    category: "technology",
    platform: "youtube",
    tags: ["test", "content"],
    pricing: {
      basic: {
        packageName: "Basic Package",
        description: "Basic service description",
        price: 25,
        delivery: 3,
        revision: 1,
        features: ["Core service"]
      },
      standard: {
        packageName: "Standard Package",
        description: "Standard service description",
        price: 50,
        delivery: 5,
        revision: 2,
        features: ["Enhanced features"]
      },
      premium: {
        packageName: "Premium Package",
        description: "Premium service description",
        price: 100,
        delivery: 7,
        revision: 3,
        features: ["All features"]
      }
    },
    gigDescription: {
      description: "This is a test gig description that meets the minimum requirement of 100 characters. It includes details about the service and what customers can expect.",
      faq: [
        {
          question: "What do you need?",
          answer: "I need your project requirements and guidelines to get started with the work."
        }
      ]
    },
    buyerRequirements: ["Please provide your project requirements"],
    gallery: {
      images: ["/uploads/test-image.jpg"],
      video: null
    }
  };
  
  try {
    log.info('Attempting gig creation with minimal data...');
    
    const response = await fetch(`${API_BASE_URL}/api/gigs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(minimalGigData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success('Gig creation successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      log.error(`Gig creation failed: ${response.status}`);
      console.log('Error Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    log.error(`Gig creation test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test gig creation with draft status
 */
async function testDraftGigCreation() {
  log.header('📝 Testing Draft Gig Creation');
  
  const mockToken = 'dev-token-12345678';
  
  const draftGigData = {
    gigTitle: "Draft Gig Title",
    category: "technology",
    platform: "youtube",
    tags: ["draft", "test"],
    pricing: {
      basic: {
        packageName: "Basic Package",
        description: "Basic service description",
        price: 25,
        delivery: 3,
        revision: 1,
        features: ["Core service"]
      },
      standard: {
        packageName: "Standard Package",
        description: "Standard service description",
        price: 50,
        delivery: 5,
        revision: 2,
        features: ["Enhanced features"]
      },
      premium: {
        packageName: "Premium Package",
        description: "Premium service description",
        price: 100,
        delivery: 7,
        revision: 3,
        features: ["All features"]
      }
    },
    gigDescription: {
      description: "This is a draft gig description that meets the minimum requirement of 100 characters. It includes details about the service and what customers can expect.",
      faq: [
        {
          question: "What do you need?",
          answer: "I need your project requirements and guidelines to get started with the work."
        }
      ]
    },
    buyerRequirements: ["Please provide your project requirements"],
    gallery: {
      images: ["/uploads/test-image.jpg"],
      video: null
    },
    status: "draft"
  };
  
  try {
    log.info('Attempting draft gig creation...');
    
    const response = await fetch(`${API_BASE_URL}/api/gigs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(draftGigData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success('Draft gig creation successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      log.error(`Draft gig creation failed: ${response.status}`);
      console.log('Error Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    log.error(`Draft gig creation test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  log.header('🧪 Gig Creation Debug Test');
  
  // Test minimal gig creation
  const minimalOk = await testMinimalGigCreation();
  
  // Test draft gig creation
  const draftOk = await testDraftGigCreation();
  
  // Summary
  log.header('📊 Test Summary');
  console.log(`Minimal Gig Creation: ${minimalOk ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Draft Gig Creation: ${draftOk ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (minimalOk && draftOk) {
    log.success('All gig creation tests passed! The issue might be in the frontend data.');
  } else {
    log.error('Some tests failed. Check the backend logs for detailed validation errors.');
  }
  
  log.header('📝 Next Steps');
  if (minimalOk && draftOk) {
    log.info('1. Check frontend data transformation');
    log.info('2. Verify all required fields are filled');
    log.info('3. Check browser console for errors');
  } else {
    log.info('1. Check backend console for validation errors');
    log.info('2. Verify validation rules are correct');
    log.info('3. Check if all required fields are being sent');
  }
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  });
}
