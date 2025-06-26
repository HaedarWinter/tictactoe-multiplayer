import { Server as ServerIO } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Define SocketIO instance
  if (!res.socket.server.io) {
    console.log('Setting up Socket.io server');
    
    // Create server
    const httpServer = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      res.statusCode = 200;
      res.end('Socket.io server');
    });
    
    // Create Socket.io server
    const io = new ServerIO(httpServer, {
      path: '',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    // Attach Socket.io server to Next.js API
    res.socket.server.io = io;

    // Socket.io connection handler
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Get data from query
      const roomId = socket.handshake.query.roomId;
      const playerName = socket.handshake.query.playerName;
      const isHost = socket.handshake.query.isHost === 'true';
      
      console.log(`User ${socket.id} joining room ${roomId} as ${isHost ? 'host' : 'guest'} with name ${playerName}`);
      
      // Join room
      if (roomId) {
        socket.join(roomId);
        socket.emit('connected', { id: socket.id, room: roomId });
        
        // Broadcast to room that a new player joined
        socket.to(roomId).emit('player-joined', { 
          id: socket.id, 
          name: playerName,
          isHost: isHost
        });
      }
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (roomId) {
          socket.to(roomId).emit('player-left', { id: socket.id });
        }
      });
      
      // Forward all game events
      socket.on('game-action', (data) => {
        if (roomId) {
          socket.to(roomId).emit('game-update', data);
        }
      });
      
      // Chat messages
      socket.on('chat-message', (data) => {
        if (roomId) {
          io.to(roomId).emit('chat-message', {
            sender: data.sender || playerName,
            message: data.message
          });
        }
      });
      
      // Game state events
      ['room-update', 'game-start', 'board-update', 'turn-update', 'game-win', 'game-draw', 'make-move', 'restart-game'].forEach(event => {
        socket.on(event, (data) => {
          if (roomId) {
            socket.to(roomId).emit(event, data);
          }
        });
      });
    });
  }

  // Return success response
  res.status(200).json({ success: true });
} 