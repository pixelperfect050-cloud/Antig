const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

async function findImran() {
  try {
    await mongoose.connect(mongoUri);
    const user = await User.findOne({ name: /Imran/i, role: 'admin' });
    console.log('User found:', JSON.stringify(user, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findImran();
