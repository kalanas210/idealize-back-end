const express = require('express');
const multer = require('multer');
const path = require('path');
const { clerkProtect } = require('../middleware/auth');
const { successResponse, badRequestResponse } = require('../utils/response');

const router = express.Router();

// Test endpoint to check uploads directory
router.get('/test', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    console.log('📁 Testing uploads directory:', uploadsDir);
    
    if (fs.existsSync(uploadsDir)) {
      const stats = fs.statSync(uploadsDir);
      const files = fs.readdirSync(uploadsDir);
      
      res.json({
        success: true,
        message: 'Uploads directory exists',
        path: uploadsDir,
        isDirectory: stats.isDirectory(),
        permissions: stats.mode.toString(8),
        fileCount: files.length,
        files: files.slice(0, 10) // Show first 10 files
      });
    } else {
      res.json({
        success: false,
        message: 'Uploads directory does not exist',
        path: uploadsDir
      });
    }
  } catch (error) {
    console.error('❌ Error testing uploads directory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use absolute path to ensure uploads directory is found
    const uploadsDir = path.join(__dirname, '../uploads');
    console.log('📁 Multer destination:', uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('📁 Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // For debugging, allow all file types temporarily
    console.log('📁 File filter check:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname).toLowerCase(),
      size: file.size
    });

    // Allow all files for now to debug the issue
    return cb(null, true);
    
    // TODO: Re-enable file type validation after fixing the upload issue
    /*
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
    */
  }
});

// Error handling for multer
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 10MB.'
        });
      }
      return res.status(400).json({
        success: false,
        error: 'File upload error: ' + err.message
      });
    } else if (err) {
      console.error('❌ File filter error:', err);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next();
  });
};

/**
 * @swagger
 * /api/upload/single:
 *   post:
 *     summary: Upload a single file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or upload error
 */
router.post('/single', clerkProtect, uploadMiddleware, async (req, res, next) => {
  try {
    console.log('📁 Upload request received:', {
      user: req.user?.id,
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null
    });

    if (!req.file) {
      console.log('❌ No file in request');
      return badRequestResponse(res, 'No file uploaded');
    }

    // Check if uploads directory exists and is writable
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Uploads directory does not exist:', uploadsDir);
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Created uploads directory');
      } catch (mkdirError) {
        console.error('❌ Failed to create uploads directory:', mkdirError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create uploads directory'
        });
      }
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    // TODO: Save file info to database if needed
    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    console.log('✅ File uploaded successfully:', fileInfo);
    return successResponse(res, fileInfo, 'File uploaded successfully');
  } catch (error) {
    console.error('❌ Upload error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
router.post('/multiple', clerkProtect, upload.array('files', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return badRequestResponse(res, 'No files uploaded');
    }

    const filesInfo = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    }));

    return successResponse(res, filesInfo, 'Files uploaded successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
