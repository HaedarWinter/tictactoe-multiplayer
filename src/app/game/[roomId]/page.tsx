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

export default function GameRoom() {
  // Router and params
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const roomId = params?.roomId || '';
  
  // Player info from URL or localStorage
  const playerName = searchParams?.get('playerName') || localStorage.getItem('playerName') || '';
  const isHost = searchParams?.get('isHost') === 'true' || localStorage.getItem('isHost') === 'true';
  
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
  
  // Join the room
  useEffect(() => {
    const joinRoom = async () => {
      if (!roomId || !playerName) {
        router.push('/');
        return;
      }
      
      try {
        setLoading(true);
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
        }
      } catch (err: any) {
        setError(err.message || 'Failed to join room');
        console.error('Error joining room:', err);
      } finally {
        setLoading(false);
      }
    };
    
    joinRoom();
  }, [roomId, playerName, isHost, router]);
  
  // Subscribe to room events
  useEffect(() => {
    if (!roomId || !playerId) return;
    
    const subscription = gameClient.subscribeToRoom(roomId, {
      onRoomUpdate: (data: any) => {
        setPlayers(data.players);
        setGameStatus(data.status);
      },
      onGameUpdate: (data: any) => {
        setBoard(data.board);
        setCurrentTurn(data.currentTurn);
        setGameStatus(data.status);
        setWinner(data.winner);
        setWinningLine(data.winningLine);
        setPlayers(data.players);
      },
      onChatMessage: (message: any) => {
        setChatHistory(prev => [...prev, message]);
      }
    }) as Subscription;
    
    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, playerId]);
  
  // Start the game (host only)
  const startGame = async () => {
    if (!roomId || !playerId || !isHost) return;
    
    try {
      const response = await gameClient.startGame(roomId, playerId) as GameResponse;
      
      if (!response.success) {
        setError(response.message || 'Failed to start game');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
      console.error('Error starting game:', err);
    }
  };
  
  // Make a move on the board
  const makeMove = async (position: number) => {
    if (!roomId || !playerId || gameStatus !== 'playing' || board[position] !== null) return;
    
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || currentTurn !== playerIndex) return;
    
    try {
      await gameClient.makeMove(roomId, playerId, position);
    } catch (err: any) {
      setError(err.message || 'Failed to make move');
      console.error('Error making move:', err);
    }
  };
  
  // Send a chat message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId || !playerId || !chatMessage.trim()) return;
    
    try {
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
  
  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={leaveRoom}
            className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
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
            
            <div className="mt-6 bg-white rounded-lg shadow-md p-4">
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
              
              <div className="text-center py-2 rounded bg-gray-100">
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
                  className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  Play Again
                </button>
              )}
              
              <button
                onClick={leaveRoom}
                className="mt-2 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Leave Room
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] flex flex-col">
            <h2 className="text-xl font-semibold mb-2">Chat</h2>
            
            <div className="flex-1 overflow-y-auto mb-4 border rounded p-2">
              {chatHistory.map((msg, i) => (
                <div key={i} className="mb-2">
                  <span className={`font-bold ${msg.sender === 'System' ? 'text-gray-500' : ''}`}>
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
                className="flex-1 p-2 border rounded-l"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-r"
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