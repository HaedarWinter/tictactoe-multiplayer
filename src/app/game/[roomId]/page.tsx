'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { gameClient } from '@/lib/game-client';
import GameBoard from '@/components/GameBoard';
import WaitingRoom from '@/components/WaitingRoom';

// Define types for player and game state
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
}

interface RoomResponse {
  success: boolean;
  playerId: string;
  room: {
    id: string;
    players: Player[];
    status: string;
    board: Array<string | null>;
    currentTurn?: number;
    winner?: number | null;
    winningLine?: number[] | null;
    chatHistory: {
      sender: string;
      message: string;
    }[];
  };
}

interface GameResponse {
  success: boolean;
  message?: string;
  gameState?: {
    board: Array<string | null>;
    currentTurn: number;
    status: string;
    winner?: number | null;
    winningLine?: number[] | null;
    players: Player[];
  };
}

interface Subscription {
  channel: any;
  unsubscribe: () => void;
}

// Safe localStorage functions to prevent SSR errors
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

export default function GameRoom() {
  // Router and params
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const roomId = params?.roomId || '';
  
  // Player info state
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  
  // Initialize player info from URL parameters or localStorage
  useEffect(() => {
    const nameFromParams = searchParams?.get('playerName');
    const isHostFromParams = searchParams?.get('isHost');
    const nameFromStorage = getLocalStorageItem('playerName');
    const isHostFromStorage = getLocalStorageItem('isHost') === 'true';
    
    // Set player name (prioritize URL params over localStorage)
    const finalPlayerName = nameFromParams || nameFromStorage || '';
    setPlayerName(finalPlayerName);
    
    // Set isHost (prioritize URL params over localStorage)
    const finalIsHost = isHostFromParams === 'true' || 
                        (isHostFromParams === null && isHostFromStorage);
    setIsHost(finalIsHost);
    
    // Store values in localStorage
    if (finalPlayerName) {
      setLocalStorageItem('playerName', finalPlayerName);
    }
    setLocalStorageItem('isHost', finalIsHost ? 'true' : 'false');
    
    console.log(`Game room initialized with: roomId=${roomId}, playerName=${finalPlayerName}, isHost=${finalIsHost}`);
  }, [roomId, searchParams]);
  
  // Game state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [board, setBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<number | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Join the room
  useEffect(() => {
    if (!roomId || !playerName) {
      if (loading) {
        setLoading(false); // Don't stay in loading state if we don't have required params
      }
      return;
    }
    
    const joinRoom = async () => {
      try {
        setLoading(true);
        console.log(`Joining room ${roomId} as ${playerName} (isHost: ${isHost})`);
        const response = await gameClient.joinRoom(roomId, playerName, isHost) as RoomResponse;
        
        if (response.success) {
          setPlayerId(response.playerId);
          setPlayers(response.room.players);
          setGameStatus(response.room.status);
          setChatHistory(response.room.chatHistory || []);
          
          if (response.room.board) {
            setBoard(response.room.board);
          }
          
          if (response.room.currentTurn !== undefined) {
            setCurrentTurn(response.room.currentTurn);
          }
          
          if (response.room.winner !== undefined) {
            setWinner(response.room.winner);
          }
          
          if (response.room.winningLine) {
            setWinningLine(response.room.winningLine);
          }
          
          console.log('Successfully joined room:', response);
        }
      } catch (err: any) {
        console.error('Error joining room:', err);
        setError(err.message || 'Failed to join room');
      } finally {
        setLoading(false);
      }
    };
    
    joinRoom();
  }, [roomId, playerName, isHost]);
  
  // Subscribe to room events
  useEffect(() => {
    if (!roomId || !playerId) return;
    
    console.log(`Subscribing to room ${roomId} events`);
    const subscription = gameClient.subscribeToRoom(roomId, {
      onConnectionStateChange: (state: string) => {
        console.log(`Connection state changed to: ${state}`);
        setConnectionStatus(state);
      },
      onRoomUpdate: (data: any) => {
        console.log('Room update received:', data);
        setPlayers(data.players);
        setGameStatus(data.status);
      },
      onGameUpdate: (data: any) => {
        console.log('Game update received:', data);
        setBoard(data.board);
        setCurrentTurn(data.currentTurn);
        setGameStatus(data.status);
        setWinner(data.winner);
        setWinningLine(data.winningLine);
        setPlayers(data.players);
      },
      onChatMessage: (message: any) => {
        console.log('Chat message received:', message);
        setChatHistory(prev => [...prev, message]);
      },
      onError: (errorMsg: string) => {
        console.error('Subscription error:', errorMsg);
        setError(`Connection error: ${errorMsg}`);
      }
    }) as Subscription;
    
    return () => {
      console.log('Unsubscribing from room events');
      subscription.unsubscribe();
    };
  }, [roomId, playerId]);
  
  // Start the game (host only)
  const startGame = async () => {
    if (!roomId || !playerId || !isHost) return;
    
    try {
      console.log('Starting game...');
      const response = await gameClient.startGame(roomId, playerId) as GameResponse;
      
      if (!response.success) {
        setError(response.message || 'Failed to start game');
      }
    } catch (err: any) {
      console.error('Error starting game:', err);
      setError(err.message || 'Failed to start game');
    }
  };
  
  // Make a move on the board
  const makeMove = async (position: number) => {
    if (!roomId || !playerId || gameStatus !== 'playing' || board[position] !== null) return;
    
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || currentTurn !== playerIndex) return;
    
    try {
      console.log(`Making move at position ${position}`);
      await gameClient.makeMove(roomId, playerId, position);
    } catch (err: any) {
      console.error('Error making move:', err);
      setError(err.message || 'Failed to make move');
    }
  };
  
  // Send a chat message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId || !playerId || !chatMessage.trim()) return;
    
    try {
      console.log(`Sending message: ${chatMessage}`);
      await gameClient.sendMessage(roomId, playerId, chatMessage);
      setChatMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
    }
  };
  
  // Return to home
  const leaveRoom = () => {
    router.push('/');
  };
  
  // Get current player index
  const playerIndex = players.findIndex(p => p.id === playerId);
  const isPlayerTurn = playerIndex === currentTurn;
  const playerSymbol = playerIndex === 0 ? 'X' : 'O';
  
  // Missing params state
  if (!playerName && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900">
        <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded max-w-md w-full">
          <h2 className="font-bold mb-2">Missing Information</h2>
          <p>Player name is required to join a game.</p>
          <button 
            onClick={leaveRoom}
            className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900">
        <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded max-w-md w-full">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={leaveRoom}
            className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white">
      {connectionStatus !== 'connected' && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white text-center py-1 px-2 z-50">
          {connectionStatus === 'connecting' ? 'Connecting...' : `Connection status: ${connectionStatus}`}
        </div>
      )}
      
      {gameStatus === 'waiting' ? (
        <WaitingRoom 
          roomId={roomId}
          players={players}
          isHost={isHost}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
        />
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <GameBoard 
              board={board}
              winningLine={winningLine}
              onSquareClick={makeMove}
              isPlayerTurn={isPlayerTurn}
              gameStatus={gameStatus}
            />
            
            <div className="mt-6 bg-slate-800 rounded-lg shadow-md p-4 border border-slate-700">
              <h2 className="text-xl font-semibold mb-2">Game Status</h2>
              
              <div className="flex justify-between mb-4">
                <div className="text-center">
                  <div className="font-bold">{players[0]?.name || 'Player 1'} (X)</div>
                  <div className="text-sm">Score: {players[0]?.score || 0}</div>
                </div>
                
                <div className="text-center">
                  <div className="font-bold">{players[1]?.name || 'Player 2'} (O)</div>
                  <div className="text-sm">Score: {players[1]?.score || 0}</div>
                </div>
              </div>
              
              <div className="text-center py-2 rounded bg-slate-700">
                {gameStatus === 'playing' && (
                  <p>
                    {currentTurn !== null && players[currentTurn] 
                      ? `${players[currentTurn].name}'s turn (${currentTurn === 0 ? 'X' : 'O'})`
                      : 'Game in progress'}
                  </p>
                )}
                
                {gameStatus === 'completed' && (
                  winner !== null 
                    ? <p className="font-bold">{players[winner]?.name} wins!</p>
                    : <p className="font-bold">Game ended in a draw</p>
                )}
              </div>
              
              {gameStatus === 'completed' && isHost && (
                <button
                  onClick={startGame}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500"
                >
                  Play Again
                </button>
              )}
              
              <button
                onClick={leaveRoom}
                className="mt-2 w-full bg-slate-700 text-white py-2 rounded hover:bg-slate-600"
              >
                Leave Room
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg shadow-md p-4 h-[70vh] flex flex-col border border-slate-700">
            <h2 className="text-xl font-semibold mb-2">Chat</h2>
            
            <div className="flex-1 overflow-y-auto mb-4 border border-slate-700 rounded p-2 scrollbar-thin">
              {chatHistory.map((msg, i) => (
                <div key={i} className="mb-2">
                  <span className={`font-bold ${msg.sender === 'System' ? 'text-gray-400' : ''}`}>
                    {msg.sender}:
                  </span> {msg.message}
                </div>
              ))}
            </div>
            
            <form onSubmit={sendMessage} className="flex">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 p-2 border rounded-l bg-slate-700 border-slate-600 text-white"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-500"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 