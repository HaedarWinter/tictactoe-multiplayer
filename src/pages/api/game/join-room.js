import { safeTrigger } from '@/lib/pusher';

// In-memory storage for rooms (would use a database in production)
// NOTE: This is not reliable in a serverless environment - each instance gets its own copy
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
    
    // Always broadcast a ping to the room to ensure all instances are in sync
    // This ensures the host knows a player is trying to join even if on different instance
    console.log(`Broadcasting ping to room ${roomId} to sync instances`);
    await safeTrigger(`room-${roomId}`, 'room-ping', {
      action: 'join-attempt',
      playerName,
      timestamp: Date.now()
    });
    
    // Create or update the room
    if (!rooms.has(roomId)) {
      // If room doesn't exist, anyone can create it
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
      // Try to sync before rejecting
      await safeTrigger(`room-${roomId}`, 'room-update', {
        players: room.players,
        status: room.status
      });
      
      return res.status(400).json({ message: 'Room is full' });
    }
    
    // If this is the first player, make them the host regardless of isHost parameter
    let shouldBeHost = room.players.length === 0 ? true : isHost === true;
    
    // Check if host role is already taken
    if (shouldBeHost && room.players.some(p => p.isHost)) {
      console.log(`Room ${roomId} already has a host`);
      // If host role is taken, let them join as a non-host
      shouldBeHost = false;
    }
    
    // Check if player with same name already exists
    const existingPlayerIndex = room.players.findIndex(p => p.name === playerName);
    if (existingPlayerIndex >= 0) {
      console.log(`Player with name ${playerName} already exists in room ${roomId}`);
      
      // If it's the same player reconnecting, update their ID and return
      const existingPlayer = room.players[existingPlayerIndex];
      existingPlayer.id = playerId; // Update ID for new connection
      
      // Always broadcast an update regardless
      console.log(`Broadcasting room update for room ${roomId} (player reconnect)`);
      await safeTrigger(`room-${roomId}`, 'room-update', {
        players: room.players,
        status: room.status
      });
      
      return res.status(200).json({
        success: true,
        playerId,
        room: {
          id: roomId,
          players: room.players,
          status: room.status,
          chatHistory: room.chatHistory || []
        }
      });
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
    
    // Send multiple updates to ensure all clients receive them
    // First broadcast the chat message
    console.log(`Broadcasting chat message for room ${roomId}`);
    await safeTrigger(`room-${roomId}`, 'chat-message', joinMessage);
    
    // Then broadcast the room update
    console.log(`Broadcasting room update for room ${roomId}`);
    await safeTrigger(`room-${roomId}`, 'room-update', {
      players: room.players,
      status: room.status
    });
    
    // Also broadcast a direct player join event for extra reliability
    console.log(`Broadcasting player-joined event for room ${roomId}`);
    await safeTrigger(`room-${roomId}`, 'player-joined', {
      player: newPlayer,
      totalPlayers: room.players.length
    });
    
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