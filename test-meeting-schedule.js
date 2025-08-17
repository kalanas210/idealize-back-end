#!/usr/bin/env node

/**
 * Meeting Scheduling Test Script
 * Tests the meeting scheduling functionality
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function testMeetingSchedule() {
  try {
    console.log('🧪 Testing Meeting Scheduling...\n');

    // Step 1: Get authentication token
    console.log('1. Getting authentication token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/test-login`, {
      email: 'test@example.com'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Failed to get authentication token');
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Authentication token obtained');

    // Step 2: Test meeting scheduling
    console.log('\n2. Testing meeting scheduling...');
    const meetingData = {
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 30,
      topic: 'SocyAds Video Consultation - Tech Review',
      timezone: 'UTC',
      sellerId: '550e8400-e29b-41d4-a716-446655440001', // Mock seller ID
      gigId: '550e8400-e29b-41d4-a716-446655440002' // Mock gig ID
    };

    try {
      const scheduleResponse = await axios.post(`${API_BASE_URL}/api/cal/book`, meetingData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Meeting scheduled successfully!');
      console.log('Response:', JSON.stringify(scheduleResponse.data, null, 2));

    } catch (error) {
      console.error('❌ Meeting scheduling failed:');
      console.error('Status:', error.response?.status);
      console.error('Error:', error.response?.data || error.message);
      
      if (error.response?.data?.error) {
        console.error('Error details:', error.response.data.error);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testMeetingSchedule(); 