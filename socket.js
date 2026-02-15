// socket.js
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

let io;

async function initializeSocket(httpServer) {
  if (io) return io; // singleton protection

  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },

    transports: ['polling', 'websocket'], // allow both
  });

  try {
    const pubClient = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      // password: process.env.REDIS_PASSWORD,
    });

    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.io initialized with Redis adapter.');
  } catch (err) {
    console.error('❌ Failed to connect Socket.io to Redis:', err.message);
  }

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.id;
    console.log(`Socket connected: ${userId}`);
    socket.join(userId);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${userId}`);
    });

    // Add your custom events here if needed globally
    // socket.on('join', (room) => socket.join(room));
  });

  return io;
}

module.exports = { initializeSocket, getIO: () => io };
