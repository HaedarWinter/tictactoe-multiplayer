import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';

type Player = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
};

type GameStatus = 'waiting' | 'playing' | 'finished';

type GameBoardProps = {
  socket: Socket | null;
  currentPlayer: Player | null;
  opponent: Player | null;
  gameStatus: GameStatus;
  roomId: string;
};

// Tipe untuk papan permainan
type Board = Array<string | null>;
// Tipe untuk hasil game
type GameResult = {
  winner: Player | null;
  winningLine: number[] | null;
};

const GameBoard: React.FC<GameBoardProps> = ({
  socket,
  currentPlayer,
  opponent,
  gameStatus,
  roomId,
}) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [message, setMessage] = useState<string>('');
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{sender: string, message: string}>>([]);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);

  // Simbol pemain (X untuk host, O untuk tamu)
  const mySymbol = currentPlayer?.isHost ? 'X' : 'O';
  const opponentSymbol = currentPlayer?.isHost ? 'O' : 'X';

  // Mendengarkan event dari server
  useEffect(() => {
    if (!socket) return;

    // Update papan permainan
    socket.on('board-update', (newBoard: Board) => {
      setBoard(newBoard);
    });

    // Update giliran
    socket.on('turn-update', (playerId: string) => {
      setIsMyTurn(playerId === socket.id);
      
      if (playerId === socket.id) {
        setMessage('Giliran Anda!');
      } else {
        setMessage(`Giliran ${opponent?.name || 'lawan'}...`);
      }
    });

    // Game selesai
    socket.on('game-end', (result: GameResult) => {
      setGameResult(result);
      
      if (result.winner === null) {
        setMessage('Permainan seri!');
      } else if (result.winner?.id === socket.id) {
        setMessage('Anda menang! 🎉');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        setMessage(`${opponent?.name || 'Lawan'} menang!`);
      }
    });
    
    // Pesan chat
    socket.on('chat-message', (data: {sender: string, message: string}) => {
      setChatHistory(prev => [...prev, data]);
      
      // Auto-scroll chat ke bawah
      setTimeout(() => {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    });

    // Cleanup
    return () => {
      socket.off('board-update');
      socket.off('turn-update');
      socket.off('game-end');
      socket.off('chat-message');
    };
  }, [socket, opponent]);

  // Fungsi untuk menangani klik pada kotak
  const handleCellClick = (index: number) => {
    // Hanya bisa klik jika giliran saya dan kotak kosong
    if (!isMyTurn || board[index] !== null || gameResult) return;
    
    // Kirim gerakan ke server
    socket?.emit('make-move', {
      roomId,
      index,
      symbol: mySymbol
    });
    
    setLastMove(index);
  };

  // Fungsi untuk memulai game baru
  const handlePlayAgain = () => {
    socket?.emit('play-again', roomId);
    setGameResult(null);
    setLastMove(null);
  };
  
  // Fungsi untuk mengirim pesan chat
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !chatMessage.trim()) return;
    
    socket.emit('chat-message', {
      roomId,
      sender: currentPlayer?.name || 'Anonim',
      message: chatMessage
    });
    
    setChatMessage('');
  };

  // Render sel papan permainan
  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = gameResult?.winningLine?.includes(index);
    const isLastMove = lastMove === index;
    
    return (
      <motion.button
        key={index}
        className={`w-full aspect-square text-4xl sm:text-5xl font-bold flex items-center justify-center 
          ${value ? 'cursor-default' : isMyTurn ? 'hover:bg-gray-800' : 'cursor-not-allowed'}
          ${isWinningCell ? 'bg-primary bg-opacity-30' : 'bg-card'}
          ${isLastMove ? 'ring-2 ring-yellow-500' : ''}
          border border-gray-700 rounded-md transition-all duration-200`}
        onClick={() => handleCellClick(index)}
        disabled={!isMyTurn || value !== null || !!gameResult}
        whileHover={isMyTurn && !value && !gameResult ? { scale: 1.05 } : {}}
        whileTap={isMyTurn && !value && !gameResult ? { scale: 0.95 } : {}}
        initial={isLastMove ? { scale: 1.1 } : { scale: 1 }}
        animate={isLastMove ? { scale: 1 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {value === 'X' && (
          <motion.span 
            className="text-primary"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            X
          </motion.span>
        )}
        {value === 'O' && (
          <motion.span 
            className="text-secondary"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            O
          </motion.span>
        )}
      </motion.button>
    );
  };

  return (
    <div className="w-full">
      {/* Header info pemain di mobile */}
      <div className="md:hidden flex flex-col gap-3 mb-6">
        <motion.div 
          className="p-3 rounded bg-card shadow-md"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold">
              {currentPlayer?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium">Anda ({mySymbol})</p>
              <p className="text-sm">Skor: {currentPlayer?.score || 0}</p>
            </div>
            {isMyTurn && (
              <div className="ml-auto px-2 py-1 bg-primary bg-opacity-20 rounded text-xs font-medium">
                Giliran Anda
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          className="p-3 rounded bg-card shadow-md"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">
              {opponent?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium">Lawan ({opponentSymbol})</p>
              <p className="text-sm">Skor: {opponent?.score || 0}</p>
            </div>
            {!isMyTurn && gameStatus === 'playing' && (
              <div className="ml-auto px-2 py-1 bg-secondary bg-opacity-20 rounded text-xs font-medium">
                Giliran Lawan
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center md:w-2/3">
          {/* Header info pemain di desktop */}
          <div className="hidden md:flex justify-between w-full mb-4">
            <motion.div 
              className="p-3 rounded bg-card shadow-md"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-medium">Anda ({mySymbol})</p>
              <p>{currentPlayer?.name}</p>
              <p className="text-sm">Skor: {currentPlayer?.score || 0}</p>
              {isMyTurn && (
                <motion.div 
                  className="h-1 bg-primary mt-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.div>
            
            <motion.div 
              className="p-3 rounded bg-card shadow-md"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-medium">Lawan ({opponentSymbol})</p>
              <p>{opponent?.name || 'Menunggu...'}</p>
              <p className="text-sm">Skor: {opponent?.score || 0}</p>
              {!isMyTurn && gameStatus === 'playing' && (
                <motion.div 
                  className="h-1 bg-secondary mt-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.div>
          </div>
          
          <div className="mb-4 h-8 text-center w-full">
            <motion.p 
              className={`font-medium ${isMyTurn ? 'text-green-400' : ''}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              key={message}
            >
              {message}
            </motion.p>
          </div>
          
          <motion.div 
            className="grid grid-cols-3 gap-2 w-full max-w-xs mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Array(9).fill(null).map((_, i) => renderCell(i))}
          </motion.div>
          
          {gameResult && (
            <motion.button
              className="btn btn-primary"
              onClick={handlePlayAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Main Lagi
            </motion.button>
          )}
        </div>
        
        {/* Chat di desktop */}
        <div className="hidden md:block bg-card rounded-lg p-4 shadow-md w-full md:w-1/3">
          <h3 className="text-lg font-medium mb-2">Chat</h3>
          <div id="chat-container" className="bg-background rounded-md p-2 h-48 overflow-y-auto mb-2 scrollbar-thin">
            {chatHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada pesan</p>
            ) : (
              chatHistory.map((chat, i) => (
                <div key={i} className="mb-2">
                  <span className={`font-medium ${chat.sender === currentPlayer?.name ? 'text-primary' : chat.sender === 'Sistem' ? 'text-accent' : 'text-secondary'}`}>
                    {chat.sender}:
                  </span>{' '}
                  <span>{chat.message}</span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={sendChatMessage} className="flex flex-col gap-2">
            <input
              type="text"
              className="chat-input mb-1"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ketik pesan..."
              disabled={!socket?.connected}
            />
            <button
              type="submit"
              className="btn btn-secondary w-full"
              disabled={!socket?.connected || !chatMessage.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
              </svg>
              Kirim Pesan
            </button>
          </form>
        </div>
        
        {/* Chat toggle di mobile */}
        <div className="md:hidden fixed bottom-4 right-4 z-10">
          <motion.button
            className="w-14 h-14 rounded-full bg-primary shadow-glow flex items-center justify-center text-white text-xl"
            onClick={() => setShowChat(!showChat)}
            whileTap={{ scale: 0.9 }}
          >
            {showChat ? '✕' : '💬'}
          </motion.button>
        </div>
        
        {/* Chat modal di mobile */}
        {showChat && (
          <motion.div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowChat(false);
            }}
          >
            <motion.div 
              className="bg-card rounded-t-xl p-4 w-full max-h-[70vh] flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Chat</h3>
                <button 
                  className="p-1 rounded-full hover:bg-gray-700"
                  onClick={() => setShowChat(false)}
                >
                  ✕
                </button>
              </div>
              
              <div 
                id="mobile-chat-container" 
                className="bg-background rounded-md p-2 flex-grow overflow-y-auto mb-2 scrollbar-thin"
                style={{ maxHeight: 'calc(70vh - 130px)' }}
              >
                {chatHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">Belum ada pesan</p>
                ) : (
                  chatHistory.map((chat, i) => (
                    <div key={i} className="mb-2">
                      <span className={`font-medium ${chat.sender === currentPlayer?.name ? 'text-primary' : chat.sender === 'Sistem' ? 'text-accent' : 'text-secondary'}`}>
                        {chat.sender}:
                      </span>{' '}
                      <span>{chat.message}</span>
                    </div>
                  ))
                )}
              </div>
              
              <form onSubmit={sendChatMessage} className="flex flex-col gap-2 mt-auto">
                <input
                  type="text"
                  className="chat-input mb-1"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  disabled={!socket?.connected}
                />
                <button
                  type="submit"
                  className="btn btn-secondary w-full"
                  disabled={!socket?.connected || !chatMessage.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                    <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                  </svg>
                  Kirim Pesan
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
      
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array(50).fill(0).map((_, i) => (
            <div 
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                background: `hsl(${Math.random() * 360}, 100%, 50%)`,
                borderRadius: '50%',
                animation: `confetti ${Math.random() * 3 + 2}s linear forwards`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GameBoard; 