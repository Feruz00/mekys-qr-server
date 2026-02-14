require('dotenv').config();
const app = require('./app');
const db = require('./models');
const http = require('http');
const { initializeSocket } = require('./socket');
const server = http.createServer(app);
const PORT = process.env.PORT || 3006;

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    initializeSocket(server);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.log(error);
    console.log('⏳ Retrying server start in 5s...');
  }
}

startServer();

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('SIGINT', async () => {
  console.log('🛑 Gracefully shutting down...');
  process.exit(0);
});
