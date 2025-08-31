import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Cal.com integration routes (placeholders for now)
// In production, these would integrate with Cal.com API

// Get event types for a seller
router.get('/event-types/:username', asyncHandler(async (req, res) => {
  // Simulate Cal.com event types
  const eventTypes = [
    {
      id: 'consultation-30',
      title: '30-Minute Consultation',
      description: 'Quick consultation to discuss your project requirements',
      duration: 30,
      price: 0,
      slug: 'consultation-30'
    },
    {
      id: 'consultation-60', 
      title: '1-Hour Deep Dive',
      description: 'Comprehensive consultation for complex projects',
      duration: 60,
      price: 0,
      slug: 'consultation-60'
    }
  ];

  res.json({
    success: true,
    data: eventTypes
  });
}));

// Get available slots
router.get('/available-slots/:username', asyncHandler(async (req, res) => {
  const { date, duration } = req.query;
  
  // Generate sample time slots
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }

  res.json({
    success: true,
    data: slots
  });
}));

// Create booking
router.post('/bookings', authenticateToken, asyncHandler(async (req, res) => {
  const {
    eventTypeId,
    startTime,
    endTime,
    buyerEmail,
    buyerName,
    gigId,
    sellerId
  } = req.body;

  // Simulate successful booking creation
  const booking = {
    id: 'booking_' + Date.now(),
    eventTypeId,
    startTime,
    endTime,
    meetingUrl: 'https://meet.google.com/demo-meeting',
    status: 'confirmed',
    buyer: {
      email: buyerEmail,
      name: buyerName
    },
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking
  });
}));

export default router;
