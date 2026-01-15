/**
 * Socket Service - Real-time WebSocket notifications
 */
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> Set of socketIds
  }

  /**
   * Initialize with Socket.io instance
   */
  initialize(io) {
    this.io = io;
    this.setupEventHandlers();
    logger.info('Socket service initialized');
  }

  /**
   * Set up socket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.debug(`Socket connected: ${socket.id}`);

      // Handle user authentication/join
      socket.on('authenticate', (userId) => {
        this.addUserSocket(userId, socket.id);
        socket.join(`user:${userId}`);
        socket.userId = userId;
        logger.info(`User ${userId} authenticated on socket ${socket.id}`);

        // Send pending notifications count
        this.sendPendingCount(userId);
      });

      // Handle room joining for specific resources
      socket.on('join:post', (postId) => {
        socket.join(`post:${postId}`);
      });

      socket.on('join:conversation', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.removeUserSocket(socket.userId, socket.id);
        }
        logger.debug(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Track user socket connections
   */
  addUserSocket(userId, socketId) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socketId);
  }

  /**
   * Remove user socket connection
   */
  removeUserSocket(userId, socketId) {
    const sockets = this.connectedUsers.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId).size > 0;
  }

  /**
   * Get online user count
   */
  getOnlineUserCount() {
    return this.connectedUsers.size;
  }

  // ============================================================================
  // Notification Methods
  // ============================================================================

  /**
   * Send notification to specific user
   */
  notifyUser(userId, event, data) {
    if (!this.io) {
      logger.warn('Socket service not initialized');
      return false;
    }
    this.io.to(`user:${userId}`).emit(event, data);
    return true;
  }

  /**
   * Send notification to multiple users
   */
  notifyUsers(userIds, event, data) {
    userIds.forEach(userId => this.notifyUser(userId, event, data));
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event, data) {
    if (!this.io) return false;
    this.io.emit(event, data);
    return true;
  }

  /**
   * Send to specific room
   */
  notifyRoom(room, event, data) {
    if (!this.io) return false;
    this.io.to(room).emit(event, data);
    return true;
  }

  // ============================================================================
  // Specific Notification Types
  // ============================================================================

  /**
   * New notification alert
   */
  sendNotification(userId, notification) {
    this.notifyUser(userId, 'notification:new', notification);
  }

  /**
   * Send pending notifications count
   */
  async sendPendingCount(userId) {
    try {
      const { Notification } = require('../models');
      const count = await Notification.count({
        where: { userId, read: false }
      });
      this.notifyUser(userId, 'notification:count', { count });
    } catch (error) {
      logger.error('Error sending pending count:', error);
    }
  }

  /**
   * Post status update (scheduled -> publishing -> published/failed)
   */
  postStatusUpdate(userId, postId, status, data = {}) {
    this.notifyUser(userId, 'post:status', { postId, status, ...data });
    this.notifyRoom(`post:${postId}`, 'post:status', { postId, status, ...data });
  }

  /**
   * Post published successfully
   */
  postPublished(userId, post) {
    this.notifyUser(userId, 'post:published', {
      postId: post.id,
      platform: post.socialAccount?.platform,
      url: post.platformPostUrl
    });
  }

  /**
   * Post failed to publish
   */
  postFailed(userId, postId, error) {
    this.notifyUser(userId, 'post:failed', {
      postId,
      error: error.message || error
    });
  }

  /**
   * New message received
   */
  newMessage(userId, message) {
    this.notifyUser(userId, 'message:new', message);
    if (message.conversationId) {
      this.notifyRoom(`conversation:${message.conversationId}`, 'message:new', message);
    }
  }

  /**
   * Message read receipt
   */
  messageRead(userId, messageId) {
    this.notifyUser(userId, 'message:read', { messageId });
  }

  /**
   * Account connected/disconnected
   */
  accountUpdate(userId, accountId, action, platform) {
    this.notifyUser(userId, 'account:update', {
      accountId,
      action, // 'connected', 'disconnected', 'refreshed', 'error'
      platform
    });
  }

  /**
   * Account token refresh needed
   */
  accountTokenExpiring(userId, accountId, platform) {
    this.notifyUser(userId, 'account:token_expiring', {
      accountId,
      platform
    });
  }

  /**
   * Subscription updated
   */
  subscriptionUpdate(userId, subscription) {
    this.notifyUser(userId, 'subscription:update', subscription);
  }

  /**
   * Analytics data ready
   */
  analyticsReady(userId, data) {
    this.notifyUser(userId, 'analytics:ready', data);
  }

  /**
   * System announcement (to all users)
   */
  systemAnnouncement(message, type = 'info') {
    this.broadcast('system:announcement', { message, type });
  }

  /**
   * User-specific system message
   */
  systemMessage(userId, message, type = 'info') {
    this.notifyUser(userId, 'system:message', { message, type });
  }
}

// Singleton instance
const socketService = new SocketService();

module.exports = socketService;
