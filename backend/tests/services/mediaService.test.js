/**
 * Media Service Tests
 */
const path = require('path');
const fs = require('fs').promises;

// Mock sharp before requiring mediaService
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 100, height: 100, format: 'jpeg' }),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image'))
  }));
  return mockSharp;
});

const mediaService = require('../../src/services/mediaService');

describe('MediaService', () => {
  describe('File Validation', () => {
    it('should accept valid image types', () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.alloc(100)
      };

      expect(() => mediaService.validateFile(file)).not.toThrow();
    });

    it('should accept valid video types', () => {
      const file = {
        mimetype: 'video/mp4',
        size: 5 * 1024 * 1024, // 5MB
        buffer: Buffer.alloc(100)
      };

      expect(() => mediaService.validateFile(file)).not.toThrow();
    });

    it('should reject files that exceed size limit', () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 50 * 1024 * 1024, // 50MB
        buffer: Buffer.alloc(100)
      };

      expect(() => mediaService.validateFile(file)).toThrow(/exceeds limit/);
    });

    it('should reject invalid file types', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.alloc(100)
      };

      expect(() => mediaService.validateFile(file)).toThrow(/not allowed/);
    });

    it('should reject null file', () => {
      expect(() => mediaService.validateFile(null)).toThrow(/No file provided/);
    });
  });

  describe('Platform Dimensions', () => {
    it('should return Twitter dimensions', () => {
      const dims = mediaService.getPlatformDimensions('twitter');

      expect(dims.post.width).toBe(1200);
      expect(dims.post.height).toBe(675);
      expect(dims.profile.width).toBe(400);
    });

    it('should return Instagram dimensions', () => {
      const dims = mediaService.getPlatformDimensions('instagram');

      expect(dims.post.width).toBe(1080);
      expect(dims.post.height).toBe(1080);
      expect(dims.story.width).toBe(1080);
      expect(dims.story.height).toBe(1920);
    });

    it('should return LinkedIn dimensions', () => {
      const dims = mediaService.getPlatformDimensions('linkedin');

      expect(dims.post.width).toBe(1200);
      expect(dims.post.height).toBe(627);
    });

    it('should return YouTube dimensions', () => {
      const dims = mediaService.getPlatformDimensions('youtube');

      expect(dims.thumbnail.width).toBe(1280);
      expect(dims.thumbnail.height).toBe(720);
      expect(dims.banner.width).toBe(2560);
    });

    it('should return Facebook dimensions', () => {
      const dims = mediaService.getPlatformDimensions('facebook');

      expect(dims.post.width).toBe(1200);
      expect(dims.post.height).toBe(630);
    });

    it('should default to Twitter for unknown platform', () => {
      const dims = mediaService.getPlatformDimensions('unknown');
      const twitterDims = mediaService.getPlatformDimensions('twitter');

      expect(dims).toEqual(twitterDims);
    });
  });

  describe('Image Processing', () => {
    it('should process image and return metadata', async () => {
      const testBuffer = Buffer.from('test-image-data');
      const result = await mediaService.processImage(testBuffer, { optimize: false });

      expect(result.buffer).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.width).toBe(100);
      expect(result.metadata.height).toBe(100);
    });

    it('should generate thumbnail', async () => {
      const testBuffer = Buffer.from('test-image-data');
      const thumbnail = await mediaService.generateThumbnail(testBuffer, {
        width: 100,
        height: 100
      });

      expect(thumbnail).toBeDefined();
      expect(Buffer.isBuffer(thumbnail)).toBe(true);
    });
  });

  describe('Service Configuration', () => {
    it('should have default storage provider', () => {
      expect(mediaService.provider).toBe('local');
    });

    it('should have storage methods available', () => {
      expect(mediaService.storage.save).toBeDefined();
      expect(mediaService.storage.delete).toBeDefined();
      expect(mediaService.storage.getUrl).toBeDefined();
    });

    it('should have allowed image types configured', () => {
      expect(mediaService.allowedImageTypes).toContain('image/jpeg');
      expect(mediaService.allowedImageTypes).toContain('image/png');
      expect(mediaService.allowedImageTypes).toContain('image/gif');
      expect(mediaService.allowedImageTypes).toContain('image/webp');
    });

    it('should have allowed video types configured', () => {
      expect(mediaService.allowedVideoTypes).toContain('video/mp4');
      expect(mediaService.allowedVideoTypes).toContain('video/quicktime');
      expect(mediaService.allowedVideoTypes).toContain('video/webm');
    });
  });
});
