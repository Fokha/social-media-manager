/**
 * Media Service - Handles file uploads and storage
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const logger = require('../utils/logger');

// Storage providers
const STORAGE_PROVIDERS = {
  local: require('./storage/localStorage'),
  // s3: require('./storage/s3Storage'), // Uncomment when configured
};

class MediaService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'local';
    this.storage = STORAGE_PROVIDERS[this.provider];
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  }

  /**
   * Upload a file
   * @param {Object} file - Multer file object
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async upload(file, options = {}) {
    const { userId, type = 'post', optimize = true, generateThumbnail = true } = options;

    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const filePath = `${userId}/${type}/${filename}`;

    let processedBuffer = file.buffer;
    let metadata = {};

    // Process images
    if (this.allowedImageTypes.includes(file.mimetype)) {
      const imageResult = await this.processImage(file.buffer, { optimize });
      processedBuffer = imageResult.buffer;
      metadata = imageResult.metadata;

      // Generate thumbnail
      if (generateThumbnail) {
        const thumbnail = await this.generateThumbnail(file.buffer);
        const thumbnailPath = `${userId}/${type}/thumb_${filename}`;
        await this.storage.save(thumbnailPath, thumbnail);
        metadata.thumbnailUrl = this.storage.getUrl(thumbnailPath);
      }
    }

    // Save file
    await this.storage.save(filePath, processedBuffer);
    const url = this.storage.getUrl(filePath);

    logger.info(`File uploaded: ${filePath}`);

    return {
      url,
      path: filePath,
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: processedBuffer.length,
      ...metadata
    };
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(files, options = {}) {
    return Promise.all(files.map(file => this.upload(file, options)));
  }

  /**
   * Delete a file
   */
  async delete(filePath) {
    await this.storage.delete(filePath);
    logger.info(`File deleted: ${filePath}`);
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(filePaths) {
    return Promise.all(filePaths.map(p => this.delete(p)));
  }

  /**
   * Validate file
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    const allowedTypes = [...this.allowedImageTypes, ...this.allowedVideoTypes];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }
  }

  /**
   * Process and optimize image
   */
  async processImage(buffer, options = {}) {
    const { optimize = true, maxWidth = 2048, quality = 85 } = options;

    let processor = sharp(buffer);
    const metadata = await processor.metadata();

    if (optimize) {
      // Resize if too large
      if (metadata.width > maxWidth) {
        processor = processor.resize(maxWidth, null, { withoutEnlargement: true });
      }

      // Convert and optimize based on format
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        processor = processor.jpeg({ quality, progressive: true });
      } else if (metadata.format === 'png') {
        processor = processor.png({ compressionLevel: 8 });
      } else if (metadata.format === 'webp') {
        processor = processor.webp({ quality });
      }
    }

    const outputBuffer = await processor.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      metadata: {
        width: outputMetadata.width,
        height: outputMetadata.height,
        format: outputMetadata.format
      }
    };
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(buffer, options = {}) {
    const { width = 300, height = 300, fit = 'cover' } = options;

    return sharp(buffer)
      .resize(width, height, { fit })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  /**
   * Get platform-specific image dimensions
   */
  getPlatformDimensions(platform) {
    const dimensions = {
      twitter: { post: { width: 1200, height: 675 }, profile: { width: 400, height: 400 } },
      instagram: { post: { width: 1080, height: 1080 }, story: { width: 1080, height: 1920 } },
      linkedin: { post: { width: 1200, height: 627 }, profile: { width: 400, height: 400 } },
      youtube: { thumbnail: { width: 1280, height: 720 }, banner: { width: 2560, height: 1440 } },
      facebook: { post: { width: 1200, height: 630 }, profile: { width: 170, height: 170 } }
    };
    return dimensions[platform] || dimensions.twitter;
  }

  /**
   * Resize image for specific platform
   */
  async resizeForPlatform(buffer, platform, imageType = 'post') {
    const dimensions = this.getPlatformDimensions(platform)[imageType];
    if (!dimensions) {
      return buffer;
    }

    return sharp(buffer)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .toBuffer();
  }
}

module.exports = new MediaService();
