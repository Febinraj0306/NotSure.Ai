import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import checkRoutes from './routes/check.js';
import devicesRoutes from './routes/devices.js';
import alertsRoutes from './routes/alerts.js';
import whitelistRoutes from './routes/whitelist.js';
import { isFirebaseReady } from './services/fcmService.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  // Allow web client, mobile dev server, and any Expo Go / EAS origin
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_ORIGIN || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    // Always allow localhost variations and Expo tunnels
    const alwaysAllow = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:19006',
      'http://localhost:8081'
    ];

    // No origin = mobile app / curl / Postman — allow
    if (!origin) return callback(null, true);

    const isAllowed =
      [...allowed, ...alwaysAllow].includes(origin) ||
      origin.startsWith('exp://') ||
      origin.startsWith('https://') ||
      origin.endsWith('.exp.direct');

    callback(null, isAllowed);
  },
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    firebase: isFirebaseReady() ? 'ready' : 'not_configured',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api', checkRoutes);
app.use('/api', devicesRoutes);
app.use('/api', alertsRoutes);
app.use('/api', whitelistRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[GlobalError]', err);
  } else {
    console.error('[GlobalError]', err.message || err);
  }
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// Connect to MongoDB then start server
async function start() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/truthcheck';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed — recent checks will not be saved:', err.message);
    console.warn('   Set MONGODB_URI in .env to enable persistence.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 TruthCheck server running on http://localhost:${PORT}`);
    console.log(`   GEMINI_API_KEY:    ${process.env.GEMINI_API_KEY ? '✅ set' : '❌ missing'}`);
    console.log(`   TAVILY_API_KEY:    ${process.env.TAVILY_API_KEY ? '✅ set' : '⚪ not set (optional)'}`);
    console.log(`   SERPER_API_KEY:    ${process.env.SERPER_API_KEY ? '✅ set' : '⚪ not set (optional)'}`);
    console.log(`   MONGODB_URI:       ${process.env.MONGODB_URI ? '✅ set' : '⚪ using localhost default'}`);
    console.log(`   FIREBASE:          ${isFirebaseReady() ? '✅ ready' : '⚪ not configured (push notifications disabled)'}`);
  });
}

start();
