require('dotenv').config();
const mongoose = require('mongoose');
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
const quoteRoutes = require('./src/routes/quoteRoutes');
const creditRoutes = require('./src/routes/creditRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const scratchRoutes = require('./src/routes/scratchRoutes');

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
app.set('io', io);

// CORS — MUST come before helmet so preflight OPTIONS get proper headers
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://artflow-live.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
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
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Apply CORS first — including preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // explicit preflight for all routes

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.get('origin') || 'no-origin'}`);
  next();
});

// Helmet — after CORS so it doesn't override Access-Control headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
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
app.use('/api/quotes', quoteRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/scratch', scratchRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString(), db: mongoose.connection.readyState }));

// Root test route
app.get('/api', (_req, res) => res.json({ message: 'ArtFlow Studio API is running 🚀', ts: new Date().toISOString() }));

// Serve frontend in production (only for non-API routes)
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));
  // Only serve index.html for non-API routes
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT} at 0.0.0.0`);
  // Connect to DB in background so we don't block Render health check
  connectDB().catch(err => console.error('Background DB connection failed:', err.message));

  if (process.env.RENDER_EXTERNAL_URL) {
    const https = require('https');
    const keepAliveUrl = process.env.RENDER_EXTERNAL_URL;
    const KEEP_ALIVE_MS = 10 * 60 * 1000;
    
    console.log(`Keep-alive enabled for: ${keepAliveUrl}`);
    
    setTimeout(() => {
      https.get(`${keepAliveUrl}/api/health`, (res) => {
        console.log(`Keep-alive ping status: ${res.statusCode}`);
      }).on('error', (err) => console.log('Keep-alive ping failed:', err.message));
    }, 30000);

    setInterval(() => {
      https.get(`${keepAliveUrl}/api/health`, (res) => {
        console.log(`Keep-alive interval ping status: ${res.statusCode}`);
      }).on('error', (err) => console.log('Keep-alive interval ping failed:', err.message));
    }, KEEP_ALIVE_MS);
  }
});
