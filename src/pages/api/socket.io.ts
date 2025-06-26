import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: Server | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  console.log('Socket.io handler for socket.io path called');

  // Redirect to our main Socket.io handler
  if (!res.socket.server.io) {
    console.log('Socket.io server not initialized, redirecting to main handler');
    
    // Redirect to the main Socket.io handler
    const socketioHandler = await import('./socketio');
    return socketioHandler.default(req, res);
  }

  // If Socket.io server is already running, just return success
  console.log('Socket.io server already running');
  res.status(200).json({ success: true, message: 'Socket server already running' });
} 