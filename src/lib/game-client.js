import { pusherClient } from './pusher';

/**
 * Helper functions for managing game state on the client side
 */
export const gameClient = {
  /**
   * Join a room
   * @param {string} roomId - The room ID
   * @param {string} playerName - The player's name
   * @param {boolean} isHost - Whether the player is the host
   * @returns {Promise<object>} - The room data
   */
  async joinRoom(roomId, playerName, isHost) {
    try {
      const response = await fetch('/api/game/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerName, isHost }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || `Failed to join room (${response.status})`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  },
  
  /**
   * Start the game
   * @param {string} roomId - The room ID
   * @param {string} playerId - The player's ID
   * @returns {Promise<object>} - The game state
   */
  async startGame(roomId, playerId) {
    try {
      const response = await fetch('/api/game/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || `Failed to start game (${response.status})`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  },
  
  /**
   * Make a move
   * @param {string} roomId - The room ID
   * @param {string} playerId - The player's ID
   * @param {number} position - The position on the board (0-8)
   * @returns {Promise<object>} - The updated game state
   */
  async makeMove(roomId, playerId, position) {
    try {
      const response = await fetch('/api/game/make-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId, position }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || `Failed to make move (${response.status})`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    }
  },
  
  /**
   * Send a chat message
   * @param {string} roomId - The room ID
   * @param {string} playerId - The player's ID
   * @param {string} message - The message text
   * @returns {Promise<object>} - The message data
   */
  async sendMessage(roomId, playerId, message) {
    try {
      const response = await fetch('/api/game/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId, message }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || `Failed to send message (${response.status})`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  /**
   * Subscribe to room events
   * @param {string} roomId - The room ID
   * @param {object} callbacks - Event callbacks
   * @returns {object} - Subscription channels
   */
  subscribeToRoom(roomId, callbacks = {}) {
    let channel;
    
    try {
      channel = pusherClient.subscribe(`room-${roomId}`);
      
      // Connection status events
      if (callbacks.onConnectionStateChange) {
        pusherClient.connection.bind('state_change', ({ current }) => {
          callbacks.onConnectionStateChange(current);
        });
      }
      
      // Handle subscription errors
      channel.bind('pusher:subscription_error', (status) => {
        console.error('Pusher subscription error:', status);
        if (callbacks.onError) {
          callbacks.onError(`Failed to subscribe to room events (${status})`);
        }
      });
      
      // Room updates (players joining/leaving)
      if (callbacks.onRoomUpdate) {
        channel.bind('room-update', (data) => {
          try {
            callbacks.onRoomUpdate(data);
          } catch (error) {
            console.error('Error handling room update:', error);
          }
        });
      }
      
      // Game updates (moves, game state changes)
      if (callbacks.onGameUpdate) {
        channel.bind('game-update', (data) => {
          try {
            callbacks.onGameUpdate(data);
          } catch (error) {
            console.error('Error handling game update:', error);
          }
        });
      }
      
      // Chat messages
      if (callbacks.onChatMessage) {
        channel.bind('chat-message', (data) => {
          try {
            callbacks.onChatMessage(data);
          } catch (error) {
            console.error('Error handling chat message:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error subscribing to room:', error);
      if (callbacks.onError) {
        callbacks.onError(`Failed to subscribe to room: ${error.message}`);
      }
      
      // Return dummy unsubscribe function to prevent errors
      return {
        channel: null,
        unsubscribe: () => {}
      };
    }
    
    return {
      channel,
      unsubscribe: () => {
        try {
          if (channel) {
            channel.unbind_all();
            pusherClient.unsubscribe(`room-${roomId}`);
          }
          
          // Unbind connection state change
          if (callbacks.onConnectionStateChange) {
            pusherClient.connection.unbind('state_change');
          }
        } catch (error) {
          console.error('Error unsubscribing from room:', error);
        }
      }
    };
  }
}; 