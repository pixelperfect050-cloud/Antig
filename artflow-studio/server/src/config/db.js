const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    let uri = (process.env.MONGODB_URI || '').trim();
    const isProduction = process.env.NODE_ENV === 'production';
    let connectWithMemory = false;

    if (!uri) {
      if (isProduction) {
        console.error('MONGODB_URI required in production');
        process.exit(1);
      }
      connectWithMemory = true;
    } else {
      try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log('MongoDB Connected successfully');
      } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        // Do not exit process, let it stay alive for health check
        connectWithMemory = true;
      }
    }

    if (connectWithMemory) {
      if (isProduction) {
        console.error('Database connection failed. Memory DB fallback disabled in production.');
        return; // Just return, don't try to start memory server
      }
      console.log('Falling back to memory DB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('Memory DB Connected');
    }

    // Only check/create admin if connection was successful
    if (mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      const adminExists = await User.findOne({ role: 'admin' }).catch(() => null);
      if (!adminExists) {
        const hashed = await require('bcryptjs').hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
        await User.create({
          name: 'Admin',
          email: 'admin@artflow.studio',
          password: hashed,
          company: 'ArtFlow Studio',
          role: 'admin',
        });
        console.log('Default admin created');
      }
    } else {
      console.warn('Skipping admin check because DB is not ready');
    }
  } catch (err) {
    console.error('Fatal DB error:', err.message);
  }
};

module.exports = { connectDB };
