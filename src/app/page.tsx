'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { motion } from 'framer-motion';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const router = useRouter();

  useEffect(() => {
    // Generate random room ID
    setRoomId(nanoid(6));
    
    // Load previous player name if available
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  const createRoom = () => {
    if (!playerName) {
      setError('Silakan masukkan nama pemain!');
      return;
    }
    
    // Save player info in localStorage
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('isNewHost', 'true');
    
    router.push(`/game/${roomId}`);
  };

  const joinRoom = () => {
    if (!playerName) {
      setError('Silakan masukkan nama pemain!');
      return;
    }
    
    if (!roomId || roomId.length < 6) {
      setError('Kode room tidak valid!');
      return;
    }
    
    // Save player info in localStorage
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('isNewHost', 'false');
    
    router.push(`/game/${roomId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md mx-auto">
        <motion.div 
          className="card w-full shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="flex flex-col items-center mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Tic-Tac-Toe Online
            </h1>
            <p className="text-center text-gray-400">Bermain bersama teman secara online</p>
          </motion.div>
          
          {error && (
            <motion.div 
              className="bg-red-900 bg-opacity-50 p-3 rounded-md mb-4 text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
              <button 
                className="ml-2 text-xs underline"
                onClick={() => setError('')}
              >
                Tutup
              </button>
            </motion.div>
          )}
          
          <div className="mb-6">
            <label htmlFor="name" className="block mb-2 font-medium">Nama Pemain</label>
            <input
              id="name"
              type="text"
              className="input w-full"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Masukkan nama pemain"
              maxLength={15}
              autoComplete="off"
            />
          </div>
          
          <div className="mb-6">
            <div className="flex border-b border-gray-700 mb-4">
              <button
                className={`flex-1 py-2 font-medium transition-all duration-200 ${activeTab === 'create' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('create')}
              >
                Buat Room
              </button>
              <button
                className={`flex-1 py-2 font-medium transition-all duration-200 ${activeTab === 'join' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('join')}
              >
                Gabung Room
              </button>
            </div>
            
            {activeTab === 'create' ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="createRoomId" className="block mb-2 font-medium">Kode Room</label>
                  <div className="flex">
                    <input
                      id="createRoomId"
                      type="text"
                      className="input w-full font-mono uppercase"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      placeholder="Kode room otomatis"
                      maxLength={6}
                    />
                    <motion.button
                      className="ml-2 btn btn-secondary"
                      onClick={() => setRoomId(nanoid(6).toUpperCase())}
                      title="Generate kode baru"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🔄
                    </motion.button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Kode room akan dibuat otomatis</p>
                </div>
                
                <motion.button
                  className="btn btn-primary w-full shadow-glow"
                  onClick={createRoom}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{ 
                    boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 15px rgba(139, 92, 246, 0.5)', '0 0 0px rgba(139, 92, 246, 0)'],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Buat Room Baru
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="joinRoomId" className="block mb-2 font-medium">Kode Room</label>
                  <input
                    id="joinRoomId"
                    type="text"
                    className="input w-full font-mono uppercase"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode room"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-400 mt-1">Masukkan kode yang dibagikan teman Anda</p>
                </div>
                
                <motion.button
                  className="btn btn-secondary w-full shadow-glow-secondary"
                  onClick={joinRoom}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Gabung Room
                </motion.button>
              </motion.div>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-400">
            <p>Bermain Tic-Tac-Toe dengan teman secara online</p>
            <p className="mt-1">Buat room atau gabung ke room yang sudah ada</p>
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-8 text-center text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <p>Dibuat dengan ❤️ menggunakan Next.js dan Socket.io</p>
        </motion.div>
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