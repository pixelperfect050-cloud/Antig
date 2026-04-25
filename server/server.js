require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const path = require('path');
const { connectDB } = require('./src/config/db');
const { initializeSocket } = require('./src/services/socketService');
const authRoutes = require('./src/routes/authRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
app.set('io', io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/orders', orderRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🚀 ArtFlow Studio API → http://localhost:${PORT}`);
    console.log(`📡 WebSocket ready`);
    console.log(`🌍 ${process.env.NODE_ENV || 'development'}\n`);
  });
})();
