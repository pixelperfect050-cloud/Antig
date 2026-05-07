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

    // Seed admin user or update password
    const User = require('../models/User');
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      const hashed = await bcrypt.hash('Dhuzy@200819', 10);
      await User.create({
        name: 'Admin',
        email: 'admin@artflow.studio',
        password: hashed,
        company: 'ArtFlow Studio',
        role: 'admin',
      });
      console.log('👤 Admin seeded → admin@artflow.studio');
    } else {
      // Update admin password
      const hashed = await bcrypt.hash('Dhuzy@200819', 10);
      await User.findByIdAndUpdate(adminExists._id, { password: hashed });
      console.log('🔑 Admin password updated');
    }

  } catch (err) {
    console.error('❌ DB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };