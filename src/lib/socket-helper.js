import { io } from 'socket.io-client';

// Helper function to initialize socket with proper configuration
export const initializeSocket = (roomId, playerName, isHost) => {
  // Determine base URL - local or production
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? window.location.origin
    : 'http://localhost:3000';
  
  console.log('Initializing socket connection to:', baseUrl);
  
  // Configure socket with proper settings for Vercel
  const socket = io(baseUrl, {
    path: '/api/index-socket',
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    query: {
      roomId,
      playerName,
      isHost: isHost ? 'true' : 'false',
    }
  });

  // Log connection events
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
    console.error('Socket connection error details:', JSON.stringify(err));
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

// Helper function to disconnect socket
export const disconnectSocket = (socket) => {
  if (socket) {
    socket.disconnect();
  }
}; 