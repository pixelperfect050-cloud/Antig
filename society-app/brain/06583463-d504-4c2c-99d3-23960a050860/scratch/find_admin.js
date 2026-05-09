const mongoose = require('mongoose');

const mongoUri = "mongodb://societyapp_user:SocietyApp2026Secure@ac-pm3r96y-shard-00-00.4v6flij.mongodb.net:27017,ac-pm3r96y-shard-00-01.4v6flij.mongodb.net:27017,ac-pm3r96y-shard-00-02.4v6flij.mongodb.net:27017/society-app?ssl=true&replicaSet=atlas-14bidm-shard-0&authSource=admin&retryWrites=true&w=majority";

async function findAdmin() {
  try {
    await mongoose.connect(mongoUri);
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String,
      name: String
    }));
    const admin = await User.findOne({ role: 'admin' });
    console.log('Admin found:', admin);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findAdmin();
