import { pusherServer } from '@/lib/pusher';

// Access the same in-memory storage
const rooms = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roomId, playerId, message } = req.body;

    if (!roomId || !playerId || !message) {
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

    // Create chat message
    const chatMessage = {
      sender: player.name,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Add to chat history
    room.chatHistory.push(chatMessage);

    // Broadcast message
    await pusherServer.trigger(`room-${roomId}`, 'chat-message', chatMessage);

    // Return success
    res.status(200).json({
      success: true,
      message: chatMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 