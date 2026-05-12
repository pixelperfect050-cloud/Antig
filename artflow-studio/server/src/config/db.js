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
        if (isProduction) process.exit(1);
        connectWithMemory = true;
      }
    }

    if (connectWithMemory) {
      console.log('Falling back to memory DB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('Memory DB Connected');
    }

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
    }
  } catch (err) {
    console.error('Fatal DB error:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
