const express = require('express');
const router = express.Router();
const zoomService = require('../services/zoomService');
const { protect, authorize } = require('../middleware/auth');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');

/**
 * @swagger
 * components:
 *   schemas:
 *     MeetingScheduleRequest:
 *       type: object
 *       required:
 *         - startTime
 *         - duration
 *         - sellerId
 *         - gigId
 *       properties:
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Meeting start time in ISO format
 *         duration:
 *           type: integer
 *           minimum: 15
 *           maximum: 480
 *           description: Meeting duration in minutes
 *         topic:
 *           type: string
 *           description: Meeting topic/title
 *         timezone:
 *           type: string
 *           description: Timezone for the meeting
 *         sellerId:
 *           type: string
 *           format: uuid
 *           description: Seller's user ID
 *         gigId:
 *           type: string
 *           format: uuid
 *           description: Gig ID for the consultation
 */

/**
 * @swagger
 * /api/zoom/meetings:
 *   post:
 *     summary: Schedule a new Zoom meeting
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MeetingScheduleRequest'
 *     responses:
 *       201:
 *         description: Meeting scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     meetingId:
 *                       type: string
 *                     joinUrl:
 *                       type: string
 *                     startUrl:
 *                       type: string
 *                     topic:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     duration:
 *                       type: integer
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/meetings', protect, async (req, res) => {
  try {
    const { startTime, duration, topic, timezone, sellerId, gigId } = req.body;
    const buyerId = req.user.id;

    // Validation
    if (!startTime || !sellerId || !gigId) {
      return validationErrorResponse(res, {
        startTime: !startTime ? 'Start time is required' : null,
        sellerId: !sellerId ? 'Seller ID is required' : null,
        gigId: !gigId ? 'Gig ID is required' : null
      });
    }

    // Validate start time is in the future
    const startDateTime = new Date(startTime);
    const now = new Date();
    if (startDateTime <= now) {
      return validationErrorResponse(res, {
        startTime: 'Start time must be in the future'
      });
    }

    // Validate duration
    const meetingDuration = duration || 30;
    if (meetingDuration < 15 || meetingDuration > 480) {
      return validationErrorResponse(res, {
        duration: 'Duration must be between 15 and 480 minutes'
      });
    }

    // Create meeting data
    const meetingData = {
      topic: topic || `SocyAds Consultation - ${buyerId}`,
      startTime: startDateTime.toISOString(),
      duration: meetingDuration,
      timezone: timezone || 'UTC',
      buyerId,
      sellerId,
      gigId
    };

    // Create Zoom meeting
    const zoomMeeting = await zoomService.createMeeting(meetingData);

    // Save to database
    const savedMeeting = await zoomService.saveMeetingToDatabase({
      ...zoomMeeting,
      buyerId,
      sellerId,
      gigId
    });

    // Send invitation emails (async)
    zoomService.sendMeetingInvitation(
      zoomMeeting,
      req.user.email,
      'seller@example.com' // TODO: Get seller email from database
    ).catch(error => {
      console.error('Failed to send meeting invitation:', error);
    });

    return successResponse(res, {
      meetingId: zoomMeeting.meetingId,
      joinUrl: zoomMeeting.joinUrl,
      startUrl: zoomMeeting.startUrl,
      topic: zoomMeeting.topic,
      startTime: zoomMeeting.startTime,
      duration: zoomMeeting.duration,
      password: zoomMeeting.password,
      id: savedMeeting.id
    }, 'Meeting scheduled successfully', 201);

  } catch (error) {
    console.error('Error scheduling meeting:', error);
    return errorResponse(res, error.message);
  }
});

/**
 * @swagger
 * /api/zoom/meetings:
 *   get:
 *     summary: Get user's meetings
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of meetings per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [buyer, seller]
 *           default: buyer
 *         description: User role for filtering meetings
 *     responses:
 *       200:
 *         description: Meetings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/meetings', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, role = 'buyer' } = req.query;
    const userId = req.user.id;

    const meetings = await zoomService.getMeetingsFromDatabase(
      userId,
      role,
      parseInt(page),
      parseInt(limit)
    );

    return successResponse(res, meetings, 'Meetings retrieved successfully');

  } catch (error) {
    console.error('Error getting meetings:', error);
    return errorResponse(res, error.message);
  }
});

/**
 * @swagger
 * /api/zoom/meetings/{meetingId}:
 *   get:
 *     summary: Get meeting details
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Zoom meeting ID
 *     responses:
 *       200:
 *         description: Meeting details retrieved successfully
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/meetings/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await zoomService.getMeeting(meetingId);

    return successResponse(res, meeting, 'Meeting details retrieved successfully');

  } catch (error) {
    console.error('Error getting meeting details:', error);
    if (error.message.includes('not found')) {
      return errorResponse(res, 'Meeting not found', 404);
    }
    return errorResponse(res, error.message);
  }
});

/**
 * @swagger
 * /api/zoom/meetings/{meetingId}:
 *   patch:
 *     summary: Update meeting
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Zoom meeting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/meetings/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const updateData = req.body;

    const meeting = await zoomService.updateMeeting(meetingId, updateData);

    return successResponse(res, meeting, 'Meeting updated successfully');

  } catch (error) {
    console.error('Error updating meeting:', error);
    if (error.message.includes('not found')) {
      return errorResponse(res, 'Meeting not found', 404);
    }
    return errorResponse(res, error.message);
  }
});

/**
 * @swagger
 * /api/zoom/meetings/{meetingId}:
 *   delete:
 *     summary: Cancel/delete meeting
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Zoom meeting ID
 *     responses:
 *       200:
 *         description: Meeting cancelled successfully
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/meetings/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    await zoomService.deleteMeeting(meetingId);
    await zoomService.updateMeetingStatus(meetingId, 'cancelled');

    return successResponse(res, null, 'Meeting cancelled successfully');

  } catch (error) {
    console.error('Error cancelling meeting:', error);
    if (error.message.includes('not found')) {
      return errorResponse(res, 'Meeting not found', 404);
    }
    return errorResponse(res, error.message);
  }
});

/**
 * @swagger
 * /api/zoom/meetings/{meetingId}/join:
 *   post:
 *     summary: Join meeting
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Zoom meeting ID
 *     responses:
 *       200:
 *         description: Join URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 joinUrl:
 *                   type: string
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/meetings/:meetingId/join', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Get meeting from database to verify access
    const meetings = await zoomService.getMeetingsFromDatabase(req.user.id, 'buyer', 1, 100);
    const meeting = meetings.find(m => m.meeting_id === meetingId);

    if (!meeting) {
      return errorResponse(res, 'Meeting not found or access denied', 404);
    }

    // Update meeting status to 'joined'
    await zoomService.updateMeetingStatus(meetingId, 'joined');

    return successResponse(res, {
      joinUrl: meeting.join_url,
      password: meeting.password
    }, 'Join URL generated successfully');

  } catch (error) {
    console.error('Error joining meeting:', error);
    return errorResponse(res, error.message);
  }
});

module.exports = router; 