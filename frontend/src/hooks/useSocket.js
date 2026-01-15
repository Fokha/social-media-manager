/**
 * WebSocket Hook - Real-time notifications
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Main socket hook - manages connection and provides event handlers
 */
export function useSocket() {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Connect on mount when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      setIsConnected(true);
      // Authenticate with user ID
      socket.emit('authenticate', user.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Notification count update
    socket.on('notification:count', ({ count }) => {
      setNotificationCount(count);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  // Subscribe to an event
  const subscribe = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      return () => socketRef.current?.off(event, handler);
    }
    return () => {};
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Join a room
  const joinRoom = useCallback((roomType, id) => {
    emit(`join:${roomType}`, id);
  }, [emit]);

  return {
    socket: socketRef.current,
    isConnected,
    notificationCount,
    subscribe,
    emit,
    joinRoom
  };
}

/**
 * Hook for real-time notifications
 */
export function useNotifications() {
  const { subscribe, notificationCount } = useSocket();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for new notifications
    const unsubscribe = subscribe('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Invalidate notifications query
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return unsubscribe;
  }, [subscribe, queryClient]);

  return {
    notifications,
    unreadCount: notificationCount,
    clearNotifications: () => setNotifications([])
  };
}

/**
 * Hook for post status updates
 */
export function usePostUpdates(postId) {
  const { subscribe, joinRoom } = useSocket();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (postId) {
      joinRoom('post', postId);
    }
  }, [postId, joinRoom]);

  useEffect(() => {
    const handlers = [
      subscribe('post:status', ({ postId: id, status: newStatus }) => {
        if (!postId || id === postId) {
          setStatus(newStatus);
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          queryClient.invalidateQueries({ queryKey: ['posts', id] });
        }
      }),
      subscribe('post:published', ({ postId: id, url }) => {
        if (!postId || id === postId) {
          setStatus('published');
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      }),
      subscribe('post:failed', ({ postId: id, error }) => {
        if (!postId || id === postId) {
          setStatus('failed');
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      })
    ];

    return () => handlers.forEach(unsub => unsub());
  }, [postId, subscribe, queryClient]);

  return { status };
}

/**
 * Hook for message updates
 */
export function useMessageUpdates(conversationId) {
  const { subscribe, joinRoom } = useSocket();
  const queryClient = useQueryClient();
  const [newMessages, setNewMessages] = useState([]);

  useEffect(() => {
    if (conversationId) {
      joinRoom('conversation', conversationId);
    }
  }, [conversationId, joinRoom]);

  useEffect(() => {
    const unsubscribe = subscribe('message:new', (message) => {
      if (!conversationId || message.conversationId === conversationId) {
        setNewMessages(prev => [...prev, message]);
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });

    return unsubscribe;
  }, [conversationId, subscribe, queryClient]);

  return {
    newMessages,
    clearNewMessages: () => setNewMessages([])
  };
}

/**
 * Hook for account updates
 */
export function useAccountUpdates() {
  const { subscribe } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handlers = [
      subscribe('account:update', () => {
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
      }),
      subscribe('account:token_expiring', ({ accountId, platform }) => {
        // Could show a toast notification here
        console.warn(`Token expiring for ${platform} account ${accountId}`);
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
      })
    ];

    return () => handlers.forEach(unsub => unsub());
  }, [subscribe, queryClient]);
}

/**
 * Hook for system messages
 */
export function useSystemMessages() {
  const { subscribe } = useSocket();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handlers = [
      subscribe('system:announcement', (msg) => {
        setMessages(prev => [...prev, { ...msg, type: 'announcement', id: Date.now() }]);
      }),
      subscribe('system:message', (msg) => {
        setMessages(prev => [...prev, { ...msg, id: Date.now() }]);
      })
    ];

    return () => handlers.forEach(unsub => unsub());
  }, [subscribe]);

  const dismissMessage = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  return { messages, dismissMessage };
}

export default useSocket;
