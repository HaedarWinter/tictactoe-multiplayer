import { pusherServer } from '@/lib/pusher';

// In-memory storage for rooms (would use a database in production)
const rooms = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roomId, playerName, isHost } = req.body;

    if (!roomId || !playerName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate a unique player ID
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create or update the room
    if (!rooms.has(roomId)) {
      // Only hosts can create rooms
      if (!isHost) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Create new room
      rooms.set(roomId, {
        id: roomId,
        players: [],
        status: 'waiting',
        board: Array(9).fill(null),
        currentTurn: null,
        winner: null,
        winningLine: null,
        chatHistory: []
      });
      
      console.log(`New room created: ${roomId}`);
    }
    
    const room = rooms.get(roomId);
    
    // Check if room is full
    if (room.players.length >= 2) {
      return res.status(400).json({ message: 'Room is full' });
    }
    
    // Check if host role is already taken
    if (isHost && room.players.some(p => p.isHost)) {
      return res.status(400).json({ message: 'Room already has a host' });
    }
    
    // Add player to room
    const newPlayer = {
      id: playerId,
      name: playerName,
      isHost: isHost,
      score: 0
    };
    
    room.players.push(newPlayer);
    
    // Add system message
    const joinMessage = {
      sender: 'System',
      message: `${playerName} has joined the game`
    };
    
    if (!room.chatHistory) {
      room.chatHistory = [joinMessage];
    } else {
      room.chatHistory.push(joinMessage);
    }
    
    // Broadcast room update to all clients
    await pusherServer.trigger(`room-${roomId}`, 'room-update', {
      players: room.players,
      status: room.status
    });
    
    // Send chat message
    await pusherServer.trigger(`room-${roomId}`, 'chat-message', joinMessage);
    
    // Return success with player data
    res.status(200).json({
      success: true,
      playerId,
      room: {
        id: roomId,
        players: room.players,
        status: room.status,
        chatHistory: room.chatHistory
      }
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 