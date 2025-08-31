import express from 'express';
import multer from 'multer';
import { requireAuth } from '@clerk/express';
import { authenticateToken } from '../middleware/auth.js';
import { validateFile } from '../middleware/validation.js';
import { uploadToImageKit, getAuthenticationParameters } from '../config/imagekit.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type', 400, 'INVALID_FILE_TYPE'), false);
    }
  }
});

// Get ImageKit authentication parameters
router.get('/auth', authenticateToken, asyncHandler(async (req, res) => {
  const authParams = getAuthenticationParameters();
  
  if (!authParams.success) {
    throw new AppError(authParams.error, 500, 'IMAGEKIT_AUTH_ERROR');
  }

  res.json({
    success: true,
    data: authParams.data
  });
}));

// Upload single file
router.post('/single', 
  authenticateToken,
  upload.single('file'),
  validateFile({
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
    required: true
  }),
  asyncHandler(async (req, res) => {
    const { folder = 'uploads' } = req.body;
    
    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    const fileName = `${req.user._id}-${Date.now()}-${req.file.originalname}`;
    
    const result = await uploadToImageKit(req.file, fileName, folder);
    
    if (!result.success) {
      throw new AppError(result.error, 500, 'UPLOAD_FAILED');
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: result.data
    });
  })
);

// Upload multiple files
router.post('/multiple',
  authenticateToken,
  upload.array('files', 10), // Max 10 files
  asyncHandler(async (req, res) => {
    const { folder = 'uploads' } = req.body;
    
    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded', 400, 'NO_FILES');
    }

    const uploadPromises = req.files.map(file => {
      const fileName = `${req.user._id}-${Date.now()}-${file.originalname}`;
      return uploadToImageKit(file, fileName, folder);
    });

    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      message: `${successful.length} files uploaded successfully`,
      data: {
        uploaded: successful.map(r => r.data),
        failed: failed.length,
        errors: failed.map(r => r.error)
      }
    });
  })
);

export default router;
