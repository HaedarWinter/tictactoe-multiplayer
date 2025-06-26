const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
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

// Fungsi untuk mencari port yang tersedia
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port sudah digunakan, coba port berikutnya
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      // Port tersedia, tutup server dan kembalikan port
      server.close(() => {
        resolve(startPort);
      });
    });
    
    server.listen(startPort);
  });
};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
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
      const gameStartMessage = {
        sender: 'Sistem',
        message: 'Permainan dimulai!'
      };
      
      if (chatHistory.has(roomId)) {
        chatHistory.get(roomId).push(gameStartMessage);
      }
      
      io.to(roomId).emit('chat-message', gameStartMessage);
    });
    
    // Event untuk membuat gerakan
    socket.on('make-move', ({ roomId, index, symbol }) => {
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
      
      if (winner || line) {
        // Ada pemenang atau seri
        room.status = 'finished';
        
        // Jika ada pemenang, tambahkan skor
        if (winner) {
          const winnerPlayer = room.players.find(p => 
            (p.isHost && winner === 'X') || (!p.isHost && winner === 'O')
          );
          
          if (winnerPlayer) {
            winnerPlayer.score += 1;
            room.winner = winnerPlayer;
            
            // Tambahkan pesan sistem tentang pemenang
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
          // Permainan seri
          const drawMessage = {
            sender: 'Sistem',
            message: 'Permainan berakhir seri!'
          };
          
          if (chatHistory.has(roomId)) {
            chatHistory.get(roomId).push(drawMessage);
          }
          
          io.to(roomId).emit('chat-message', drawMessage);
        }
        
        room.winningLine = line;
        
        console.log(`Game in room ${roomId} ended with winner: ${room.winner?.name || 'Seri'}`);
        
        // Kirim hasil game
        io.to(roomId).emit('game-end', {
          winner: room.winner,
          winningLine: room.winningLine,
        });
        
        // Update room
        io.to(roomId).emit('room-update', {
          players: room.players,
          status: room.status,
        });
      } else {
        // Ganti giliran
        const nextPlayer = room.players.find(p => p.id !== socket.id);
        room.currentTurn = nextPlayer?.id || null;
        
        // Kirim update giliran
        io.to(roomId).emit('turn-update', room.currentTurn);
      }
    });
    
    // Event untuk main lagi
    socket.on('play-again', () => {
      const room = rooms.get(roomId);
      if (!room) return;
      
      console.log(`Starting new game in room ${roomId}`);
      
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
      
      io.to(roomId).emit('board-update', room.board);
      io.to(roomId).emit('turn-update', room.currentTurn);
      
      // Tambahkan pesan sistem bahwa permainan baru dimulai
      const newGameMessage = {
        sender: 'Sistem',
        message: 'Permainan baru dimulai!'
      };
      
      if (chatHistory.has(roomId)) {
        chatHistory.get(roomId).push(newGameMessage);
      }
      
      io.to(roomId).emit('chat-message', newGameMessage);
    });
    
    // Event saat pemain disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      const room = rooms.get(roomId);
      if (!room) return;
      
      // Hapus pemain dari room
      const disconnectedPlayer = room.players.find(p => p.id === socket.id);
      room.players = room.players.filter(p => p.id !== socket.id);
      
      console.log(`Player ${socket.id} removed from room ${roomId}, ${room.players.length} players remaining`);
      
      // Tambahkan pesan sistem bahwa pemain keluar
      if (disconnectedPlayer) {
        const leaveMessage = {
          sender: 'Sistem',
          message: `${disconnectedPlayer.name} telah meninggalkan game`
        };
        
        if (chatHistory.has(roomId)) {
          chatHistory.get(roomId).push(leaveMessage);
        }
        
        io.to(roomId).emit('chat-message', leaveMessage);
      }
      
      // Jika room kosong, hapus room
      if (room.players.length === 0) {
        rooms.delete(roomId);
        chatHistory.delete(roomId);
        console.log(`Room ${roomId} deleted`);
        return;
      }
      
      // Jika game sedang berlangsung, akhiri game
      if (room.status === 'playing') {
        room.status = 'waiting';
        
        // Jika ada pemain yang tersisa, jadikan host
        if (room.players.length > 0 && !room.players.some(p => p.isHost)) {
          room.players[0].isHost = true;
          console.log(`Player ${room.players[0].id} promoted to host in room ${roomId}`);
          
          const promotedMessage = {
            sender: 'Sistem',
            message: `${room.players[0].name} sekarang menjadi host`
          };
          
          if (chatHistory.has(roomId)) {
            chatHistory.get(roomId).push(promotedMessage);
          }
          
          io.to(roomId).emit('chat-message', promotedMessage);
        }
        
        // Kirim update ke pemain yang tersisa
        io.to(roomId).emit('error-message', 'Lawan meninggalkan permainan');
      }
      
      // Kirim update room
      io.to(roomId).emit('room-update', {
        players: room.players,
        status: room.status,
      });
      
      // Hapus pemain dari daftar
      players.delete(socket.id);
    });
  });

  // Cari port yang tersedia dimulai dari 3000
  findAvailablePort(3000)
    .then(port => {
      server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Server berjalan di http://localhost:${port}`);
        console.log('> Buka browser dan akses URL di atas untuk bermain');
      });
    })
    .catch(err => {
      console.error('Gagal mencari port yang tersedia:', err);
      process.exit(1);
    });
}); 