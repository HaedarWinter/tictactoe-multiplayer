'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import WaitingRoom from '@/components/WaitingRoom';
import GameBoard from '@/components/GameBoard';
import { motion } from 'framer-motion';

// Tipe untuk data pemain
type Player = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
};

// Tipe untuk status game
type GameStatus = 'waiting' | 'playing' | 'finished';

type Room = {
  players: Player[];
  status: GameStatus;
};

export default function GamePage() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const roomId = params?.roomId || '';
  const playerName = searchParams?.get('name') || 'Anonim';
  const isHost = searchParams?.get('host') === 'true';
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [error, setError] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(true);

  // Koneksi ke socket server
  useEffect(() => {
    // Ambil URL dari window location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}`;
    
    // Buat koneksi socket
    const newSocket = io(socketUrl, {
      query: {
        roomId,
        playerName,
        isHost,
      },
    });

    // Event saat terhubung
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnecting(false);
    });

    // Event saat error
    newSocket.on('error-message', (message: string) => {
      setError(message);
    });

    // Event update room
    newSocket.on('room-update', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      
      // Set pemain saat ini
      const me = updatedRoom.players.find(player => player.id === newSocket.id);
      setCurrentPlayer(me || null);
      
      // Set lawan
      const opponent = updatedRoom.players.find(player => player.id !== newSocket.id);
      setOpponent(opponent || null);
    });

    // Event saat koneksi terputus
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Simpan socket ke state
    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, [roomId, playerName, isHost]);

  // Tampilkan loading saat koneksi
  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          className="card max-w-md w-full text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-xl font-medium mb-2">Menghubungkan...</h2>
          <p className="text-gray-400">Mencoba terhubung ke server game</p>
        </motion.div>
      </div>
    );
  }

  // Tampilkan error jika ada
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div 
          className="card max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 rounded-full bg-red-900 mx-auto mb-4 flex items-center justify-center text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            ❌
          </motion.div>
          <h2 className="text-xl font-medium mb-2">Error</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <motion.button
            className="btn btn-primary"
            onClick={() => window.location.href = '/'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Kembali ke Beranda
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl">
        <motion.header 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Tic-Tac-Toe Online</h1>
            <motion.button
              className="btn btn-secondary text-sm"
              onClick={() => window.location.href = '/'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Keluar Game
            </motion.button>
          </div>
        </motion.header>

        {room?.status === 'waiting' && (
          <WaitingRoom
            socket={socket}
            currentPlayer={currentPlayer}
            opponent={opponent}
            roomId={roomId}
          />
        )}

        {(room?.status === 'playing' || room?.status === 'finished') && (
          <GameBoard
            socket={socket}
            currentPlayer={currentPlayer}
            opponent={opponent}
            gameStatus={room.status}
            roomId={roomId}
          />
        )}
      </div>
    </div>
  );
} 