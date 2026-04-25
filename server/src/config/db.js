const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI; // ⚠️ yahi naam use kar (Render me bhi same)

    if (!uri) {
      throw new Error("❌ MONGO_URI not found in environment variables");
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