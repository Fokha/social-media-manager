/**
 * Upload Routes - Handle media file uploads
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const mediaService = require('../services/mediaService');
const { AppError } = require('../middleware/errorHandler');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type ${file.mimetype} not allowed`, 400), false);
    }
  }
});

// POST /api/uploads/single - Upload single file
router.post('/single', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file provided', 400);
    }

    const result = await mediaService.upload(req.file, {
      userId: req.user.id,
      type: req.body.type || 'post',
      optimize: req.body.optimize !== 'false'
    });

    res.json({
      success: true,
      data: { file: result }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/uploads/multiple - Upload multiple files
router.post('/multiple', authenticate, upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No files provided', 400);
    }

    const results = await mediaService.uploadMultiple(req.files, {
      userId: req.user.id,
      type: req.body.type || 'post',
      optimize: req.body.optimize !== 'false'
    });

    res.json({
      success: true,
      data: { files: results }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/uploads/:path - Delete file
router.delete('/*', authenticate, async (req, res, next) => {
  try {
    const filePath = req.params[0];

    // Verify ownership (path starts with user ID)
    if (!filePath.startsWith(`${req.user.id}/`)) {
      throw new AppError('Access denied', 403);
    }

    await mediaService.delete(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/uploads/resize - Resize image for platform
router.post('/resize', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file provided', 400);
    }

    const { platform, imageType = 'post' } = req.body;

    if (!platform) {
      throw new AppError('Platform is required', 400);
    }

    const resizedBuffer = await mediaService.resizeForPlatform(
      req.file.buffer,
      platform,
      imageType
    );

    const result = await mediaService.upload(
      { ...req.file, buffer: resizedBuffer },
      {
        userId: req.user.id,
        type: 'post',
        optimize: false
      }
    );

    res.json({
      success: true,
      data: { file: result }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
