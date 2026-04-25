const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const dbConfig = require('./config/db');
const { saveMessage } = require('./controllers/chatController');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.locals.io = io;
const port = process.env.PORT || 5000;

app.use(cors());
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), require('./controllers/paymentController').webhook);
app.use(express.json());

// ─── Socket.io ────────────────────────────────────────────────────────────────

const verifySocketToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token;
  const user = token ? verifySocketToken(token) : null;

  // ── Client: join their private room ──
  if (user && user.role === 'client') {
    const room = `user_${user.userId}`;
    socket.join(room);
    socket.data.user = user;

    socket.on('client_message', async ({ message }) => {
      if (!message?.trim()) return;
      try {
        const saved = await saveMessage(user.userId, user.userId, user.username || user.email, 'client', message.trim());
        // Send to client's own room (they see it)
        io.to(room).emit('new_message', saved);
        // Notify all support agents
        io.to('support_room').emit('new_client_message', { ...saved, roomUserId: user.userId });
      } catch (e) { console.error('Socket message save error:', e.message); }
    });
  }

  // ── Support / Admin: join support room ──
  if (user && ['support', 'admin'].includes(user.role)) {
    socket.join('support_room');
    socket.data.user = user;

    socket.on('support_message', async ({ targetUserId, message }) => {
      if (!message?.trim() || !targetUserId) return;
      try {
        const saved = await saveMessage(targetUserId, user.userId, user.username || user.email, user.role, message.trim());
        // Send to the specific user's room
        io.to(`user_${targetUserId}`).emit('new_message', saved);
        // Also echo to all support agents (so other agents see it)
        io.to('support_room').emit('support_sent', { ...saved, roomUserId: targetUserId });
      } catch (e) { console.error('Support message error:', e.message); }
    });

    // Support joins a specific user's room to track it (optional real-time)
    socket.on('watch_user', ({ userId }) => {
      socket.join(`watching_${userId}`);
    });

    socket.on('unwatch_user', ({ userId }) => {
      socket.leave(`watching_${userId}`);
    });
  }

  socket.on('disconnect', () => {});
});

// ─── Routes ───────────────────────────────────────────────────────────────────

async function startServer() {
  try {
    await dbConfig.connectDB();

    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/products', require('./routes/productRoutes'));
    app.use('/api/products/:productId/reviews', require('./routes/reviewRoutes'));
    app.use('/api/cart', require('./routes/cartRoutes'));
    app.use('/api/orders', require('./routes/orderRoutes'));
    app.use('/api/profile', require('./routes/profileRoutes'));
    app.use('/api/payment', require('./routes/paymentRoutes'));
    app.use('/api/wishlist', require('./routes/wishlistRoutes'));
    app.use('/api/coupons', require('./routes/couponRoutes'));
    app.use('/api/analytics', require('./routes/analyticsRoutes'));
    app.use('/api/upload', require('./routes/uploadRoutes'));
    app.use('/api/flash-sales', require('./routes/flashSaleRoutes'));
    app.use('/api/loyalty', require('./routes/loyaltyRoutes'));
    app.use('/api/stock-alerts', require('./routes/stockAlertRoutes'));
    app.use('/api/returns', require('./routes/returnRoutes'));
    app.use('/api/marketing', require('./routes/marketingRoutes'));
    app.use('/api/contact', require('./routes/contactRoutes'));
    app.use('/api/chat', require('./routes/chatRoutes'));

    app.get('/', (req, res) => res.send('Backend API is running!'));
    server.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
process.on('SIGINT', async () => { await dbConfig.disconnectDB(); process.exit(0); });
