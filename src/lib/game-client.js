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
      console.log(`Attempting to join room ${roomId} as ${playerName} (isHost: ${isHost})`);
      
      if (!roomId) {
        console.error('Room ID is missing');
        throw new Error('Room ID is required');
      }
      
      if (!playerName) {
        console.error('Player name is missing');
        throw new Error('Player name is required');
      }

      const requestBody = { roomId, playerName, isHost };
      console.log('Sending join request with body:', requestBody);
      
      const response = await fetch('/api/game/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log(`Join room response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Failed to join room (HTTP ${response.status})`;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP error ${response.status}`;
        }
        
        console.error(`Join room error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Join room successful:', data);
      return data;
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
      console.log(`Attempting to start game in room ${roomId} as player ${playerId}`);
      
      if (!roomId || !playerId) {
        const errorMsg = !roomId ? 'Room ID is required' : 'Player ID is required';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const response = await fetch('/api/game/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId }),
      });
      
      console.log(`Start game response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Failed to start game (HTTP ${response.status})`;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP error ${response.status}`;
        }
        
        console.error(`Start game error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Start game successful:', data);
      return data;
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
      console.log(`Attempting to make move at position ${position} in room ${roomId} as player ${playerId}`);
      
      if (!roomId || !playerId || position === undefined) {
        const errorMsg = !roomId ? 'Room ID is required' : !playerId ? 'Player ID is required' : 'Position is required';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const response = await fetch('/api/game/make-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId, position }),
      });
      
      console.log(`Make move response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Failed to make move (HTTP ${response.status})`;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP error ${response.status}`;
        }
        
        console.error(`Make move error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Make move successful:', data);
      return data;
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
      console.log(`Attempting to send message in room ${roomId} as player ${playerId}`);
      
      if (!roomId || !playerId || !message) {
        const errorMsg = !roomId ? 'Room ID is required' : !playerId ? 'Player ID is required' : 'Message is required';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const response = await fetch('/api/game/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId, message }),
      });
      
      console.log(`Send message response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Failed to send message (HTTP ${response.status})`;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP error ${response.status}`;
        }
        
        console.error(`Send message error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Send message successful:', data);
      return data;
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
    let roomChannel;
    let privateRoomChannel;
    let globalChannel;
    
    try {
      console.log(`Subscribing to room ${roomId} events`);
      
      // Subscribe to the regular room channel
      roomChannel = pusherClient.subscribe(`room-${roomId}`);
      
      // Subscribe to the private room channel
      // This is for direct messages to this specific room
      privateRoomChannel = pusherClient.subscribe(`private-room-${roomId}`);
      
      // Subscribe to global notifications
      globalChannel = pusherClient.subscribe('global');
      
      // Connection status events
      if (callbacks.onConnectionStateChange) {
        pusherClient.connection.bind('state_change', ({ current }) => {
          console.log(`Pusher connection state changed to: ${current}`);
          callbacks.onConnectionStateChange(current);
        });
      }
      
      // Handle subscription errors
      roomChannel.bind('pusher:subscription_error', (status) => {
        console.error(`Pusher subscription error (${status}) for room ${roomId}`);
        if (callbacks.onError) {
          callbacks.onError(`Failed to subscribe to room events (${status})`);
        }
      });
      
      roomChannel.bind('pusher:subscription_succeeded', () => {
        console.log(`Successfully subscribed to room ${roomId}`);
      });
      
      // Room ping for synchronization
      roomChannel.bind('room-ping', (data) => {
        console.log(`Room ping received for room ${roomId}:`, data);
        // If we're hosting and someone is trying to join, this helps with serverless instance synchronization
        if (data.action === 'join-attempt') {
          console.log(`Player ${data.playerName} is attempting to join room ${roomId}`);
        }
      });
      
      // Direct update on private channel
      if (callbacks.onRoomUpdate) {
        privateRoomChannel.bind('direct-update', (data) => {
          console.log(`Direct update received for room ${roomId}:`, data);
          if (data.action === 'player-joined') {
            console.log(`Direct notification: Player ${data.player.name} joined room ${roomId}`);
            callbacks.onRoomUpdate({
              players: data.allPlayers,
              status: data.status,
              _directNotification: true
            });
          }
        });
      }
      
      // Global notifications that might be relevant to this room
      if (callbacks.onRoomUpdate) {
        globalChannel.bind('room-notification', (data) => {
          if (data.roomId === roomId) {
            console.log(`Global notification for room ${roomId}:`, data);
            if (data.action === 'player-joined') {
              console.log(`Global notification: Player ${data.playerName} joined room ${roomId}`);
              
              // We don't have full player data here, but we can trigger a refresh
              callbacks.onRoomUpdate({
                _globalNotification: true,
                _needsRefresh: true
              });
            }
          }
        });
      }
      
      // Player joined event - more direct than room-update
      if (callbacks.onRoomUpdate) {
        roomChannel.bind('player-joined', (data) => {
          console.log(`Player joined event received for room ${roomId}:`, data);
          try {
            // Update the players list using the standard room update callback
            callbacks.onRoomUpdate({
              players: [data.player], // This is incomplete but will trigger the UI to refresh
              status: 'waiting',
              _playerJoinedEvent: true // Flag to indicate this came from player-joined event
            });
          } catch (error) {
            console.error('Error handling player joined event:', error);
          }
        });
      }
      
      // Room updates (players joining/leaving)
      if (callbacks.onRoomUpdate) {
        roomChannel.bind('room-update', (data) => {
          console.log(`Room update received for room ${roomId}:`, data);
          try {
            callbacks.onRoomUpdate(data);
          } catch (error) {
            console.error('Error handling room update:', error);
          }
        });
      }
      
      // Game updates (moves, game state changes)
      if (callbacks.onGameUpdate) {
        roomChannel.bind('game-update', (data) => {
          console.log(`Game update received for room ${roomId}:`, data);
          try {
            callbacks.onGameUpdate(data);
          } catch (error) {
            console.error('Error handling game update:', error);
          }
        });
      }
      
      // Chat messages
      if (callbacks.onChatMessage) {
        roomChannel.bind('chat-message', (data) => {
          console.log(`Chat message received for room ${roomId}:`, data);
          try {
            callbacks.onChatMessage(data);
          } catch (error) {
            console.error('Error handling chat message:', error);
          }
        });
      }
    } catch (error) {
      console.error(`Error subscribing to room ${roomId}:`, error);
      if (callbacks.onError) {
        callbacks.onError(`Failed to subscribe to room: ${error.message}`);
      }
      
      // Return dummy unsubscribe function to prevent errors
      return {
        channels: [],
        unsubscribe: () => {}
      };
    }
    
    return {
      channels: [roomChannel, privateRoomChannel, globalChannel].filter(Boolean),
      unsubscribe: () => {
        try {
          console.log(`Unsubscribing from room ${roomId}`);
          
          if (roomChannel) {
            roomChannel.unbind_all();
            pusherClient.unsubscribe(`room-${roomId}`);
          }
          
          if (privateRoomChannel) {
            privateRoomChannel.unbind_all();
            pusherClient.unsubscribe(`private-room-${roomId}`);
          }
          
          if (globalChannel) {
            // Only unbind our events, don't unsubscribe from global as other rooms might need it
            globalChannel.unbind('room-notification');
          }
          
          // Unbind connection state change
          if (callbacks.onConnectionStateChange) {
            pusherClient.connection.unbind('state_change');
          }
          
          console.log(`Unsubscribed from room ${roomId}`);
        } catch (error) {
          console.error(`Error unsubscribing from room ${roomId}:`, error);
        }
      }
    };
  }
}; 