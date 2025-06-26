'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');

  // Load player name from localStorage if available
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Generate a random room ID
  const generateRoomId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setRoomId(result);
  };

  // Create a new game
  const createGame = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!roomId) {
      generateRoomId();
      return;
    }
    
    // Save player name for future use
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('isHost', 'true');
    
    // Navigate to the game room
    router.push(`/game/${roomId}?playerName=${encodeURIComponent(playerName)}&isHost=true`);
  };

  // Join an existing game
  const joinGame = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!joinRoomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    // Save player name for future use
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('isHost', 'false');
    
    // Navigate to the game room
    router.push(`/game/${joinRoomId}?playerName=${encodeURIComponent(playerName)}&isHost=false`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900">
      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700 text-white">
        <h1 className="text-3xl font-bold text-center mb-6">Tic Tac Toe Multiplayer</h1>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="playerName" className="block text-gray-300 mb-2">Your Name</label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-2 border rounded bg-slate-700 border-slate-600 text-white"
            placeholder="Enter your name"
          />
        </div>
        
        <div className="space-y-6">
          <div className="border-t border-slate-700 pt-4">
            <h2 className="text-xl font-semibold mb-4">Create a New Game</h2>
            <form onSubmit={createGame}>
              <div className="mb-4">
                <label htmlFor="roomId" className="block text-gray-300 mb-2">Room ID (optional)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="roomId"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full p-2 border rounded bg-slate-700 border-slate-600 text-white"
                    placeholder="Random ID will be generated"
                  />
                  <button
                    type="button"
                    onClick={generateRoomId}
                    className="bg-slate-700 px-4 py-2 rounded hover:bg-slate-600 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500 transition-colors"
              >
                Create Game
              </button>
            </form>
          </div>
          
          <div className="border-t border-slate-700 pt-4">
            <h2 className="text-xl font-semibold mb-4">Join a Game</h2>
            <form onSubmit={joinGame}>
              <div className="mb-4">
                <label htmlFor="joinRoomId" className="block text-gray-300 mb-2">Room ID</label>
                <input
                  type="text"
                  id="joinRoomId"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="w-full p-2 border rounded bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter room ID"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-500 transition-colors"
              >
                Join Game
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {Array(10).fill(0).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 300 + 50}px`,
              height: `${Math.random() * 300 + 50}px`,
              background: i % 2 === 0 ? 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)' : 
                                       'radial-gradient(circle, rgba(244, 63, 94, 0.4) 0%, rgba(244, 63, 94, 0) 70%)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
            }}
            transition={{
              repeat: Infinity,
              repeatType: 'reverse',
              duration: Math.random() * 10 + 10,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </main>
  );
} 