import { safeTrigger } from '@/lib/pusher';

// Access the same in-memory storage as join-room
const rooms = new Map();

// Check winning combinations
const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roomId, playerId, position } = req.body;

    if (!roomId || !playerId || position === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get room
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Find player
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return res.status(403).json({ message: 'Player not in this room' });
    }

    // Game must be in progress
    if (room.status !== 'playing') {
      return res.status(400).json({ message: 'Game is not in progress' });
    }

    // Must be player's turn
    if (room.currentTurn !== playerIndex) {
      return res.status(400).json({ message: 'Not your turn' });
    }

    // Position must be valid and empty
    if (position < 0 || position > 8 || room.board[position] !== null) {
      return res.status(400).json({ message: 'Invalid move' });
    }

    // Make the move
    const symbol = playerIndex === 0 ? 'X' : 'O';
    room.board[position] = symbol;

    // Check for winner
    let winner = null;
    let winningLine = null;
    
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (
        room.board[a] && 
        room.board[a] === room.board[b] && 
        room.board[a] === room.board[c]
      ) {
        winner = playerIndex;
        winningLine = combo;
        break;
      }
    }

    // Check for draw
    const isDraw = winner === null && !room.board.includes(null);
    
    // Update game state
    if (winner !== null) {
      room.status = 'completed';
      room.winner = winner;
      room.winningLine = winningLine;
      room.players[winner].score += 1;
    } else if (isDraw) {
      room.status = 'completed';
    } else {
      // Switch turns
      room.currentTurn = (room.currentTurn + 1) % 2;
    }

    // Broadcast game update
    await safeTrigger(`room-${roomId}`, 'game-update', {
      board: room.board,
      currentTurn: room.currentTurn,
      status: room.status,
      winner: room.winner,
      winningLine: room.winningLine,
      players: room.players
    });

    // Return updated game state
    res.status(200).json({
      success: true,
      gameState: {
        board: room.board,
        currentTurn: room.currentTurn,
        status: room.status,
        winner: room.winner,
        winningLine: room.winningLine,
        players: room.players
      }
    });
  } catch (error) {
    console.error('Error making move:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 