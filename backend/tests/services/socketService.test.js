/**
 * Socket Service Tests
 */
const socketService = require('../../src/services/socketService');

describe('SocketService', () => {
  let mockIo;
  let mockSocket;

  beforeEach(() => {
    // Reset socket service state
    socketService.io = null;
    socketService.connectedUsers.clear();

    // Create mock socket
    mockSocket = {
      id: 'socket-123',
      userId: null,
      join: jest.fn(),
      on: jest.fn((event, handler) => {
        mockSocket._handlers = mockSocket._handlers || {};
        mockSocket._handlers[event] = handler;
      }),
      emit: jest.fn()
    };

    // Create mock io
    mockIo = {
      on: jest.fn((event, handler) => {
        if (event === 'connection') {
          mockIo._connectionHandler = handler;
        }
      }),
      to: jest.fn(() => ({
        emit: jest.fn()
      })),
      emit: jest.fn()
    };
  });

  describe('initialize', () => {
    it('should store io instance', () => {
      socketService.initialize(mockIo);
      expect(socketService.io).toBe(mockIo);
    });

    it('should set up connection handler', () => {
      socketService.initialize(mockIo);
      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('User Connection Tracking', () => {
    it('should add user socket', () => {
      socketService.addUserSocket('user-1', 'socket-1');
      expect(socketService.isUserOnline('user-1')).toBe(true);
    });

    it('should track multiple sockets for same user', () => {
      socketService.addUserSocket('user-1', 'socket-1');
      socketService.addUserSocket('user-1', 'socket-2');

      const sockets = socketService.connectedUsers.get('user-1');
      expect(sockets.size).toBe(2);
    });

    it('should remove user socket', () => {
      socketService.addUserSocket('user-1', 'socket-1');
      socketService.addUserSocket('user-1', 'socket-2');

      socketService.removeUserSocket('user-1', 'socket-1');

      const sockets = socketService.connectedUsers.get('user-1');
      expect(sockets.size).toBe(1);
      expect(sockets.has('socket-2')).toBe(true);
    });

    it('should remove user when last socket disconnects', () => {
      socketService.addUserSocket('user-1', 'socket-1');
      socketService.removeUserSocket('user-1', 'socket-1');

      expect(socketService.isUserOnline('user-1')).toBe(false);
    });

    it('should return correct online user count', () => {
      socketService.addUserSocket('user-1', 'socket-1');
      socketService.addUserSocket('user-2', 'socket-2');
      socketService.addUserSocket('user-1', 'socket-3');

      expect(socketService.getOnlineUserCount()).toBe(2);
    });
  });

  describe('Notification Methods', () => {
    beforeEach(() => {
      socketService.initialize(mockIo);
    });

    it('should notify specific user', () => {
      const mockToEmit = jest.fn();
      mockIo.to.mockReturnValue({ emit: mockToEmit });

      const result = socketService.notifyUser('user-1', 'test:event', { data: 'test' });

      expect(result).toBe(true);
      expect(mockIo.to).toHaveBeenCalledWith('user:user-1');
      expect(mockToEmit).toHaveBeenCalledWith('test:event', { data: 'test' });
    });

    it('should notify multiple users', () => {
      const mockToEmit = jest.fn();
      mockIo.to.mockReturnValue({ emit: mockToEmit });

      socketService.notifyUsers(['user-1', 'user-2'], 'test:event', { data: 'test' });

      expect(mockIo.to).toHaveBeenCalledTimes(2);
    });

    it('should broadcast to all clients', () => {
      socketService.broadcast('broadcast:event', { message: 'hello' });

      expect(mockIo.emit).toHaveBeenCalledWith('broadcast:event', { message: 'hello' });
    });

    it('should notify specific room', () => {
      const mockToEmit = jest.fn();
      mockIo.to.mockReturnValue({ emit: mockToEmit });

      socketService.notifyRoom('post:123', 'post:update', { id: 123 });

      expect(mockIo.to).toHaveBeenCalledWith('post:123');
      expect(mockToEmit).toHaveBeenCalledWith('post:update', { id: 123 });
    });

    it('should return false when io not initialized', () => {
      socketService.io = null;
      const result = socketService.notifyUser('user-1', 'event', {});
      expect(result).toBe(false);
    });
  });

  describe('Specific Notification Types', () => {
    beforeEach(() => {
      socketService.initialize(mockIo);
      const mockToEmit = jest.fn();
      mockIo.to.mockReturnValue({ emit: mockToEmit });
    });

    it('should send new notification', () => {
      const notification = { id: 1, type: 'test', message: 'Test' };
      socketService.sendNotification('user-1', notification);

      expect(mockIo.to).toHaveBeenCalledWith('user:user-1');
    });

    it('should send post status update', () => {
      socketService.postStatusUpdate('user-1', 123, 'publishing');

      expect(mockIo.to).toHaveBeenCalledWith('user:user-1');
      expect(mockIo.to).toHaveBeenCalledWith('post:123');
    });

    it('should send post published notification', () => {
      const post = {
        id: 123,
        socialAccount: { platform: 'twitter' },
        platformPostUrl: 'https://twitter.com/post/123'
      };
      socketService.postPublished('user-1', post);

      expect(mockIo.to).toHaveBeenCalledWith('user:user-1');
    });

    it('should send post failed notification', () => {
      socketService.postFailed('user-1', 123, new Error('API Error'));

      expect(mockIo.to).toHaveBeenCalledWith('user:user-1');
    });

    it('should send new message notification', () => {
      const message = { id: 1, conversationId: 'conv-1', content: 'Hello' };
      socketService.newMessage('user-1', message);

      expect(mockIo.to).toHaveBeenCalledWith('user:user-1');
      expect(mockIo.to).toHaveBeenCalledWith('conversation:conv-1');
    });

    it('should send account update notification', () => {
      socketService.accountUpdate('user-1', 'account-1', 'connected', 'twitter');

      expect(mockIo.to).toHaveBeenCalledWith('user:user-1');
    });

    it('should send subscription update notification', () => {
      socketService.subscriptionUpdate('user-1', { plan: 'pro' });

      expect(mockIo.to).toHaveBeenCalledWith('user:user-1');
    });

    it('should send system announcement to all', () => {
      socketService.systemAnnouncement('Maintenance in 1 hour', 'warning');

      expect(mockIo.emit).toHaveBeenCalledWith('system:announcement', {
        message: 'Maintenance in 1 hour',
        type: 'warning'
      });
    });

    it('should send system message to specific user', () => {
      socketService.systemMessage('user-1', 'Your plan expires soon', 'warning');

      expect(mockIo.to).toHaveBeenCalledWith('user:user-1');
    });
  });
});
