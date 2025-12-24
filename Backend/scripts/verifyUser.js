const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');

dotenv.config();

async function verifyUser() {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    
    if (!MONGO_URI) {
      console.error('❌ MONGO_URI not found in .env');
      return;
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if user exists
    const user = await User.findOne({ email: 'mahmood.hassan7114@gmail.com' });
    
    if (user) {
      console.log('✅ User found in database:');
      console.log({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        projectIds: user.projectIds,
        createdAt: user.createdAt
      });
    } else {
      console.log('❌ User NOT found in database');
      console.log('\n📋 Please insert this document in MongoDB Compass:');
      console.log('\nCollection: users');
      console.log('Database: (your database name from MONGO_URI)');
      console.log('\nDocument to insert:');
      console.log(JSON.stringify({
        name: "Mahmood Hassan",
        email: "mahmood.hassan7114@gmail.com",
        passwordHash: "$2b$10$v7d0phRP0wA09nC7vHGuq.Z6x2sg/h5Z7okVFQeLwoc2Rfw1yIr7m",
        role: "admin",
        projectIds: []
      }, null, 2));
    }

    // List all users
    const allUsers = await User.find().select('-passwordHash');
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log('\nAll users:');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.role})`);
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

verifyUser();

