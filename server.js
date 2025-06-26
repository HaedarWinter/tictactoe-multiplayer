const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Tipe untuk data pemain
const players = new Map();
// Menyimpan data room
const rooms = new Map();
// Menyimpan chat history
const chatHistory = new Map();

// Fungsi untuk memeriksa pemenang
const checkWinner = (board) => {
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

app.prepare().then(() => {
  console.log('Next.js app is prepared');
  
  const server = createServer(async (req, res) => {
    try {
      // Menangani CORS untuk preflight request
      if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-CSRF-Token, X-Api-Version',
          'Access-Control-Allow-Credentials': 'true'
        });
        res.end();
        return;
      }

      // Tambahkan CORS headers ke semua response
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-CSRF-Token, X-Api-Version');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      // Khusus untuk path Socket.io
      const parsedUrl = parse(req.url, true);
      if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/socket.io')) {
        console.log('Socket.io request handled by server.js');
        return;
      }

      // Untuk semua request lainnya, gunakan Next.js handler
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true
    },
    path: '/socket.io'
  });

  // Menangani koneksi socket
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Mendapatkan data dari query
    const roomId = socket.handshake.query.roomId;
    const playerName = socket.handshake.query.playerName;
    const isHost = socket.handshake.query.isHost === 'true';
    
    console.log(`User ${socket.id} joining room ${roomId} as ${isHost ? 'host' : 'guest'} with name ${playerName}`);
    
    // Jika roomId tidak valid
    if (!roomId) {
      socket.emit('error-message', 'Room ID tidak valid');
      socket.disconnect();
      return;
    }
    
    // Membuat pemain baru
    const player = {
      id: socket.id,
      name: playerName || 'Tamu',
      isHost,
      score: 0,
    };
    
    players.set(socket.id, player);
    
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
      });
      
      // Inisialisasi chat history untuk room baru
      chatHistory.set(roomId, []);
    } else {
      // Room sudah ada
      const room = rooms.get(roomId);
      
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
      players: rooms.get(roomId).players,
      status: rooms.get(roomId).status,
    });
    
    // Kirim chat history ke pemain baru
    if (chatHistory.has(roomId)) {
      const history = chatHistory.get(roomId);
      history.forEach(msg => {
        socket.emit('chat-message', msg);
      });
    }
    
    // Tambahkan pesan sistem bahwa pemain bergabung
    const joinMessage = {
      sender: 'Sistem',
      message: `${player.name} telah bergabung ke dalam game`
    };
    
    if (!chatHistory.has(roomId)) {
      chatHistory.set(roomId, [joinMessage]);
    } else {
      chatHistory.get(roomId).push(joinMessage);
    }
    
    io.to(roomId).emit('chat-message', joinMessage);
    
    // Event untuk pesan chat
    socket.on('chat-message', ({ roomId, sender, message }) => {
      const chatMsg = { sender, message };
      
      // Simpan pesan ke history
      if (chatHistory.has(roomId)) {
        chatHistory.get(roomId).push(chatMsg);
        // Batasi history chat (simpan 50 pesan terakhir)
        if (chatHistory.get(roomId).length > 50) {
          chatHistory.get(roomId).shift();
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
      const startMessage = {
        sender: 'Sistem',
        message: 'Game dimulai! ' + hostPlayer?.name + ' (X) giliran pertama.'
      };
      
      if (chatHistory.has(roomId)) {
        chatHistory.get(roomId).push(startMessage);
      }
      
      io.to(roomId).emit('chat-message', startMessage);
    });
    
    // Event untuk gerakan pemain
    socket.on('make-move', ({ roomId, index }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      
      // Validasi: game harus dalam status playing
      if (room.status !== 'playing') {
        socket.emit('error-message', 'Game belum dimulai');
        return;
      }
      
      // Validasi: harus giliran pemain ini
      if (room.currentTurn !== socket.id) {
        socket.emit('error-message', 'Bukan giliran Anda');
        return;
      }
      
      // Validasi: kotak harus kosong
      if (room.board[index] !== null) {
        socket.emit('error-message', 'Kotak sudah terisi');
        return;
      }
      
      // Dapatkan simbol pemain
      const playerSymbol = player.isHost ? 'X' : 'O';
      
      // Update papan
      room.board[index] = playerSymbol;
      
      // Cek pemenang
      const { winner, line } = checkWinner(room.board);
      
      if (winner || line) {
        // Ada pemenang atau seri
        room.status = 'finished';
        
        if (winner) {
          // Update pemenang
          const winnerPlayer = room.players.find(p => (p.isHost && winner === 'X') || (!p.isHost && winner === 'O'));
          if (winnerPlayer) {
            winnerPlayer.score += 1;
            room.winner = winnerPlayer;
            room.winningLine = line;
            
            // Kirim pesan kemenangan
            const winMessage = {
              sender: 'Sistem',
              message: `${winnerPlayer.name} memenangkan permainan!`
            };
            
            if (chatHistory.has(roomId)) {
              chatHistory.get(roomId).push(winMessage);
            }
            
            io.to(roomId).emit('chat-message', winMessage);
          }
        } else {
          // Seri
          const drawMessage = {
            sender: 'Sistem',
            message: 'Permainan berakhir seri!'
          };
          
          if (chatHistory.has(roomId)) {
            chatHistory.get(roomId).push(drawMessage);
          }
          
          io.to(roomId).emit('chat-message', drawMessage);
        }
        
        // Kirim update status ke pemain
        io.to(roomId).emit('room-update', {
          players: room.players,
          status: room.status,
        });
        
        // Kirim update papan
        io.to(roomId).emit('board-update', room.board);
        
        // Jika ada pemenang, kirim info garis kemenangan
        if (winner) {
          io.to(roomId).emit('game-win', {
            winner: room.winner,
            line: room.winningLine
          });
        } else {
          io.to(roomId).emit('game-draw');
        }
      } else {
        // Belum ada pemenang, lanjutkan game
        // Ganti giliran
        const otherPlayer = room.players.find(p => p.id !== socket.id);
        room.currentTurn = otherPlayer?.id || null;
        
        // Kirim update papan
        io.to(roomId).emit('board-update', room.board);
        io.to(roomId).emit('turn-update', room.currentTurn);
      }
    });
    
    // Event untuk restart game
    socket.on('restart-game', () => {
      const room = rooms.get(roomId);
      if (!room) return;
      
      // Validasi: hanya host yang bisa restart
      if (!player.isHost) {
        socket.emit('error-message', 'Hanya host yang bisa memulai ulang game');
        return;
      }
      
      // Validasi: game harus selesai
      if (room.status !== 'finished') {
        socket.emit('error-message', 'Game belum selesai');
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
        message: 'Game dimulai ulang! ' + hostPlayer?.name + ' (X) giliran pertama.'
      };
      
      if (chatHistory.has(roomId)) {
        chatHistory.get(roomId).push(restartMessage);
      }
      
      io.to(roomId).emit('chat-message', restartMessage);
    });
    
    // Event ketika pemain terputus
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Jika tidak di room, tidak perlu melakukan apa-apa
      if (!rooms.has(roomId)) return;
      
      const room = rooms.get(roomId);
      
      // Hapus pemain dari room
      room.players = room.players.filter(p => p.id !== socket.id);
      
      // Jika room kosong, hapus room
      if (room.players.length === 0) {
        console.log(`Room ${roomId} is empty, deleting`);
        rooms.delete(roomId);
        chatHistory.delete(roomId);
        return;
      }
      
      // Kirim pesan bahwa pemain keluar
      const leaveMessage = {
        sender: 'Sistem',
        message: `${player.name} telah keluar dari game`
      };
      
      if (chatHistory.has(roomId)) {
        chatHistory.get(roomId).push(leaveMessage);
      }
      
      io.to(roomId).emit('chat-message', leaveMessage);
      
      // Jika game sedang berlangsung, akhiri
      if (room.status === 'playing') {
        room.status = 'waiting';
        
        // Reset board
        room.board = Array(9).fill(null);
        room.currentTurn = null;
        room.winner = null;
        room.winningLine = null;
        
        // Kirim update ke pemain yang tersisa
        io.to(roomId).emit('room-update', {
          players: room.players,
          status: room.status,
        });
        
        io.to(roomId).emit('player-left');
        
        const endMessage = {
          sender: 'Sistem',
          message: 'Game berakhir karena pemain keluar'
        };
        
        if (chatHistory.has(roomId)) {
          chatHistory.get(roomId).push(endMessage);
        }
        
        io.to(roomId).emit('chat-message', endMessage);
      } else {
        // Jika game belum dimulai, update status saja
        io.to(roomId).emit('room-update', {
          players: room.players,
          status: room.status,
        });
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
}); 