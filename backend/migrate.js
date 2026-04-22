require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatapp');
  console.log('Connected. Running migration...');
  
  const users = await User.find({ shortId: { $exists: false } });
  for (let user of users) {
    user.shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    await user.save();
    console.log(`Updated user ${user.username} with shortId ${user.shortId}`);
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrate();
