import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (userId) => {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('join', userId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Event listeners
export const onNewMessage = (callback) => {
  if (socket) {
    socket.on('message:new', callback);
  }
};

export const onPostPublished = (callback) => {
  if (socket) {
    socket.on('post:published', callback);
  }
};

export const onNotification = (callback) => {
  if (socket) {
    socket.on('notification', callback);
  }
};

export const removeListener = (event) => {
  if (socket) {
    socket.off(event);
  }
};
