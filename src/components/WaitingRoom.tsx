import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';

type Player = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
};

type WaitingRoomProps = {
  socket: Socket | null;
  currentPlayer: Player | null;
  opponent: Player | null;
  roomId: string;
};

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  socket,
  currentPlayer,
  opponent,
  roomId,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setShowCopyTooltip(true);
    setTimeout(() => setShowCopyTooltip(false), 2000);
  };

  const shareRoom = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Tic-Tac-Toe Online',
        text: `Ayo main Tic-Tac-Toe bersamaku! Gunakan kode room: ${roomId}`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      copyRoomId();
    }
  };

  const startGame = () => {
    socket?.emit('start-game');
  };

  // Membuat URL untuk QR code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`;

  return (
    <motion.div 
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="card shadow-lg animate-board-appear">
        <motion.div 
          className="text-center mb-6"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-1">Ruang Tunggu</h2>
          <p className="text-gray-400 text-sm">Menunggu pemain untuk memulai permainan</p>
        </motion.div>
        
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-gray-400">Kode Room:</span>
            <div className="flex gap-2">
              <div className="relative">
                <motion.button
                  className="flex items-center gap-2 bg-card px-3 py-1 rounded-md border border-gray-700 hover:bg-opacity-80"
                  onClick={copyRoomId}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="font-mono font-medium">{roomId}</span>
                  <span>{copied ? '✅' : '📋'}</span>
                </motion.button>
                
                {showCopyTooltip && (
                  <motion.div 
                    className="absolute right-0 top-full mt-2 bg-card px-2 py-1 rounded text-xs z-10"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    Kode disalin!
                  </motion.div>
                )}
              </div>
              
              <motion.button
                className="bg-card px-3 py-1 rounded-md border border-gray-700 hover:bg-opacity-80"
                onClick={shareRoom}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Bagikan room"
              >
                🔗
              </motion.button>
              
              <motion.button
                className="bg-card px-3 py-1 rounded-md border border-gray-700 hover:bg-opacity-80"
                onClick={() => setShowQRCode(!showQRCode)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Tampilkan QR Code"
              >
                {showQRCode ? '❌' : 'QR'}
              </motion.button>
            </div>
          </div>
          
          {showQRCode && (
            <motion.div 
              className="flex flex-col items-center my-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-sm text-gray-400 mb-2">Scan QR Code untuk bergabung:</p>
              <img 
                src={qrCodeUrl} 
                alt="QR Code untuk bergabung ke room" 
                className="w-32 h-32 bg-white p-1 rounded"
              />
            </motion.div>
          )}
          
          <p className="text-sm text-gray-400">Bagikan kode ini ke teman Anda untuk bermain bersama</p>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium mb-3">Pemain ({opponent ? '2/2' : '1/2'})</h3>
          
          <div className="space-y-3">
            {/* Pemain saat ini */}
            <motion.div 
              className="flex items-center gap-3 p-3 bg-card border border-gray-700 rounded-md shadow-md"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold">
                {currentPlayer?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-medium">{currentPlayer?.name || 'Anonim'}</p>
                <p className="text-xs text-gray-400">{currentPlayer?.isHost ? 'Host (X)' : 'Tamu (O)'}</p>
              </div>
              <div className="ml-auto">
                <span className="bg-green-800 bg-opacity-30 text-green-400 text-xs px-2 py-1 rounded">
                  Online
                </span>
              </div>
            </motion.div>
            
            {/* Lawan */}
            {opponent ? (
              <motion.div 
                className="flex items-center gap-3 p-3 bg-card border border-gray-700 rounded-md shadow-md"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">
                  {opponent?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium">{opponent?.name || 'Anonim'}</p>
                  <p className="text-xs text-gray-400">{opponent?.isHost ? 'Host (X)' : 'Tamu (O)'}</p>
                </div>
                <div className="ml-auto">
                  <span className="bg-green-800 bg-opacity-30 text-green-400 text-xs px-2 py-1 rounded">
                    Online
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="flex items-center gap-3 p-3 bg-card border border-gray-700 rounded-md border-dashed opacity-70"
                animate={{ 
                  opacity: [0.5, 0.7, 0.5],
                  borderColor: ['rgb(75, 85, 99)', 'rgb(55, 65, 81)', 'rgb(75, 85, 99)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  ?
                </div>
                <div>
                  <p className="font-medium">Menunggu pemain...</p>
                  <p className="text-xs text-gray-400">Bagikan kode room untuk mengundang teman</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {currentPlayer?.isHost && (
          <div className="text-center">
            <motion.button
              className={`btn btn-primary w-full ${!opponent && 'opacity-50 cursor-not-allowed'}`}
              onClick={startGame}
              disabled={!opponent}
              whileHover={opponent ? { scale: 1.05 } : {}}
              whileTap={opponent ? { scale: 0.95 } : {}}
              animate={opponent ? { 
                scale: [1, 1.05, 1],
                boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 15px rgba(139, 92, 246, 0.5)', '0 0 0px rgba(139, 92, 246, 0)'],
                transition: { duration: 1.5, repeat: Infinity }
              } : {}}
            >
              {opponent ? 'Mulai Permainan' : 'Menunggu Pemain Lain...'}
            </motion.button>
            
            {!opponent && (
              <p className="text-sm text-gray-400 mt-2">
                Tunggu pemain lain bergabung untuk memulai permainan
              </p>
            )}
          </div>
        )}
        
        {!currentPlayer?.isHost && (
          <div className="text-center">
            <motion.div
              className="p-3 bg-card border border-gray-700 rounded-md"
              animate={{ 
                opacity: [0.7, 1, 0.7],
                borderColor: ['rgb(75, 85, 99)', 'rgb(55, 65, 81)', 'rgb(75, 85, 99)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-gray-300">
                {opponent ? 'Menunggu host memulai permainan...' : 'Menunggu pemain lain bergabung...'}
              </p>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Tips */}
      <motion.div 
        className="mt-4 p-3 bg-card bg-opacity-50 border border-gray-700 rounded-md shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h3 className="text-sm font-medium mb-1">Tips:</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• X selalu mulai duluan (Host)</li>
          <li>• Pemain pertama yang membuat garis 3 simbol menang</li>
          <li>• Gunakan chat untuk berkomunikasi dengan lawan</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default WaitingRoom; 