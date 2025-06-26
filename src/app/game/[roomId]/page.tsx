'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';
import WaitingRoom from '@/components/WaitingRoom';
import GameBoard from '@/components/GameBoard';
import { initializeSocket, disconnectSocket } from '@/lib/socket-helper';

// Tipe untuk data pemain
type Player = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
};

// Tipe untuk status game
type GameStatus = 'waiting' | 'playing' | 'finished';

export default function GamePage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId || '';
  const [playerName, setPlayerName] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Effect untuk mendapatkan nama pemain dari localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('playerName');
    const isNewHost = localStorage.getItem('isNewHost') === 'true';
    
    if (storedName) {
      setPlayerName(storedName);
      setIsHost(isNewHost);
    } else {
      router.push('/');
    }
    
    // Clear isNewHost flag setelah digunakan
    localStorage.removeItem('isNewHost');
  }, [router]);

  // Effect untuk menginisialisasi socket
  useEffect(() => {
    if (!playerName || !roomId) return;
    
    try {
      // Inisialisasi socket
      const newSocket = initializeSocket(roomId, playerName, isHost);
      setSocket(newSocket);
      
      // Cleanup saat komponen di-unmount
      return () => {
        disconnectSocket(newSocket);
        setSocket(null);
      };
    } catch (err) {
      console.error('Error initializing socket:', err);
      setErrorMessage('Gagal terhubung ke server. Silakan coba lagi.');
    }
  }, [playerName, roomId, isHost]);

  // Effect untuk menangani event dari server
  useEffect(() => {
    if (!socket) return;

    // Menangani update room
    socket.on('room-update', (data: { players: Player[], status: GameStatus }) => {
      const { players, status } = data;
      
      // Update status game
      setGameStatus(status);
      
      // Update info pemain
      const me = players.find(player => player.id === socket.id);
      const otherPlayer = players.find(player => player.id !== socket.id);
      
      if (me) setCurrentPlayer(me);
      if (otherPlayer) setOpponent(otherPlayer);
      
      setIsLoading(false);
    });
    
    // Menangani start game
    socket.on('game-start', () => {
      setGameStatus('playing');
    });
    
    // Menangani error
    socket.on('error-message', (message: string) => {
      setErrorMessage(message);
    });
    
    // Menangani player left
    socket.on('player-left', () => {
      setGameStatus('waiting');
      setOpponent(null);
    });

    // Cleanup
    return () => {
      socket.off('room-update');
      socket.off('game-start');
      socket.off('error-message');
      socket.off('player-left');
    };
  }, [socket]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400">Menghubungkan ke server...</p>
      </div>
    );
  }

  // Render error message
  if (errorMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="card max-w-md w-full text-center p-6">
          <h2 className="text-xl font-bold mb-4 text-red-500">Error</h2>
          <p className="mb-6">{errorMessage}</p>
          <button 
            className="btn btn-primary"
            onClick={() => router.push('/')}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-8 md:p-12">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold sm:text-2xl">Tic-Tac-Toe Online</h1>
          <button 
            className="px-4 py-1.5 bg-card rounded hover:bg-opacity-80 text-sm transition"
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin keluar dari game?')) {
                disconnectSocket(socket);
                router.push('/');
              }
            }}
          >
            Keluar
          </button>
        </div>

        {gameStatus === 'waiting' ? (
          <WaitingRoom 
            socket={socket}
            currentPlayer={currentPlayer}
            opponent={opponent}
            roomId={roomId}
          />
        ) : (
          <GameBoard 
            socket={socket}
            currentPlayer={currentPlayer}
            opponent={opponent}
            gameStatus={gameStatus}
            roomId={roomId}
          />
        )}
      </div>
    </main>
  );
} 