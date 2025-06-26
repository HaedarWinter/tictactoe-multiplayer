import { safeTrigger } from '@/lib/pusher';

// Access the same in-memory storage
const rooms = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roomId, playerId } = req.body;

    if (!roomId || !playerId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get room
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Find player
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(403).json({ message: 'Player not in this room' });
    }

    // Only host can start the game
    if (!player.isHost) {
      return res.status(403).json({ message: 'Only the host can start the game' });
    }

    // Need two players to start
    if (room.players.length !== 2) {
      return res.status(400).json({ message: 'Need two players to start the game' });
    }

    // Game must be in waiting status
    if (room.status !== 'waiting') {
      return res.status(400).json({ message: 'Game is already in progress or completed' });
    }

    // Start the game
    room.status = 'playing';
    room.board = Array(9).fill(null);
    room.winner = null;
    room.winningLine = null;
    
    // Random first turn
    room.currentTurn = Math.floor(Math.random() * 2);

    // System message
    const startMessage = {
      sender: 'System',
      message: `Game started! ${room.players[room.currentTurn].name}'s turn.`
    };
    room.chatHistory.push(startMessage);

    // Broadcast game update
    await safeTrigger(`room-${roomId}`, 'game-update', {
      board: room.board,
      currentTurn: room.currentTurn,
      status: room.status,
      players: room.players
    });

    // Send chat message
    await safeTrigger(`room-${roomId}`, 'chat-message', startMessage);

    // Return updated game state
    res.status(200).json({
      success: true,
      gameState: {
        board: room.board,
        currentTurn: room.currentTurn,
        status: room.status,
        players: room.players
      }
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 