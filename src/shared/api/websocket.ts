import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';

let socket: Socket | null = null;

export const connectWebSocket = (token: string): Socket => {
  socket = io(WS_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  return socket;
};

export const getWebSocket = (): Socket | null => {
  return socket;
};

export const disconnectWebSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
