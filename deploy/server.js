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
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
app.set('io', io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS — allow all Vercel preview/production domains + localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any Vercel domain
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    // Allow explicit origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow everything
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Root test route
app.get('/api', (_req, res) => res.json({ message: 'ArtFlow Studio API is running 🚀', ts: new Date().toISOString() }));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

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
    console.log(`💳 Payments → ${process.env.RAZORPAY_KEY_ID ? 'Razorpay LIVE' : 'Demo Mode'}`);
    console.log(`🌍 ${process.env.NODE_ENV || 'development'}\n`);
  });
})();
