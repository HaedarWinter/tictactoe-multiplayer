import { io, Socket } from 'socket.io-client';

// Variabel untuk menyimpan instance socket
let socket: Socket | null = null;

// Fungsi untuk menginisialisasi socket
export const initSocket = async (
  roomId: string,
  playerName: string,
  isHost: boolean
): Promise<Socket> => {
  // Jika socket sudah ada, kembalikan
  if (socket && socket.connected) return socket;
  
  // Jika socket ada tapi tidak terhubung, putuskan koneksi
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  try {
    // Tentukan URL socket berdasarkan environment
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    console.log('Connecting to socket URL:', socketUrl);
    
    // Buat instance socket baru dengan konfigurasi yang sederhana
    socket = io(socketUrl, {
      path: '/api/socketio',
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      forceNew: true,
      query: {
        roomId,
        playerName,
        isHost: isHost ? 'true' : 'false',
      },
    });

    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error('Failed to create socket'));

      // Tunggu sampai socket terhubung
      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
        resolve(socket as Socket);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        console.error('Socket connection error details:', JSON.stringify(err));
        reject(err);
      });

      // Timeout jika koneksi terlalu lama
      setTimeout(() => {
        if (socket && !socket.connected) {
          console.error('Connection timeout after 20 seconds');
          reject(new Error('Connection timeout'));
        }
      }, 20000);
    });
  } catch (err) {
    console.error('Error initializing socket:', err);
    throw err;
  }
};

// Fungsi untuk mendapatkan instance socket yang ada
export const getSocket = (): Socket | null => {
  return socket;
};

// Fungsi untuk memutuskan koneksi socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 