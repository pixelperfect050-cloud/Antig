const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    let uri = (process.env.MONGODB_URI || '').trim();
    const isProduction = process.env.NODE_ENV === 'production';
    let connectWithMemory = false;

    if (!uri) {
      console.warn('MONGODB_URI is missing');
      if (isProduction) {
        console.error('CRITICAL: MONGODB_URI required in production. Staying alive for health checks but DB features will fail.');
        return;
      }
      connectWithMemory = true;
    } else {
      // Ensure we have a database name in the URI to avoid 'test' default
      if (!uri.includes('mongodb.net/') || uri.split('mongodb.net/')[1].split('?')[0] === '') {
        const parts = uri.split('?');
        const base = parts[0].endsWith('/') ? parts[0] : parts[0] + '/';
        uri = `${base}artflow_studio${parts[1] ? '?' + parts[1] : ''}`;
        console.log('Appended default database name to URI');
      }

      try {
        const obfuscatedUri = uri.replace(/\/\/.*@/, '//****:****@');
        console.log('Connecting to MongoDB Atlas with URI:', obfuscatedUri);
        
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 30000, // Increased to 30s
          socketTimeoutMS: 45000,
          family: 4,
        });
        console.log('MongoDB Connected successfully to:', mongoose.connection.name);
      } catch (err) {
        console.error('MongoDB connection failed after timeout:', err.message);
        if (isProduction) {
          console.error('Production DB connection failed. Staying alive for health checks.');
          return;
        }
        connectWithMemory = true;
      }
    }

    if (connectWithMemory) {
      console.log('Falling back to memory DB...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
        console.log('Memory DB Connected');
      } catch (memErr) {
        console.error('Failed to start memory DB:', memErr.message);
      }
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const User = require('../models/User');
        const bcrypt = require('bcryptjs');
        const defaultAdminPw = 'Dhuzy@200819'; // Forced hardcode to override any env variables
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
          const hashed = await bcrypt.hash(defaultAdminPw, 10);
          await User.create({
            name: 'Admin',
            email: 'admin@artflow.studio',
            password: hashed,
            company: 'ArtFlow Studio',
            role: 'admin',
          });
          console.log('Default admin created');
        } else {
          // Update admin password if it doesn't match the configured one
          const pwMatch = await bcrypt.compare(defaultAdminPw, adminExists.password);
          if (!pwMatch) {
            adminExists.password = await bcrypt.hash(defaultAdminPw, 10);
            await adminExists.save();
            console.log('Admin password updated to match configured password');
          }
        }
      } catch (adminErr) {
        console.warn('Admin check failed:', adminErr.message);
      }
    } else {
      console.warn('Skipping admin check because DB is not ready');
    }
  } catch (err) {
    console.error('Fatal DB error during initialization:', err.message);
  }
};

module.exports = { connectDB };
