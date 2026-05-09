const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ email: 'test_admin@societysync.com' });
    if (existing) await User.deleteOne({ email: 'test_admin@societysync.com' });

    const user = new User({
      name: 'Test Admin',
      email: 'test_admin@societysync.com',
      phone: '0000000000',
      password: 'test123',
      role: 'admin',
      societyId: new mongoose.Types.ObjectId('69f8e2fcf8aeb0a0d3fbb051'),
      status: 'approved'
    });
    await user.save();
    console.log('Test Admin created!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createTestAdmin();
