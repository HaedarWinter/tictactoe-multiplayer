import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: Server | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

// Tipe untuk data pemain
type Player = {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
};

// Tipe untuk data room
type Room = {
  id: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  board: Array<string | null>;
  currentTurn: string | null; // ID pemain yang sedang giliran
  winner: Player | null;
  winningLine: number[] | null;
  chatHistory?: Array<{sender: string, message: string}>;
};

// Menyimpan data room
const rooms = new Map<string, Room>();

// Fungsi untuk memeriksa pemenang
const checkWinner = (board: Array<string | null>): { winner: string | null; line: number[] | null } => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: lines[i] };
    }
  }

  // Periksa seri (semua kotak terisi)
  if (board.every((cell) => cell !== null)) {
    return { winner: null, line: null };
  }

  return { winner: null, line: null };
};

// Pastikan Socket.io server hanya dibuat sekali
let io: Server;

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  console.log('Socket.io handler called');

  // Jika server socket sudah ada, tidak perlu membuat lagi
  if (res.socket.server.io) {
    console.log('Socket.io server already running');
    res.status(200).json({ success: true, message: 'Socket server already running' });
    return;
  }

  console.log('Setting up Socket.io server...');

  // Membuat instance server Socket.io dengan konfigurasi CORS yang lebih sederhana
  io = new Server({
    path: '/socket.io',
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    addTrailingSlash: false
  });

  // Pasang server Socket.io ke server HTTP Next.js
  io.attach(res.socket.server);
  
  res.socket.server.io = io;

  // Menangani koneksi socket
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Mendapatkan data dari query
    const roomId = socket.handshake.query.roomId as string;
    const playerName = socket.handshake.query.playerName as string;
    const isHost = socket.handshake.query.isHost === 'true';
    
    console.log(`User ${socket.id} joining room ${roomId} as ${isHost ? 'host' : 'guest'} with name ${playerName}`);
    
    // Jika roomId tidak valid
    if (!roomId) {
      socket.emit('error-message', 'Room ID tidak valid');
      socket.disconnect();
      return;
    }
    
    // Membuat pemain baru
    const player: Player = {
      id: socket.id,
      name: playerName || 'Tamu',
      isHost,
      score: 0,
    };
    
    // Jika room belum ada, buat baru
    if (!rooms.has(roomId)) {
      // Hanya host yang bisa membuat room baru
      if (!isHost) {
        socket.emit('error-message', 'Room tidak ditemukan');
        socket.disconnect();
        return;
      }
      
      console.log(`Creating new room: ${roomId}`);
      
      // Buat room baru
      rooms.set(roomId, {
        id: roomId,
        players: [player],
        status: 'waiting',
        board: Array(9).fill(null),
        currentTurn: null,
        winner: null,
        winningLine: null,
        chatHistory: []
      });
    } else {
      // Room sudah ada
      const room = rooms.get(roomId)!;
      
      console.log(`Room ${roomId} exists with ${room.players.length} players`);
      
      // Jika room sudah penuh
      if (room.players.length >= 2) {
        socket.emit('error-message', 'Room sudah penuh');
        socket.disconnect();
        return;
      }
      
      // Jika pemain mencoba bergabung sebagai host tapi sudah ada host
      if (isHost && room.players.some(p => p.isHost)) {
        socket.emit('error-message', 'Room sudah memiliki host');
        socket.disconnect();
        return;
      }
      
      // Tambahkan pemain ke room
      room.players.push(player);
      console.log(`Player ${player.name} (${player.id}) added to room ${roomId}`);
    }
    
    // Bergabung ke room socket
    socket.join(roomId);
    
    // Kirim update room ke semua pemain di room
    io.to(roomId).emit('room-update', {
      players: rooms.get(roomId)!.players,
      status: rooms.get(roomId)!.status,
    });
    
    // Kirim chat history ke pemain baru jika ada
    const room = rooms.get(roomId)!;
    if (room.chatHistory && room.chatHistory.length > 0) {
      room.chatHistory.forEach(msg => {
        socket.emit('chat-message', msg);
      });
    }
    
    // Tambahkan pesan sistem bahwa pemain bergabung
    const joinMessage = {
      sender: 'Sistem',
      message: `${player.name} telah bergabung ke dalam game`
    };
    
    if (!room.chatHistory) {
      room.chatHistory = [joinMessage];
    } else {
      room.chatHistory.push(joinMessage);
    }
    
    io.to(roomId).emit('chat-message', joinMessage);
    
    // Event untuk pesan chat
    socket.on('chat-message', ({ roomId, sender, message }) => {
      const chatMsg = { sender, message };
      const room = rooms.get(roomId);
      
      if (!room) return;
      
      // Simpan pesan ke history
      if (!room.chatHistory) {
        room.chatHistory = [chatMsg];
      } else {
        room.chatHistory.push(chatMsg);
        // Batasi history chat (simpan 50 pesan terakhir)
        if (room.chatHistory.length > 50) {
          room.chatHistory.shift();
        }
      }
      
      // Broadcast pesan ke semua pemain di room
      io.to(roomId).emit('chat-message', chatMsg);
    });
    
    // Event untuk memulai game
    socket.on('start-game', () => {
      const room = rooms.get(roomId);
      if (!room) return;
      
      console.log(`Starting game in room ${roomId}`);
      
      // Hanya host yang bisa memulai game
      if (!player.isHost) {
        socket.emit('error-message', 'Hanya host yang bisa memulai game');
        return;
      }
      
      // Harus ada 2 pemain untuk memulai game
      if (room.players.length !== 2) {
        socket.emit('error-message', 'Diperlukan 2 pemain untuk memulai game');
        return;
      }
      
      // Mulai game
      room.status = 'playing';
      room.board = Array(9).fill(null);
      room.winner = null;
      room.winningLine = null;
      
      // Host mulai duluan (X)
      const hostPlayer = room.players.find(p => p.isHost);
      room.currentTurn = hostPlayer?.id || null;
      
      // Kirim update ke semua pemain
      io.to(roomId).emit('room-update', {
        players: room.players,
        status: room.status,
      });
      
      io.to(roomId).emit('game-start');
      io.to(roomId).emit('board-update', room.board);
      io.to(roomId).emit('turn-update', room.currentTurn);
      
      // Tambahkan pesan sistem bahwa game dimulai
      const gameStartMessage = {
        sender: 'Sistem',
        message: 'Game dimulai! Pemain X (host) mulai duluan.'
      };
      
      if (!room.chatHistory) {
        room.chatHistory = [gameStartMessage];
      } else {
        room.chatHistory.push(gameStartMessage);
      }
      
      io.to(roomId).emit('chat-message', gameStartMessage);
    });
    
    // Event untuk membuat gerakan
    socket.on('make-move', ({ index, symbol }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      
      console.log(`Player ${socket.id} making move at index ${index} with symbol ${symbol}`);
      
      // Periksa apakah giliran pemain ini
      if (room.currentTurn !== socket.id) {
        socket.emit('error-message', 'Bukan giliran Anda');
        return;
      }
      
      // Periksa apakah kotak sudah terisi
      if (room.board[index] !== null) {
        socket.emit('error-message', 'Kotak sudah terisi');
        return;
      }
      
      // Buat gerakan
      room.board[index] = symbol;
      
      // Kirim update papan ke semua pemain
      io.to(roomId).emit('board-update', room.board);
      
      // Periksa pemenang
      const { winner, line } = checkWinner(room.board);
      
      if (winner) {
        // Ada pemenang
        const winningPlayer = room.players.find(p => 
          (winner === 'X' && p.isHost) || (winner === 'O' && !p.isHost)
        );
        
        if (winningPlayer) {
          winningPlayer.score += 1;
          room.winner = winningPlayer;
          room.winningLine = line;
          room.status = 'finished';
          
          // Kirim update ke semua pemain
          io.to(roomId).emit('game-end', {
            winner: winningPlayer,
            winningLine: line,
          });
          
          io.to(roomId).emit('room-update', {
            players: room.players,
            status: room.status,
          });
          
          // Tambahkan pesan sistem tentang pemenang
          const winMessage = {
            sender: 'Sistem',
            message: `${winningPlayer.name} memenangkan game!`
          };
          
          if (!room.chatHistory) {
            room.chatHistory = [winMessage];
          } else {
            room.chatHistory.push(winMessage);
          }
          
          io.to(roomId).emit('chat-message', winMessage);
        }
      } else if (line === null && room.board.every(cell => cell !== null)) {
        // Seri
        room.status = 'finished';
        room.winner = null;
        
        // Kirim update ke semua pemain
        io.to(roomId).emit('game-end', {
          winner: null,
          winningLine: null,
        });
        
        io.to(roomId).emit('room-update', {
          players: room.players,
          status: room.status,
        });
        
        // Tambahkan pesan sistem tentang hasil seri
        const drawMessage = {
          sender: 'Sistem',
          message: 'Game berakhir seri!'
        };
        
        if (!room.chatHistory) {
          room.chatHistory = [drawMessage];
        } else {
          room.chatHistory.push(drawMessage);
        }
        
        io.to(roomId).emit('chat-message', drawMessage);
      } else {
        // Ganti giliran
        const nextPlayer = room.players.find(p => p.id !== room.currentTurn);
        if (nextPlayer) {
          room.currentTurn = nextPlayer.id;
          io.to(roomId).emit('turn-update', room.currentTurn);
        }
      }
    });
    
    // Event untuk restart game
    socket.on('restart-game', () => {
      const room = rooms.get(roomId);
      if (!room) return;
      
      // Hanya host yang bisa restart game
      if (!player.isHost) {
        socket.emit('error-message', 'Hanya host yang bisa restart game');
        return;
      }
      
      // Reset game
      room.status = 'playing';
      room.board = Array(9).fill(null);
      room.winner = null;
      room.winningLine = null;
      
      // Host mulai duluan (X)
      const hostPlayer = room.players.find(p => p.isHost);
      room.currentTurn = hostPlayer?.id || null;
      
      // Kirim update ke semua pemain
      io.to(roomId).emit('room-update', {
        players: room.players,
        status: room.status,
      });
      
      io.to(roomId).emit('game-start');
      io.to(roomId).emit('board-update', room.board);
      io.to(roomId).emit('turn-update', room.currentTurn);
      
      // Tambahkan pesan sistem bahwa game dimulai ulang
      const restartMessage = {
        sender: 'Sistem',
        message: 'Game dimulai ulang! Pemain X (host) mulai duluan.'
      };
      
      if (!room.chatHistory) {
        room.chatHistory = [restartMessage];
      } else {
        room.chatHistory.push(restartMessage);
      }
      
      io.to(roomId).emit('chat-message', restartMessage);
    });
    
    // Event untuk disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      const room = rooms.get(roomId);
      if (!room) return;
      
      // Hapus pemain dari room
      room.players = room.players.filter(p => p.id !== socket.id);
      
      // Jika room kosong, hapus room
      if (room.players.length === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
        return;
      }
      
      // Jika game sedang berlangsung, akhiri game
      if (room.status === 'playing') {
        room.status = 'waiting';
        
        // Kirim update ke semua pemain yang tersisa
        io.to(roomId).emit('room-update', {
          players: room.players,
          status: room.status,
        });
        
        io.to(roomId).emit('player-left');
        
        // Tambahkan pesan sistem bahwa pemain meninggalkan game
        const leaveMessage = {
          sender: 'Sistem',
          message: `${player.name} telah meninggalkan game`
        };
        
        if (!room.chatHistory) {
          room.chatHistory = [leaveMessage];
        } else {
          room.chatHistory.push(leaveMessage);
        }
        
        io.to(roomId).emit('chat-message', leaveMessage);
      } else {
        // Kirim update ke semua pemain yang tersisa
        io.to(roomId).emit('room-update', {
          players: room.players,
          status: room.status,
        });
        
        // Tambahkan pesan sistem bahwa pemain meninggalkan game
        const leaveMessage = {
          sender: 'Sistem',
          message: `${player.name} telah meninggalkan game`
        };
        
        if (!room.chatHistory) {
          room.chatHistory = [leaveMessage];
        } else {
          room.chatHistory.push(leaveMessage);
        }
        
        io.to(roomId).emit('chat-message', leaveMessage);
      }
    });
  });

  res.status(200).json({ success: true, message: 'Socket server started' });
} 