const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // In production, MONGODB_URI is required
    if (!uri && process.env.NODE_ENV === 'production') {
      console.error('❌ MONGODB_URI is required in production!');
      process.exit(1);
    }

    // Fallback to in-memory MongoDB for local development only
    if (!uri) {
      console.log('⚠️  MONGODB_URI not set — using in-memory MongoDB for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    }

    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

    // Seed admin user
    const User = require('../models/User');
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      const hashed = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'Admin',
        email: 'admin@artflow.studio',
        password: hashed,
        company: 'ArtFlow Studio',
        role: 'admin',
      });
      console.log('👤 Admin seeded → admin@artflow.studio / admin123');
    }

  } catch (err) {
    console.error('❌ DB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };