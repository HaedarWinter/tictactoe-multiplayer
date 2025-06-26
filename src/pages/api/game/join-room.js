import { safeTrigger } from '@/lib/pusher';

// In-memory storage for rooms (would use a database in production)
const rooms = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Join room request received:', req.body);
    const { roomId, playerName, isHost } = req.body;

    if (!roomId || !playerName) {
      console.log('Missing required fields:', { roomId, playerName });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate a unique player ID
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create or update the room
    if (!rooms.has(roomId)) {
      // If room doesn't exist, anyone can create it (but they'll be marked as host)
      // This handles the issue with serverless functions where rooms may get reset
      console.log(`Room ${roomId} not found, creating new room`);
      
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
    console.log(`Current room state: ${JSON.stringify(room)}`);
    
    // Check if room is full
    if (room.players.length >= 2) {
      console.log(`Room ${roomId} is full`);
      return res.status(400).json({ message: 'Room is full' });
    }
    
    // If this is the first player, make them the host regardless of isHost parameter
    let shouldBeHost = room.players.length === 0 ? true : isHost;
    
    // Check if host role is already taken
    if (shouldBeHost && room.players.some(p => p.isHost)) {
      console.log(`Room ${roomId} already has a host`);
      // If host role is taken, let them join as a non-host
      shouldBeHost = false;
    }
    
    // Add player to room
    const newPlayer = {
      id: playerId,
      name: playerName,
      isHost: shouldBeHost,
      score: 0
    };
    
    room.players.push(newPlayer);
    console.log(`Player ${playerName} (${playerId}) added to room ${roomId}`);
    
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
    console.log(`Broadcasting room update for room ${roomId}`);
    await safeTrigger(`room-${roomId}`, 'room-update', {
      players: room.players,
      status: room.status
    });
    
    // Send chat message
    await safeTrigger(`room-${roomId}`, 'chat-message', joinMessage);
    
    // Return success with player data
    console.log(`Sending success response for player ${playerId}`);
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